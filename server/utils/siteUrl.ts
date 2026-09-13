import type { H3Event } from "h3";

/* Base URL for payment-gateway return URLs (callback_url / redirect_url).
   Local dev must return to localhost (the production domain doesn't
   resolve there); everything else uses the canonical app URL.
   The host header is only trusted for loopback — never for production —
   so a poisoned Host can't turn the gateway into an open redirect. */
export function gatewayReturnBase(event: H3Event): string {
  const config = useRuntimeConfig(event);
  const host = (getHeader(event, "host") || "").split(",")[0].trim();
  if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)) {
    return `http://${host}`;
  }
  return config.public.appUrl;
}

export function confirmUrl(event: H3Event, orderId?: string): string {
  const base = gatewayReturnBase(event);
  return orderId
    ? `${base}/checkout/confirm?order=${encodeURIComponent(orderId)}`
    : `${base}/checkout/confirm`;
}
