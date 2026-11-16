import type { H3Event } from "h3";
import crypto from "crypto";
import { apiError } from "~~/server/utils/api";
import { db, must } from "~~/server/utils/db";
import { assertOrderAccess } from "~~/server/utils/orderAccess";
import { confirmUrl } from "~~/server/utils/siteUrl";
import { canStartPayment, isTerminalOrderStatus } from "~~/shared/utils/orderStatus";
import { fetchTransaction, startCheckout, type Provider } from "~~/server/utils/paymentGateway";
import { sendOrderPaidEmails } from "~~/server/utils/orderEmail";

/*
 * Payment rules shared by both providers.
 *
 *   start   — buyer starts paying an order they may act on
 *   check   — buyer asks "did it go through?" (display only)
 *   settle  — provider webhook says "paid": the ONLY path that marks paid
 *
 * Money comes from the server-priced order, never the client.
 */

const PENDING_WINDOW_MS = 60 * 60 * 1000;
const MAX_PENDING = 5;
const PREFIX: Record<Provider, string> = { paystack: "PAY_", flutterwave: "FLW_" };
const NAME: Record<Provider, string> = { paystack: "Paystack", flutterwave: "Flutterwave" };

// ---------------------------------------------------------------- start

export interface StartRequest {
  orderId: string;
  guestToken?: string;
  customerName?: string;
  customerPhone?: string;
  metadata?: Record<string, string>;
}

export async function startPayment(event: H3Event, provider: Provider, req: StartRequest) {
  // Ownership first: strangers can't start payments on (or probe) orders.
  const { order } = await assertOrderAccess(event, req.orderId, req.guestToken);
  const payable = canStartPayment(order.status, order.payment_status);
  if (!payable.ok) apiError(400, payable.reason);
  if (order.payment_method !== provider) apiError(400, `Order is not a ${NAME[provider]} order.`);

  const amount = Number(order.total);
  if (!Number.isFinite(amount) || amount <= 0) apiError(400, "Order has no payable total.");

  // Each attempt mints a reference; cap recent pending ones so a caller
  // can't spam the payments table or the provider. Abandoned attempts older
  // than an hour stop counting, so an order never gets locked out.
  const { count, error: countError } = await db()
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("order_id", order.id)
    .eq("provider", provider)
    .eq("status", "pending")
    .gte("created_at", new Date(Date.now() - PENDING_WINDOW_MS).toISOString());
  if (countError) throw countError;
  if ((count ?? 0) >= MAX_PENDING) {
    apiError(429, "Too many pending payments for this order. Complete or wait before retrying.");
  }

  // Record the attempt BEFORE the buyer can pay: the webhook only credits
  // payments it can find. If this write fails, stop — never take money we
  // can't match to an order.
  const reference = `${PREFIX[provider]}${crypto.randomUUID()}`;
  const { error: recordError } = await db().from("payments").insert({
    order_id: order.id,
    provider,
    reference,
    amount,
    currency: "NGN",
    status: "pending",
    updated_at: new Date().toISOString(),
  });
  if (recordError) {
    console.error(`[payments] ${provider} pending record failed:`, recordError.message);
    apiError(503, "Couldn't start payment right now. Please try again.");
  }

  const checkout = await startCheckout(provider, {
    reference,
    amountNaira: amount,
    // Receipts go to the order's buyer, never a client-supplied address.
    email: order.customer_email,
    name: req.customerName,
    phone: req.customerPhone,
    returnUrl: confirmUrl(event, order.id),
    orderId: order.id,
    metadata: req.metadata,
  });

  if (!checkout.url) {
    // Nothing can be paid on this reference: retire it (doesn't count
    // toward the cap).
    await db().from("payments").update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("reference", reference).eq("status", "pending");
    apiError(502, checkout.message || "Failed to initialize payment");
  }

  return { reference, url: checkout.url, accessCode: checkout.accessCode };
}

// ---------------------------------------------------------------- check

/**
 * Buyer-facing "did my payment go through?" Display only: it never marks
 * anything paid (webhooks do). One exception: a DEFINITIVE provider failure
 * retires a still-pending attempt as failed (grants nothing).
 * Answers only for references WE issued, to callers who may see the order.
 */
