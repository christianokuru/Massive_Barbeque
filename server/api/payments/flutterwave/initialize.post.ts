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
// server-priced order (see paystack sibling for the attack).
const flutterwaveInitializeSchema = z.object({
  email: z.string().email().max(254),
  orderId: z.string().uuid(),
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().max(30).optional(),
  // Signed guest token (required for guest orders). Capped strings only.
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
    const body = await readValidatedBody(event, flutterwaveInitializeSchema.parse);
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
    if (order.payment_method !== "flutterwave") {
      throw createError({ statusCode: 400, statusMessage: "Order is not a Flutterwave order." });
    }
    // Cap pending rows per order (each init mints a fresh tx_ref).
    const { count: pendingCount } = await supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("order_id", body.orderId)
      .eq("provider", "flutterwave")
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

    const txRef = `FLW_${crypto.randomUUID()}`;
    // Return to wherever checkout ran (localhost in dev) so the
    // gateway can actually reach /checkout/confirm. The order is also
    // recovered from verify metadata if params get mangled.
    const redirectUrl = confirmUrl(event, body.orderId);

    const buyerEmail = (order as any).customer_email || body.email;
    const payload = {
      tx_ref: txRef,
      amount,
      currency: 'NGN',
      email: buyerEmail,
      customer: {
        email: buyerEmail,
        name: body.customerName || '',
        phone: body.customerPhone || '',
      },
      redirect_url: redirectUrl,
      // orderId is forced AFTER the client spread so it can't be
      // overridden to point at someone else's order.
      meta: {
        ...body.metadata,
        orderId: body.orderId,
      },
    };

    // Record the pending payment BEFORE the buyer can pay: the webhook
    // only credits payments it can find, so if this write fails we stop
    // here instead of taking money we can't match to the order.
    const { error: recordError } = await supabase.from("payments").insert({
      order_id: body.orderId,
      provider: "flutterwave",
      reference: txRef,
      amount,
      currency: "NGN",
      status: "pending",
      updated_at: new Date().toISOString(),
    });
    if (recordError) {
      console.error("Flutterwave pending-payment record failed:", recordError.message || recordError);
      throw createError({
        statusCode: 503,
        statusMessage: "Couldn't start payment right now. Please try again.",
      });
    }

    // Call Flutterwave API to initialize transaction. v3 /payments
    // responds with `{ link }` only — the tx_ref is ours.
    let data: any = null;
    try {
      const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.flutterwaveSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      data = await response.json().catch(() => null);
    } catch {
      data = null;
    }

    if (data?.status !== 'success' || !data?.data?.link) {
      // Nothing can be paid on this reference — retire it so it doesn't
      // count toward the pending cap.
      await supabase
        .from("payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("reference", txRef)
        .eq("status", "pending");
      throw createError({
        statusCode: 502,
        statusMessage: data?.message || 'Failed to initialize payment',
      });
    }

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
      statusMessage: 'Failed to initialize payment',
    });
  }
});