import { z } from "zod";
import { apiError, defineApi, enforceRateLimit, parseBody } from "~~/server/utils/api";
import { db, must, mustFind } from "~~/server/utils/db";
import { auditAdminAction, requireOwner } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";
import { classifyRefund } from "~~/shared/utils/refundState";
import { fetchRefund, requestRefund, type Provider } from "~~/server/utils/paymentGateway";

// POST /api/admin/payments/refund { reference } — OWNER only, full refund
// of one paid payment → { state: "pending" | "refunded" }.
//
//   1. No refund yet  → claim the row ('requesting'), ask the provider.
//   2. Provider says pending → store its refund id ('pending').
//   3. Pressed again while pending → CHECK that refund by id; never ask for
//      a second one. Finish when the provider says it's done.
// Money state flips to `refunded` only on provider confirmation. Needs
// migration 0012 — the first select fails before any money moves if not.
const schema = z.object({ reference: z.string({ required_error: "Payment reference is required." }).trim().min(1, "Payment reference is required.").max(200) });
const NAME: Record<Provider, string> = { paystack: "Paystack", flutterwave: "Flutterwave" };

export default defineApi(async (event) => {
  const { user } = await requireOwner(event);
  enforceRateLimit(event, "admin-refund", { limit: 20, windowSecs: 3600, message: "Too many attempts. Try again later." });
  const body = await parseBody(event, schema);
  const ip = getClientIp(event);

  const payment = mustFind(
    await db().from("payments")
      .select("order_id, provider, reference, amount, status, raw, refund_id, refund_status")
      .eq("reference", body.reference).maybeSingle(),
    "Payment not found.",
  ) as any;
  if (payment.status === "refunded") return { success: true, state: "refunded" as const };
  if (payment.status !== "paid") apiError(400, "Only paid payments can be refunded.");
  const provider = payment.provider as Provider;
  if (provider !== "paystack" && provider !== "flutterwave") apiError(400, "Unknown payment provider.");

  const now = () => new Date().toISOString();
  const clearClaim = async () =>
    must(await db().from("payments").update({ refund_status: null, refund_id: null, updated_at: now() }).eq("reference", payment.reference));

  async function finish() {
    must(await db().from("payments").update({ status: "refunded", refund_status: "done", updated_at: now() })
      .eq("reference", payment.reference).eq("status", "paid"));
    must(await db().from("orders").update({ payment_status: "refunded", updated_at: now() }).eq("id", payment.order_id));
    // Money already moved: a failed audit write is logged, not fatal (the
    // intent was audited before the provider call).
    await auditAdminAction(user.email || null, "refund", `${payment.reference} refunded`, ip)
      .catch((e) => console.error("[refund] completion audit failed:", e?.message || e));
    return { success: true, state: "refunded" as const };
  }

  // ---- Already in flight: check on it, never request again.
  if (payment.refund_status === "pending" && payment.refund_id) {
    const r = await fetchRefund(provider, String(payment.refund_id));
    if (!r.reachable) apiError(502, "Couldn't check the refund with the provider. Try again shortly.");
    const outcome = classifyRefund(provider, r.body);
    if (outcome === "done") return finish();
    if (outcome === "pending") return { success: true, state: "pending" as const };
    if (outcome === "failed") {
      await clearClaim();
      apiError(400, "The provider says this refund failed. No money was returned - you can try again.");
    }
    apiError(502, "Couldn't check the refund with the provider. Try again shortly.");
  }

  // ---- New refund. Claim the row first: only one request can win, so a
  // double-click can't fire two provider calls. Also claimable: a pending
  // refund with no provider id (can't be checked — providers refuse a
  // second full refund anyway) and a 'requesting' claim stuck >10 min.
  const staleBefore = new Date(Date.now() - 10 * 60_000).toISOString();
  const claimed = must(
    await db().from("payments")
      .update({ refund_status: "requesting", refund_requested_at: now(), updated_at: now() })
      .eq("reference", payment.reference).eq("status", "paid")
      .or(`refund_status.is.null,and(refund_status.eq.pending,refund_id.is.null),and(refund_status.eq.requesting,refund_requested_at.lt."${staleBefore}")`)
      .select("reference"),
  ) as any[];
  if (!claimed?.length) apiError(409, "A refund for this payment is already being processed. Refresh and try again.");

  // Fail-closed: record the intent before any money moves.
  try {
    await auditAdminAction(user.email || null, "refund", `${payment.reference} requested`, ip);
  } catch (e) {
    await clearClaim().catch(() => {});
    throw e;
  }

  const providerTxId = (payment.raw as any)?.id;
  if (provider === "flutterwave" && (providerTxId === undefined || providerTxId === null)) {
    await clearClaim();
    apiError(400, "No provider transaction on record for this payment.");
  }

  const r = await requestRefund(provider, {
    reference: payment.reference,
    providerTxId,
    amountNaira: Number(payment.amount),
  });
  if (!r.reachable) {
    // Unknown whether it started; release the claim. Providers refuse a
    // second full refund of the same transaction, so a retry can't double-pay.
    await clearClaim().catch(() => {});
    apiError(502, "Couldn't reach the payment provider. Check its dashboard, then try again.");
  }

  const outcome = classifyRefund(provider, r.body);
  if (outcome === "done") return finish();
  if (outcome === "pending") {
    const refundId = r.body?.data?.id;
    must(await db().from("payments")
      .update({ refund_status: "pending", refund_id: refundId == null ? null : String(refundId), updated_at: now() })
      .eq("reference", payment.reference));
    return { success: true, state: "pending" as const };
  }

  await clearClaim();
  apiError(400, r.body?.message || `Refund was not accepted by ${NAME[provider]}.`);
});
