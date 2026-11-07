import crypto from "crypto";
import { getServiceSupabase } from "~~/server/utils/supabase";
import { isTerminalOrderStatus } from "~~/shared/utils/orderStatus";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";

function signaturesEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    // Webhooks are unauthenticated provider callbacks: throttle floods
    // (auth failures below return 401/400, never 500, so the gateway
    // doesn't retry-storm on forgeries).
    const ip = getClientIp(event);
    const { limited } = isRateLimited(`webhook-paystack:${ip}`, { limit: 300, windowSecs: 3600 });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many requests." });
    }

    const rawBody = await readRawBody(event, "utf8");
    let body: any;
    try {
      body = JSON.parse(rawBody || "{}");
    } catch {
      throw createError({ statusCode: 400, statusMessage: "Invalid JSON" });
    }

    // Get Paystack signature from headers
    const signature = getHeader(event, "x-paystack-signature");

    if (!signature) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing signature",
      });
    }

    // Verify webhook signature over the RAW body (exact bytes Paystack signed).
    const hash = crypto
      .createHmac("sha512", config.paystackSecretKey)
      .update(rawBody || "")
      .digest("hex");

    if (!signaturesEqual(hash, signature)) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid signature",
      });
    }

    // Process webhook event
    if (body.event === "charge.success") {
      const paymentData = body.data || {};
      if (typeof paymentData.reference !== "string" || !paymentData.reference) {
        return { success: true };
      }
      const supabase = getServiceSupabase();

      // Read errors throw → 500 → the provider retries later. Never
      // acknowledge an event we couldn't check.
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("order_id, status")
        .eq("reference", paymentData.reference)
        .maybeSingle();
      if (paymentError) throw paymentError;

      if (payment) {
        if (payment.status === "refunded") return { success: true };

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select("id, total, status, payment_status")
          .eq("id", payment.order_id)
          .maybeSingle();
        if (orderError) throw orderError;

        // Idempotency: fully recorded already (payment AND order) → done.
        // A payment marked paid whose order update failed earlier falls
        // through so this retry can finish the job.
        const orderSettled =
          !order ||
          order.payment_status === "paid" ||
          order.payment_status === "refunded" ||
          isTerminalOrderStatus(order.status);
        if (payment.status === "paid" && orderSettled) return { success: true };

        // Amount guard: never mark an order paid for less than its total
        // (Paystack reports kobo). Mismatches are logged, not retried.
        const expectedKobo = order ? Math.round(Number(order.total) * 100) : NaN;
        if (
          !order ||
          paymentData.currency !== "NGN" ||
          !Number.isFinite(Number(paymentData.amount)) ||
          Number(paymentData.amount) < expectedKobo
        ) {
          console.error(
            `Paystack amount mismatch for ${paymentData.reference}: got ${paymentData.amount} ${paymentData.currency}, expected >= ${expectedKobo} kobo`
          );
          return { success: true };
        }

        // Independent re-verification: the header proves the payload came
        // from Paystack, but a leaked secret would still mint free "paid"
        // orders — confirm with Paystack before writing money state.
        const verifyRes = await fetch(
          `https://api.paystack.co/transaction/verify/${paymentData.reference}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${config.paystackSecretKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        const verifyData = await verifyRes.json().catch(() => null);
        // Provider outage / unreadable answer proves nothing either way:
        // 500 so the provider redelivers later, rather than dropping it.
        if (!verifyData || verifyRes.status >= 500) {
          throw new Error("Paystack re-verify unavailable");
        }
        const verified =
          verifyData?.status === true &&
          verifyData?.data?.status === "success" &&
          verifyData?.data?.reference === paymentData.reference &&
          verifyData?.data?.currency === "NGN" &&
          Number(verifyData?.data?.amount) >= expectedKobo;
        if (!verified) {
          console.error(`Paystack re-verify failed for ${paymentData.reference}`);
          return { success: true };
        }

        // Checked writes: a failure throws → 500 → the provider retries,
        // instead of a silent "ok" that leaves a paid order stuck pending.
        if (payment.status !== "paid") {
          await supabase
            .from("payments")
            .update({
              status: "paid",
              raw: paymentData,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("reference", paymentData.reference)
            .throwOnError();
        }

        // Terminal guard: money truthfully records paid, but a late
        // payment must never resurrect a completed/cancelled order.
        // payment_status=paid on a cancelled order is the refund-review
        // signal for ops — the kitchen state stays untouched.
        if (isTerminalOrderStatus((order as any)?.status)) {
          console.error(
            `Paystack late payment for terminal order ${payment.order_id} (${(order as any)?.status}): payment recorded, order state untouched — review for refund.`
          );
          return { success: true };
        }

        if (order.payment_status === "refunded") return { success: true };

        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "confirmed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.order_id)
          .throwOnError();
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Paystack webhook error:", error?.message || error);
    // Preserve auth/validation codes — a 500 tells the gateway to retry,
    // which must only happen on genuine processing failures.
    if (error?.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Webhook processing failed",
    });
  }
});
