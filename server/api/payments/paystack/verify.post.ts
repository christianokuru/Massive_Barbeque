import { z } from "zod";
import { defineApi, enforceRateLimit, parseBody } from "~~/server/utils/api";
import { checkPayment } from "~~/server/utils/paymentService";

// POST /api/payments/paystack/verify { reference, guestToken? }
// → { paid, orderId, amount, currency }. Display only — webhooks mark paid.
const schema = z.object({
  reference: z.string().trim().min(1).max(200).regex(/^[A-Za-z0-9_-]+$/, "Transaction not found."),
  guestToken: z.string().max(4096).optional(),
});

export default defineApi(async (event) => {
  const body = await parseBody(event, schema);
  enforceRateLimit(event, "pay-verify", {
    limit: 60, windowSecs: 3600, key: body.reference.slice(0, 64),
    message: "Too many verification attempts. Try again later.",
  });
  return checkPayment(event, "paystack", { reference: body.reference }, body.guestToken);
});
