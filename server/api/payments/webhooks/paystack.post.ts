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
