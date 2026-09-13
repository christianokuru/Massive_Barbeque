import crypto from "crypto";
import { getServiceSupabase } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readBody(event);

    // Get Flutterwave signature from headers
    const signature = getHeader(event, "verif-hash");

    if (!signature) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing signature",
      });
    }

    // Verify webhook signature
    const hash = crypto
      .createHash("sha256")
      .update(config.flutterwaveSecretKey)
      .digest("hex");

    if (hash !== signature) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid signature",
      });
    }

    // Process webhook event
    if (body.event === "charge.completed") {
      const paymentData = body.data;
      const supabase = getServiceSupabase();

      const { data: payment } = await supabase
        .from("payments")
        .select("order_id")
        .eq("reference", paymentData.tx_ref)
        .maybeSingle();

      if (payment) {
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
    throw createError({
      statusCode: 500,
      statusMessage: "Webhook processing failed",
    });
  }
});
