import { defineApi, enforceRateLimit, parseBody } from "~~/server/utils/api";
import { startPayment } from "~~/server/utils/paymentService";
import { startPaymentSchema } from "~~/server/utils/paymentSchemas";

// POST /api/payments/flutterwave/initialize → { link, tx_ref }
// The amount always comes from the server-priced order (see paymentService).
export default defineApi(async (event) => {
  const body = await parseBody(event, startPaymentSchema);
  enforceRateLimit(event, "pay-init", {
    limit: 10, windowSecs: 3600, key: body.orderId,
    message: "Too many payment attempts. Try again later.",
  });
  const r = await startPayment(event, "flutterwave", body);
  return { success: true, link: r.url, tx_ref: r.reference };
});
