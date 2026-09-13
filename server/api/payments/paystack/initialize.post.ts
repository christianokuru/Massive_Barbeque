import { z } from 'zod';
import crypto from 'crypto';
import { confirmUrl } from "~~/server/utils/siteUrl";
import { isRateLimited } from "~~/server/utils/rateLimit";

// The amount is NEVER taken from the client: it is loaded from the
// server-priced order, otherwise an attacker could pay ₦100 for a
// ₦21,000 order and the webhook would mark it paid.
const paystackInitializeSchema = z.object({
  email: z.string().email(),
  orderId: z.string().uuid(),
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
    const body = await readValidatedBody(event, paystackInitializeSchema.parse);

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
    if (order.payment_method !== "paystack") {
      throw createError({ statusCode: 400, statusMessage: "Order is not a Paystack order." });
    }
    const amount = Number(order.total);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw createError({ statusCode: 400, statusMessage: "Order has no payable total." });
    }

    const reference = `PAY_${crypto.randomUUID()}`;
    const amountInKobo = Math.round(amount * 100); // Paystack uses kobo
    // Return to wherever checkout ran (localhost in dev) so the
    // gateway can actually reach /checkout/confirm with the order.
    // Paystack appends its own trxref/reference params.
    const callbackUrl = confirmUrl(event, body.orderId);

    const payload = {
      email: body.email,
      amount: amountInKobo,
      reference,
      callback_url: callbackUrl,
      metadata: {
        ...body.metadata,
        orderId: body.orderId,
        custom_fields: [
          {
            display_name: "Order ID",
            variable_name: "order_id",
            value: body.orderId || reference,
          },
        ],
      },
    };

    // Call Paystack API to initialize transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.status) {
      throw createError({
        statusCode: 400,
        statusMessage: data.message || 'Failed to initialize payment',
      });
    }

    // Record the pending payment so the webhook can confirm the order.
    await supabase
      .from("payments")
      .upsert(
        {
          order_id: body.orderId,
          provider: "paystack",
          reference: data.data.reference,
          amount,
          currency: "NGN",
          status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "reference" }
      );

    return {
      success: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      access_code: data.data.access_code,
    };
  } catch (error: any) {
    console.error('Paystack initialization error:', error);
    
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