export async function checkPayment(
  event: H3Event,
  provider: Provider,
  key: { reference?: string; transactionId?: string },
  guestToken?: string,
) {
  const findOurs = async (reference: string | null | undefined) => {
    if (!reference) apiError(404, "Transaction not found.");
    const row = must(
      await db().from("payments").select("order_id, reference, status")
        .eq("provider", provider).eq("reference", reference).maybeSingle(),
    ) as any;
    if (!row) apiError(404, "Transaction not found.");
    return row as { order_id: string; reference: string; status: string };
  };

  // Paystack: we hold the reference — check it's ours BEFORE asking the
  // provider, so this can't be used to query arbitrary references.
  // Flutterwave: the return URL carries ITS transaction id, so ask first,
  // then insist the reference it reports is one we issued.
  let payment: { order_id: string; reference: string; status: string };
  let tx;
  if (provider === "paystack") {
    payment = await findOurs(key.reference);
    tx = await fetchTransaction(provider, { reference: payment.reference });
  } else {
    tx = await fetchTransaction(provider, key);
    if (!tx.reachable) apiError(502, "Couldn't reach the payment provider. Please try again.");
    payment = await findOurs(tx.reference);
  }
  const { order } = await assertOrderAccess(event, payment.order_id, guestToken);

  if (!tx.reachable) apiError(502, "Couldn't reach the payment provider. Please try again.");

  const paid =
    tx.status === "success" &&
    tx.reference === payment.reference &&
    tx.currency === "NGN" &&
    Number.isFinite(tx.amountNaira) &&
    tx.amountNaira >= Number(order.total);

  if (!paid && tx.found && tx.status === "failed" && payment.status === "pending") {
    await db().from("payments")
      .update({ status: "failed", raw: tx.raw, updated_at: new Date().toISOString() })
      .eq("reference", payment.reference).eq("status", "pending");
  }

  // Minimal answer — never the provider payload (it carries card/BIN data).
  return { success: true, paid, orderId: payment.order_id, amount: Number(order.total), currency: "NGN" };
}

// ---------------------------------------------------------------- settle

export type SettleOutcome =
  | "ignored-unknown"
  | "already-settled"
  | "amount-mismatch"
  | "not-verified"
  | "recorded-terminal-order"
  | "paid";

/**
 * Webhook says a payment succeeded. Re-verify with the provider (the
 * signature proves origin, but a leaked secret must not mint free orders),
 * then record it. Throws on database or provider outages so the webhook
 * answers 500 and the provider redelivers; returns an outcome otherwise.
 */
export async function settlePayment(
  event: H3Event,
  provider: Provider,
  claim: { reference: string; transactionId?: string | number; amountNaira: number; currency: string },
): Promise<SettleOutcome> {
  const payment = must(
    await db().from("payments").select("order_id, status")
      .eq("provider", provider).eq("reference", claim.reference).maybeSingle(),
  ) as any;
  if (!payment) return "ignored-unknown";
  if (payment.status === "refunded") return "already-settled";

  const order = must(
    await db().from("orders").select("id, total, status, payment_status").eq("id", payment.order_id).maybeSingle(),
  ) as any;
  const orderSettled =
    !order || order.payment_status === "paid" || order.payment_status === "refunded" || isTerminalOrderStatus(order.status);
  // Idempotent: a redelivery after a complete write is a no-op; a payment
  // marked paid whose ORDER write failed earlier falls through to finish.
  if (payment.status === "paid" && orderSettled) return "already-settled";

  const total = Number(order?.total);
  if (!order || claim.currency !== "NGN" || !Number.isFinite(claim.amountNaira) || claim.amountNaira < total) {
    console.error(`[payments] ${provider} amount mismatch for ${claim.reference}: got ${claim.amountNaira} ${claim.currency}, expected >= ${total}`);
    return "amount-mismatch"; // logged, acknowledged, never retried
  }

  const tx = await fetchTransaction(provider, provider === "paystack" ? { reference: claim.reference } : { transactionId: claim.transactionId });
  if (!tx.reachable) throw new Error(`${provider} re-verify unavailable`); // → 500 → redelivery
  const verified =
    tx.status === "success" && tx.reference === claim.reference && tx.currency === "NGN" && tx.amountNaira >= total;
  if (!verified) {
    console.error(`[payments] ${provider} re-verify failed for ${claim.reference}`);
    return "not-verified";
  }

  if (payment.status !== "paid") {
    must(
      await db().from("payments")
        .update({ status: "paid", raw: tx.raw, paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("reference", claim.reference),
    );
  }

  // A late payment never resurrects a completed/cancelled order: money is
  // recorded on the payment row; ops reviews it for a refund.
  if (isTerminalOrderStatus(order.status) || order.payment_status === "refunded") {
    console.error(`[payments] ${provider} late payment for ${order.status} order ${order.id} - payment recorded, order untouched; review for refund.`);
    return "recorded-terminal-order";
  }

  must(
    await db().from("orders")
      .update({ payment_status: "paid", status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", order.id),
  );
  // Runs once (redeliveries return above). Never throws.
  await sendOrderPaidEmails(event, order.id);
  return "paid";
}
