import { z } from "zod";
import { getServiceSupabase } from "~~/server/utils/supabase";
import { auditAdminAction, requireOwner } from "~~/server/utils/adminGovernance";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";
import { classifyRefund, type RefundProvider } from "~~/shared/utils/refundState";

const refundSchema = z.object({
  // OUR payment reference (un-guessable PAY_/FLW_ uuid), never a client amount.
  reference: z.string().min(1).max(200),
});

// Owner-only money-out. Full refund of one paid payment.
//
// Flow:
//   1. No refund yet  → claim the row ('requesting'), ask the provider.
//   2. Provider says pending → store its refund id ('pending').
//   3. Retry while pending → CHECK that refund by id (never ask for a
//      second one) and finish when the provider says it's done.
// Every database write is checked; money state flips to `refunded` only
// once the provider confirms. Needs migration 0012 (refund columns) — the
// first select fails before any money moves if it isn't applied.
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireOwner(event);
    const ip = getClientIp(event);
    const { limited } = isRateLimited(`admin-refund:${ip}`, { limit: 20, windowSecs: 3600 });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many attempts. Try again later." });
    }

    const config = useRuntimeConfig();
    const body = await readValidatedBody(event, refundSchema.parse);
    const admin = getServiceSupabase();

    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .select("order_id, provider, reference, amount, currency, status, raw, refund_id, refund_status")
      .eq("reference", body.reference)
      .maybeSingle();
    if (paymentError) throw paymentError;
    if (!payment) throw createError({ statusCode: 404, statusMessage: "Payment not found." });
    if (payment.status === "refunded") {
      return { success: true, state: "refunded" as const };
    }
    if (payment.status !== "paid") {
      throw createError({ statusCode: 400, statusMessage: "Only paid payments can be refunded." });
    }

    const provider = payment.provider as RefundProvider;
    if (provider !== "paystack" && provider !== "flutterwave") {
      throw createError({ statusCode: 400, statusMessage: "Unknown payment provider." });
    }
    const secret = provider === "paystack" ? config.paystackSecretKey : config.flutterwaveSecretKey;
    const headers = { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" };

    async function finish() {
      await admin
        .from("payments")
        .update({ status: "refunded", refund_status: "done", updated_at: new Date().toISOString() })
        .eq("reference", payment!.reference)
        .eq("status", "paid")
        .throwOnError();
      await admin
        .from("orders")
        .update({ payment_status: "refunded", updated_at: new Date().toISOString() })
        .eq("id", payment!.order_id)
        .throwOnError();
      // Money has already moved: a failed audit write is logged, not fatal
      // (the intent row was written before the provider call).
      await auditAdminAction(user.email || null, "refund", `${payment!.reference} refunded`, ip).catch(
        (e) => console.error("Refund completion audit failed:", e?.message || e)
      );
      return { success: true, state: "refunded" as const };
    }

    async function clearClaim() {
      await admin
        .from("payments")
        .update({ refund_status: null, refund_id: null, updated_at: new Date().toISOString() })
        .eq("reference", payment!.reference)
        .throwOnError();
    }

    // ── Retry: a refund is already in flight → check it, don't re-request.
    if (payment.refund_status === "pending" && payment.refund_id) {
      const url =
        provider === "paystack"
          ? `https://api.paystack.co/refund/${encodeURIComponent(payment.refund_id)}`
          : `https://api.flutterwave.com/v3/refunds/${encodeURIComponent(payment.refund_id)}`;
      const res = await fetch(url, { method: "GET", headers });
      const data = await res.json().catch(() => null);
      const outcome = classifyRefund(provider, data);
      if (outcome === "done") return await finish();
      if (outcome === "pending") return { success: true, state: "pending" as const };
      if (outcome === "failed") {
        await clearClaim();
        throw createError({
          statusCode: 400,
          statusMessage: "The provider says this refund failed. No money was returned — you can try again.",
        });
      }
      // Couldn't read the provider's answer: change nothing.
      throw createError({
        statusCode: 502,
        statusMessage: "Couldn't check the refund with the provider. Try again shortly.",
      });
    }

    // ── New refund. Claim the row first so a double-click can't fire two
    // provider calls (only one request wins the → requesting update).
    // Also claimable: a pending refund the provider gave no id for (we
    // can't check it, so we ask again — providers refuse a second full
    // refund), and a 'requesting' claim stuck >10 min after a crash.
    const staleBefore = new Date(Date.now() - 10 * 60_000).toISOString();
    const { data: claimed, error: claimError } = await admin
      .from("payments")
      .update({
        refund_status: "requesting",
        refund_requested_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("reference", payment.reference)
      .eq("status", "paid")
      .or(
        `refund_status.is.null,and(refund_status.eq.pending,refund_id.is.null),and(refund_status.eq.requesting,refund_requested_at.lt."${staleBefore}")`
      )
      .select("reference");
    if (claimError) throw claimError;
    if (!claimed?.length) {
      throw createError({
        statusCode: 409,
        statusMessage: "A refund for this payment is already being processed. Refresh and try again.",
      });
    }

    // Fail-closed: record the intent before any money moves.
    try {
      await auditAdminAction(user.email || null, "refund", `${payment.reference} requested`, ip);
    } catch (e) {
      await clearClaim().catch(() => {});
      throw e;
    }

    let data: any = null;
    try {
      if (provider === "paystack") {
        const res = await fetch("https://api.paystack.co/refund", {
          method: "POST",
          headers,
          // No amount: full refund of the original transaction.
          body: JSON.stringify({ transaction: payment.reference }),
        });
        data = await res.json().catch(() => null);
      } else {
        // Provider transaction id lives in the stored webhook payload.
        const transactionId = (payment.raw as any)?.id;
        if (transactionId === undefined || transactionId === null) {
          await clearClaim();
          throw createError({ statusCode: 400, statusMessage: "No provider transaction on record for this payment." });
        }
        const res = await fetch(
          `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(transactionId))}/refund`,
          { method: "POST", headers, body: JSON.stringify({ amount: Number(payment.amount) }) }
        );
        data = await res.json().catch(() => null);
      }
    } catch (e: any) {
      if (e?.statusCode) throw e;
      // Network failure: the provider may or may not have started the
      // refund. Release the claim — providers refuse a second full refund
      // of the same transaction, so a retry can't pay out twice.
      await clearClaim().catch(() => {});
      throw createError({
        statusCode: 502,
        statusMessage: "Couldn't reach the payment provider. Check its dashboard, then try again.",
      });
    }

    const outcome = classifyRefund(provider, data);
    if (outcome === "done") return await finish();

    if (outcome === "pending") {
      const refundId = data?.data?.id;
      await admin
        .from("payments")
        .update({
          refund_status: "pending",
          refund_id: refundId === undefined || refundId === null ? null : String(refundId),
          updated_at: new Date().toISOString(),
        })
        .eq("reference", payment.reference)
        .throwOnError();
      return { success: true, state: "pending" as const };
    }

    // Rejected or failed: nothing was returned to the buyer.
    await clearClaim();
    throw createError({
      statusCode: 400,
      statusMessage:
        data?.message ||
        `Refund was not accepted by ${provider === "paystack" ? "Paystack" : "Flutterwave"}.`,
    });
  } catch (error: any) {
    console.error("Refund error:", error?.message || error);

    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: "Invalid request." });
    }
    if (error?.statusCode) throw error;

    throw createError({ statusCode: 500, statusMessage: "Refund failed." });
  }
});
