import { apiError, defineApi, enforceRateLimit } from "~~/server/utils/api";
import { paystackSignatureValid } from "~~/server/utils/webhookAuth";
import { settlePayment } from "~~/server/utils/paymentService";

// POST /api/payments/webhooks/paystack — Paystack's server calls this.
//
// 400/401 for anything unsigned or forged (never 500, so forgeries don't
// trigger retries). 500 only for real processing failures (database or
// provider outage) so Paystack redelivers. Everything else: 200.
export default defineApi(async (event) => {
  enforceRateLimit(event, "webhook-paystack", { limit: 300, windowSecs: 3600 });

  const raw = (await readRawBody(event, "utf8")) || "";
  const signature = getHeader(event, "x-paystack-signature");
  if (!signature) apiError(400, "Missing signature");
  let body: any;
  try {
    body = JSON.parse(raw || "{}");
  } catch {
    apiError(400, "Invalid JSON");
  }
  // Signature is over the RAW bytes Paystack sent.
  if (!paystackSignatureValid(raw, signature, String(useRuntimeConfig(event).paystackSecretKey || ""))) {
    apiError(401, "Invalid signature");
  }

  if (body?.event === "charge.success") {
    const d = body.data || {};
    if (typeof d.reference === "string" && d.reference) {
      const outcome = await settlePayment(event, "paystack", {
        reference: d.reference,
        amountNaira: Number(d.amount) / 100, // kobo → Naira
        currency: String(d.currency ?? ""),
      });
      if (outcome !== "paid" && outcome !== "already-settled") console.info(`[webhook] paystack ${d.reference}: ${outcome}`);
    }
  }
  return { success: true };
});
