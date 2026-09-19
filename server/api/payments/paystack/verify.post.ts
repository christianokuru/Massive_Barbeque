import { z } from 'zod';
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";
import { assertOrderAccess } from "~~/server/utils/orderAccess";

// Display-only: never writes to the DB (webhooks are the sole paid
// writer). Returns a minimal paid/orderId/amount tuple — never the raw
// provider payload (it carries customer email, card auth/BIN, etc.).
const paystackVerifySchema = z.object({
  reference: z.string().min(1).max(200),
  guestToken: z.string().max(4096).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readValidatedBody(event, paystackVerifySchema.parse);
    const ip = getClientIp(event);
    const { limited } = isRateLimited(`pay-verify:${ip}:${body.reference.slice(0, 64)}`, { limit: 60, windowSecs: 3600 });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many verification attempts. Try again later." });
    }

    const { getServiceSupabase } = await import("~~/server/utils/supabase");
    const supabase = getServiceSupabase();
    // References are ours (un-guessable PAY_uuid): unknown ones 404 so
    // this can't be used as a general provider oracle.
    const { data: payment } = await supabase
      .from("payments")
      .select("order_id, reference")
      .eq("provider", "paystack")
      .eq("reference", body.reference)
      .maybeSingle();
    if (!payment) {
      throw createError({ statusCode: 404, statusMessage: "Transaction not found." });
    }
    const { order } = await assertOrderAccess(event, payment.order_id, body.guestToken);

    // Call Paystack API to verify transaction
    const response = await fetch(`https://api.paystack.co/transaction/verify/${body.reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.status) {
      throw createError({
        statusCode: 400,
        statusMessage: data.message || 'Failed to verify payment',
      });
    }

    // Bind the provider answer to OUR order before calling it paid:
    // matching reference, success status, amount >= total (kobo), NGN.
    const expectedKobo = Math.round(Number(order.total) * 100);
    const paid =
      data.data?.status === "success" &&
      data.data?.reference === payment.reference &&
      data.data?.currency === "NGN" &&
      Number.isFinite(Number(data.data?.amount)) &&
      Number(data.data.amount) >= expectedKobo &&
      String(data.data?.metadata?.order_id || payment.order_id) === payment.order_id;

    return {
      success: true,
      paid,
      orderId: payment.order_id,
      amount: Number(order.total),
      currency: "NGN",
    };
  } catch (error: any) {
    console.error('Paystack verification error:', error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid form data',
        data: error.errors,
      });
    }
    // Preserve inner codes (notably 429) — never mask them as 500.
    if (error?.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to verify payment',
    });
  }
});
