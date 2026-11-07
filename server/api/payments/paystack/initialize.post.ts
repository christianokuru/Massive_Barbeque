import { z } from 'zod';
import crypto from 'crypto';
import { confirmUrl } from "~~/server/utils/siteUrl";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";
import { assertOrderAccess } from "~~/server/utils/orderAccess";
import { canStartPayment } from "~~/shared/utils/orderStatus";

// Pending attempts older than this are abandoned and stop counting
// toward the per-order cap (otherwise 5 abandoned tries lock an order
// out of payment forever).
const PENDING_WINDOW_MS = 60 * 60 * 1000;

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
    // Never take new money for paid, refunded, cancelled or completed orders.
    const payable = canStartPayment(order.status, order.payment_status);
    if (!payable.ok) {
      throw createError({ statusCode: 400, statusMessage: payable.reason });
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
      .eq("status", "pending")
      .gte("created_at", new Date(Date.now() - PENDING_WINDOW_MS).toISOString());
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

    // Record the pending payment BEFORE the buyer can pay: the webhook
    // only credits payments it can find, so if this write fails we stop
    // here instead of taking money we can't match to the order.
    const { error: recordError } = await supabase.from("payments").insert({
      order_id: body.orderId,
      provider: "paystack",
      reference,
      amount,
      currency: "NGN",
      status: "pending",
      updated_at: new Date().toISOString(),
    });
    if (recordError) {
      console.error("Paystack pending-payment record failed:", recordError.message || recordError);
      throw createError({
        statusCode: 503,
        statusMessage: "Couldn't start payment right now. Please try again.",
      });
    }

    // Call Paystack API to initialize transaction (with OUR reference).
    let data: any = null;
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      data = await response.json().catch(() => null);
    } catch {
      data = null;
    }

    if (!data?.status || !data?.data?.authorization_url) {
      // Nothing can be paid on this reference — retire it so it doesn't
      // count toward the pending cap.
      await supabase
        .from("payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("reference", reference)
        .eq("status", "pending");
      throw createError({
        statusCode: 502,
        statusMessage: data?.message || 'Failed to initialize payment',
      });
    }

    return {
      success: true,
      authorization_url: data.data.authorization_url,
      reference,
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
      statusMessage: 'Failed to initialize payment',
    });
  }
});