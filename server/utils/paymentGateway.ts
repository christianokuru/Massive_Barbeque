import type { H3Event } from "h3";
import { flutterwaveBase, paystackBase } from "~~/server/utils/paymentProviders";

/*
 * One client for both payment providers. Every call:
 *   - goes to the provider's fixed API host (paymentProviders.ts)
 *   - encodes every caller-supplied value placed in a URL path
 *   - never throws on a bad answer: network failure / unreadable JSON
 *     comes back as { reachable: false } so callers decide (retry vs. no)
 */

export type Provider = "paystack" | "flutterwave";

export interface ProviderReply {
  /** We got a readable JSON answer (any status). */
  reachable: boolean;
  httpStatus: number;
  body: any;
}

function secretFor(provider: Provider): string {
  const config = useRuntimeConfig() as any;
  return String(provider === "paystack" ? config.paystackSecretKey : config.flutterwaveSecretKey || "");
}

async function call(provider: Provider, method: "GET" | "POST", path: string, payload?: unknown): Promise<ProviderReply> {
  const base = provider === "paystack" ? paystackBase() : flutterwaveBase();
  try {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { Authorization: `Bearer ${secretFor(provider)}`, "Content-Type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });
    const body = await res.json().catch(() => null);
    return { reachable: body !== null, httpStatus: res.status, body };
  } catch (e: any) {
    console.error(`[payments] ${provider} ${method} ${path.split("?")[0]} failed:`, e?.message || e);
    return { reachable: false, httpStatus: 0, body: null };
  }
}

const seg = (v: string | number) => encodeURIComponent(String(v));

/** Did the provider's envelope say the call succeeded? */
export function providerOk(provider: Provider, body: any): boolean {
  return provider === "paystack" ? body?.status === true : body?.status === "success";
}

// ---------- start a payment ----------

export interface StartInput {
  reference: string;
  amountNaira: number;
  email: string;
  name?: string;
  phone?: string;
  returnUrl: string;
  orderId: string;
  metadata?: Record<string, string>;
}

/** Returns the hosted checkout URL, or null with the provider's reason. */
export async function startCheckout(provider: Provider, input: StartInput): Promise<{ url: string | null; accessCode?: string; message?: string }> {
  if (provider === "paystack") {
    const r = await call("paystack", "POST", "/transaction/initialize", {
      email: input.email,
      amount: Math.round(input.amountNaira * 100), // kobo
      reference: input.reference,
      callback_url: input.returnUrl,
      metadata: {
        ...input.metadata,
        orderId: input.orderId,
        custom_fields: [{ display_name: "Order ID", variable_name: "order_id", value: input.orderId }],
      },
    });
    const url = providerOk("paystack", r.body) ? r.body?.data?.authorization_url : null;
    return { url: typeof url === "string" ? url : null, accessCode: r.body?.data?.access_code, message: r.body?.message };
  }
  const r = await call("flutterwave", "POST", "/v3/payments", {
    tx_ref: input.reference,
    amount: input.amountNaira,
    currency: "NGN",
    redirect_url: input.returnUrl,
    customer: { email: input.email, name: input.name || "", phonenumber: input.phone || "" },
    // orderId forced AFTER the spread so client metadata can't redirect it.
    meta: { ...input.metadata, orderId: input.orderId },
  });
  const url = providerOk("flutterwave", r.body) ? r.body?.data?.link : null;
  return { url: typeof url === "string" ? url : null, message: r.body?.message };
}

// ---------- look up a transaction ----------

export interface TxState {
  reachable: boolean;
  /** Provider answered and knows the transaction. */
  found: boolean;
  status: "success" | "failed" | "pending" | "unknown";
  reference: string | null;
  providerId: string | number | null;
  amountNaira: number;
  currency: string | null;
  raw: any;
}

/** Paystack: by our reference. Flutterwave: by its numeric transaction id. */
export async function fetchTransaction(provider: Provider, key: { reference?: string; transactionId?: string | number }): Promise<TxState> {
  const r = provider === "paystack"
    ? await call("paystack", "GET", `/transaction/verify/${seg(key.reference ?? "")}`)
    : await call("flutterwave", "GET", `/v3/transactions/${seg(key.transactionId ?? "")}/verify`);
  const d = r.body?.data;
  const found = r.reachable && providerOk(provider, r.body) && !!d;
  const s = String(d?.status ?? "").toLowerCase();
  const status: TxState["status"] = !found
    ? "unknown"
    : (provider === "paystack" ? s === "success" : s === "successful")
      ? "success"
      : ["failed", "abandoned", "cancelled", "reversed"].includes(s)
        ? "failed"
        : "pending";
  const amount = Number(d?.amount);
  return {
    reachable: r.reachable && r.httpStatus < 500,
    found,
    status,
    reference: found ? String((provider === "paystack" ? d.reference : d.tx_ref) ?? "") : null,
    providerId: found ? d.id ?? null : null,
    // Paystack reports kobo; Flutterwave reports Naira.
    amountNaira: Number.isFinite(amount) ? (provider === "paystack" ? amount / 100 : amount) : NaN,
    currency: found ? d.currency ?? null : null,
    raw: d ?? null,
  };
}

// ---------- refunds ----------

export async function requestRefund(provider: Provider, opts: { reference: string; providerTxId?: string | number; amountNaira: number }): Promise<ProviderReply> {
  if (provider === "paystack") {
    // No amount → full refund of the original transaction.
    return call("paystack", "POST", "/refund", { transaction: opts.reference });
  }
  return call("flutterwave", "POST", `/v3/transactions/${seg(opts.providerTxId ?? "")}/refund`, { amount: opts.amountNaira });
}

export async function fetchRefund(provider: Provider, refundId: string): Promise<ProviderReply> {
  return provider === "paystack"
    ? call("paystack", "GET", `/refund/${seg(refundId)}`)
    : call("flutterwave", "GET", `/v3/refunds/${seg(refundId)}`);
}

/** Where the provider sends the buyer back (see siteUrl.ts). */
export type ReturnUrlFn = (event: H3Event, orderId: string) => string;
