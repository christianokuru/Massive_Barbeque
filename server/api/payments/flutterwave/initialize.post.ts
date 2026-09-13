import { z } from 'zod';
import crypto from 'crypto';
import { confirmUrl } from "~~/server/utils/siteUrl";
import { isRateLimited } from "~~/server/utils/rateLimit";

// The amount is NEVER taken from the client: it is loaded from the
// server-priced order (see paystack sibling for the attack).
const flutterwaveInitializeSchema = z.object({
  email: z.string().email(),
  orderId: z.string().uuid(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const ip = getRequestIP(event) || "unknown";
    const { limited } = isRateLimited(`pay-init:${ip}`, { limit: 30, windowSecs: 3600 });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many payment attempts. Try again later." });
    }
    const body = await readValidatedBody(event, flutterwaveInitializeSchema.parse);

    const { getServiceSupabase } = await import("~~/server/utils/supabase");
    const supabase = getServiceSupabase();
    const { data: order } = await supabase
      .from("orders")
      .select("id, total, payment_method, payment_status")
      .eq("id", body.orderId)
      .single();
    if (!order) {
      throw createError({ statusCode: 404, statusMessage: "Order not found." });
    }
    if (order.payment_status === "paid") {
      throw createError({ statusCode: 400, statusMessage: "Order is already paid." });
    }
    if (order.payment_method !== "flutterwave") {
      throw createError({ statusCode: 400, statusMessage: "Order is not a Flutterwave order." });
    }
    const amount = Number(order.total);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw createError({ statusCode: 400, statusMessage: "Order has no payable total." });
    }

    const txRef = `FLW_${crypto.randomUUID()}`;
    // Return to wherever checkout ran (localhost in dev) so the
    // gateway can actually reach /checkout/confirm. The order is also
    // recovered from verify metadata if params get mangled.
    const redirectUrl = confirmUrl(event, body.orderId);

    const payload = {
      tx_ref: txRef,
      amount,
      currency: 'NGN',
      email: body.email,
      customer: {
        email: body.email,
        name: body.customerName || '',
        phone: body.customerPhone || '',
      },
      redirect_url: redirectUrl,
      meta: {
        orderId: body.orderId,
        ...body.metadata,
      },
    };

    // Call Flutterwave API to initialize transaction
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.flutterwaveSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.status !== 'success') {
      throw createError({
        statusCode: 400,
        statusMessage: data.message || 'Failed to initialize payment',
      });
    }

    // Record the pending payment so the webhook can confirm the order.
    // NOTE: v3 /payments responds with `{ link }` only — the tx_ref is
    // the one we generated above, not anything in the response.
    await supabase
      .from("payments")
      .upsert(
        {
          order_id: body.orderId,
          provider: "flutterwave",
          reference: txRef,
          amount,
          currency: "NGN",
          status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "reference" }
      );

    return {
      success: true,
      link: data.data.link,
      tx_ref: txRef,
    };
  } catch (error: any) {
    console.error('Flutterwave initialization error:', error);
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid form data',
        data: error.errors,
      });
    }
    if (error?.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to initialize payment',
    });
  }
});