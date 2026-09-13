import crypto from "crypto";
import { getServiceSupabase } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const rawBody = await readRawBody(event, "utf8");
    const body = JSON.parse(rawBody || "{}");

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

    if (hash !== signature) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid signature",
      });
    }

    // Process webhook event
    if (body.event === "charge.success") {
      const paymentData = body.data;
      const supabase = getServiceSupabase();

      const { data: payment } = await supabase
        .from("payments")
        .select("order_id")
        .eq("reference", paymentData.reference)
        .maybeSingle();

      if (payment) {
        // Amount guard: never mark an order paid for less than its total
        // (Paystack reports kobo). Mismatches are logged, not retried.
        const { data: order } = await supabase
          .from("orders")
          .select("id, total")
          .eq("id", payment.order_id)
          .single();
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

        await supabase
          .from("payments")
          .update({
            status: "paid",
            raw: paymentData,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("reference", paymentData.reference);

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
    console.error("Paystack webhook error:", error?.message || error);
    throw createError({
      statusCode: 500,
      statusMessage: "Webhook processing failed",
    });
  }
});
