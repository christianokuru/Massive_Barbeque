import { apiError, defineApi, enforceRateLimit } from "~~/server/utils/api";
import { flutterwaveHashValid } from "~~/server/utils/webhookAuth";
import { settlePayment } from "~~/server/utils/paymentService";

// POST /api/payments/webhooks/flutterwave — Flutterwave's server calls this.
//
// The `verif-hash` header is static and replayable, so it only filters
// noise; settlePayment re-verifies the transaction with Flutterwave before
// writing anything. 400/401 for unsigned/forged calls (no retries), 500
// only for real processing failures (Flutterwave redelivers).
export default defineApi(async (event) => {
  enforceRateLimit(event, "webhook-flutterwave", { limit: 300, windowSecs: 3600 });

  let body: any;
  try {
    body = await readBody(event);
  } catch {
    apiError(400, "Invalid JSON");
  }
  const hash = getHeader(event, "verif-hash");
  if (!hash) apiError(400, "Missing signature");
  if (!flutterwaveHashValid(hash, String(useRuntimeConfig(event).flutterwaveSecretKey || ""))) {
    apiError(401, "Invalid signature");
  }

  if (body?.event === "charge.completed") {
    const d = body.data || {};
    const idOk = d.id !== undefined && d.id !== null && /^\d{1,20}$/.test(String(d.id));
    if (typeof d.tx_ref === "string" && d.tx_ref && idOk) {
      const outcome = await settlePayment(event, "flutterwave", {
        reference: d.tx_ref,
        transactionId: String(d.id),
        amountNaira: Number(d.amount),
        currency: String(d.currency ?? ""),
      });
      if (outcome !== "paid" && outcome !== "already-settled") console.info(`[webhook] flutterwave ${d.tx_ref}: ${outcome}`);
    } else if (typeof d.tx_ref === "string") {
      console.error(`[webhook] flutterwave ${d.tx_ref}: missing/invalid transaction id`);
    }
  }
  return { success: true };
});
