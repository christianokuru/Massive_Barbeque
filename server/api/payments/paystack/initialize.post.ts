import { z } from 'zod';
import crypto from 'crypto';
import { confirmUrl } from "~~/server/utils/siteUrl";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";
import { assertOrderAccess } from "~~/server/utils/orderAccess";

// The amount is NEVER taken from the client: it is loaded from the
// server-priced order, otherwise an attacker could pay ₦100 for a
// ₦21,000 order and the webhook would mark it paid.
const paystackInitializeSchema = z.object({
  email: z.string().email().max(254),
  orderId: z.string().uuid(),
  // Signed guest token (required for guest orders — UUID alone is
  // not authorization). Capped strings only, never objects.
  guestToken: z.string().max(4096).optional(),
  // zod v3 has no .max() on records — cap entries via refine.
  metadata: z
    .record(z.string().max(500))
    .optional()
    .refine(
      (v) =>
        !v ||
        (Object.keys(v).length <= 10 &&
          Object.keys(v).every((k) => k.length <= 100)),
      { message: "Too much metadata" }
    ),
});

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readValidatedBody(event, paystackInitializeSchema.parse);
    const ip = getClientIp(event);
    const { limited } = isRateLimited(`pay-init:${ip}:${body.orderId}`, { limit: 10, windowSecs: 3600 });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many payment attempts. Try again later." });
    }

    const { getServiceSupabase } = await import("~~/server/utils/supabase");
    const supabase = getServiceSupabase();
    // Ownership first: strangers can't init payment on (or probe) orders.
    const { order } = await assertOrderAccess(event, body.orderId, body.guestToken);
    if (order.payment_status === "paid") {
      throw createError({ statusCode: 400, statusMessage: "Order is already paid." });
    }
    if (order.payment_method !== "paystack") {
      throw createError({ statusCode: 400, statusMessage: "Order is not a Paystack order." });
    }
    // Cap pending rows per order: each init mints a fresh reference, so
    // an unbounded caller could spam the payments table + gateway emails.
    const { count: pendingCount } = await supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("order_id", body.orderId)
      .eq("provider", "paystack")
      .eq("status", "pending");
    if ((pendingCount ?? 0) >= 5) {
      throw createError({
        statusCode: 429,
        statusMessage: "Too many pending payments for this order. Complete or wait before retrying.",
      });
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
      // Receipts go to the order's buyer address, never a client-supplied
      // one (prevents receipt/confirmation hijacking).
      email: (order as any).customer_email || body.email,
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