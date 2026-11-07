// Classify a payment provider's refund answer into one of four outcomes.
// Pure so the refund endpoint and tests share one rule.
//
//   done     — money is back with the buyer
//   pending  — provider accepted the refund but hasn't finished it
//   failed   — provider accepted the request, then the refund failed
//   rejected — provider refused the request outright (nothing started)

export type RefundOutcome = "done" | "pending" | "failed" | "rejected";
export type RefundProvider = "paystack" | "flutterwave";

const DONE = ["processed", "success", "successful", "completed", "reversed"];
const FAILED = ["failed", "rejected", "cancelled"];

/** Did the provider's API envelope say the call itself succeeded? */
export function providerCallOk(provider: RefundProvider, body: any): boolean {
  if (provider === "paystack") return body?.status === true;
  return body?.status === "success";
}

export function classifyRefund(provider: RefundProvider, body: any): RefundOutcome {
  if (!providerCallOk(provider, body)) return "rejected";
  const state = String(body?.data?.status ?? "").toLowerCase().trim();
  if (DONE.includes(state)) return "done";
  if (FAILED.includes(state)) return "failed";
  // Accepted with an in-progress or unknown state: treat as pending and
  // check again later — never assume money moved.
  return "pending";
}
