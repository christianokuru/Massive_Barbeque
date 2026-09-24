// Client-side payment helpers. Gateway redirects are allowlisted: a
// compromised init response can never bounce the buyer off-domain.

const GATEWAY_HOSTS = new Set([
  "checkout.paystack.com",
  "paystack.com",
  "checkout.flutterwave.com",
  "flutterwave.com",
]);

/** Return the URL if its host is a known gateway, else throw. */
export function assertGatewayUrl(url: string): string {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    throw new Error("bad-gateway-url");
  }
  if (!GATEWAY_HOSTS.has(host)) throw new Error("bad-gateway-url");
  return url;
}
