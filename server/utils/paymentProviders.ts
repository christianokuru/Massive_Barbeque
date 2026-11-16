/*
 * Payment provider API bases. Production always talks to the real hosts.
 * PAYSTACK_API_BASE / FLUTTERWAVE_API_BASE exist only so a local test run
 * can point at a fake provider; they must be https, or plain http on
 * localhost — never anything that could leak a secret key in the clear.
 */
const DEFAULTS = {
  paystack: "https://api.paystack.co",
  flutterwave: "https://api.flutterwave.com",
} as const;

export function safeApiBase(raw: unknown, fallback: string): string {
  const value = String(raw || "").trim().replace(/\/+$/, "");
  if (!value) return fallback;
  if (/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(value)) return value;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value)) return value;
  console.error(`[payments] ignoring unsafe provider base "${value}", using ${fallback}`);
  return fallback;
}

export function paystackBase(): string {
  return safeApiBase((useRuntimeConfig() as any).paystackApiBase, DEFAULTS.paystack);
}

export function flutterwaveBase(): string {
  return safeApiBase((useRuntimeConfig() as any).flutterwaveApiBase, DEFAULTS.flutterwave);
}
