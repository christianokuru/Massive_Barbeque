import crypto from "crypto";
import { getServiceSupabase } from "~~/server/utils/supabase";
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
    // Webhooks are provider callbacks: throttle floods. Auth failures
    // return 401/400 (never 500) so the gateway doesn't retry-storm.
    const ip = getClientIp(event);
    const { limited } = isRateLimited(`webhook-flutterwave:${ip}`, { limit: 300, windowSecs: 3600 });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many requests." });
    }

    let body: any;
    try {
      body = await readBody(event);
    } catch {
      throw createError({ statusCode: 400, statusMessage: "Invalid JSON" });
    }

    // Get Flutterwave signature from headers
    const signature = getHeader(event, "verif-hash");

    if (!signature) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing signature",
      });
    }

    // Verify webhook signature (hash of the secret, per Flutterwave docs).
    // NOTE: this header is static and replayable on its own — it only
    // gates noise. The transaction is independently re-verified with
    // Flutterwave below before any money state is written.
    const hash = crypto
      .createHash("sha256")
      .update(config.flutterwaveSecretKey)
      .digest("hex");

    if (!signaturesEqual(hash, signature)) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid signature",
      });
    }

    // Process webhook event
    if (body?.event === "charge.completed") {
      const paymentData = body.data || {};
      if (typeof paymentData.tx_ref !== "string" || !paymentData.tx_ref) {
        return { success: true };
      }
      const supabase = getServiceSupabase();

      const { data: payment } = await supabase
        .from("payments")
        .select("order_id, status")
        .eq("reference", paymentData.tx_ref)
        .maybeSingle();

      if (payment) {
        // Idempotency: only transition pending → paid, never re-write.
        if (payment.status === "paid") return { success: true };

        // Amount guard: never mark an order paid for less than its total.
        // Mismatches are logged, not retried.
        const { data: order } = await supabase
          .from("orders")
          .select("id, total")
          .eq("id", payment.order_id)
          .single();
        if (
          !order ||
          paymentData.currency !== "NGN" ||
          !Number.isFinite(Number(paymentData.amount)) ||
          Number(paymentData.amount) < Number(order.total)
        ) {
          console.error(
            `Flutterwave amount mismatch for ${paymentData.tx_ref}: got ${paymentData.amount} ${paymentData.currency}, expected >= ${order?.total}`
          );
          return { success: true };
        }

        // Independent re-verification: the static verif-hash can't stop
        // replays/forgeries, so confirm with Flutterwave before writing.
        // paymentData.id is the provider transaction id.
        if (paymentData.id === undefined || paymentData.id === null) {
          console.error(`Flutterwave webhook missing transaction id for ${paymentData.tx_ref}`);
          return { success: true };
        }
        const verifyRes = await fetch(
          `https://api.flutterwave.com/v3/transactions/${paymentData.id}/verify`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${config.flutterwaveSecretKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        const verifyData = await verifyRes.json().catch(() => null);
        const verified =
          verifyData?.status === "success" &&
          verifyData?.data?.status === "successful" &&
          String(verifyData?.data?.tx_ref) === paymentData.tx_ref &&
          verifyData?.data?.currency === "NGN" &&
          Number(verifyData?.data?.amount) >= Number(order.total);
        if (!verified) {
          console.error(`Flutterwave re-verify failed for ${paymentData.tx_ref}`);
          return { success: true };
        }

        await supabase
          .from("payments")
          .update({
            status: "paid",
            raw: paymentData,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("reference", paymentData.tx_ref);

        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "confirmed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.order_id);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Flutterwave webhook error:", error?.message || error);
    // Preserve auth/validation codes — 500 means "retry", reserved for
    // genuine processing failures.
    if (error?.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Webhook processing failed",
    });
  }
});
