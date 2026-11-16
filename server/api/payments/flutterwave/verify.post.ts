import { z } from "zod";
import { defineApi, enforceRateLimit, parseBody } from "~~/server/utils/api";
import { checkPayment } from "~~/server/utils/paymentService";

// POST /api/payments/flutterwave/verify { transaction_id, guestToken? }
// → { paid, orderId, amount, currency }. Display only — webhooks mark paid.
// Flutterwave transaction ids are numeric; anything else never reaches the
// provider (it's placed in the API path).
const schema = z.object({
  transaction_id: z.coerce.string().trim().regex(/^\d{1,20}$/, "Transaction not found."),
  guestToken: z.string().max(4096).optional(),
});

export default defineApi(async (event) => {
  const body = await parseBody(event, schema);
  enforceRateLimit(event, "pay-verify", {
    limit: 60, windowSecs: 3600, key: body.transaction_id,
    message: "Too many verification attempts. Try again later.",
  });
  return checkPayment(event, "flutterwave", { transactionId: body.transaction_id }, body.guestToken);
});
