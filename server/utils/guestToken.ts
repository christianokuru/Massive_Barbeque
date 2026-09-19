import crypto from "node:crypto";

// Signed guest-order tokens: `payloadB64.sigB64` where
// payload = { o: orderId, e: customerEmail, x: expiryEpochSecs } and
// sig = HMAC-SHA256(secret, payloadB64). Issued at order-create for
// guest orders (`user_id` null); required for guest reads, pay-init and
// verify. Pure functions — callers pass the secret explicitly so these
// stay unit-testable outside Nuxt (`useRuntimeConfig` is unavailable in
// vitest). Routes resolve the secret via `getGuestTokenSecret(event)`.

export interface GuestTokenPayload {
  o: string;
  e: string;
  x: number;
}

export const GUEST_TOKEN_TTL_SECS = 30 * 24 * 3600; // 30 days

export function getGuestTokenSecret(event?: any): string {
  try {
    const config = event ? useRuntimeConfig(event) : useRuntimeConfig();
    const dedicated = (config as any).guestTokenSecret as string | undefined;
    if (dedicated) return dedicated;
    // Fallback: service-role key is server-only, stable, and high-entropy.
    return ((config as any).supabaseServiceRoleKey as string) || "";
  } catch {
    return "";
  }
}

function b64urlEncode(input: string | Buffer): string {
  return Buffer.from(input as any)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

export function issueGuestToken(
  orderId: string,
  email: string,
  secret: string,
  ttlSecs: number = GUEST_TOKEN_TTL_SECS,
  nowSecs: number = Math.floor(Date.now() / 1000)
): string {
  const payload: GuestTokenPayload = {
    o: orderId,
    e: email.trim().toLowerCase(),
    x: nowSecs + ttlSecs,
  };
  const payloadB64 = b64urlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest();
  return `${payloadB64}.${b64urlEncode(sig)}`;
}

export function verifyGuestToken(
  token: string,
  orderId: string,
  secret: string,
  nowSecs: number = Math.floor(Date.now() / 1000)
): { email: string } | null {
  if (!token || !secret || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  if (!payloadB64 || !sigB64 || payloadB64.length > 2048) return null;

  let sig: Buffer;
  try {
    sig = b64urlDecode(sigB64);
  } catch {
    return null;
  }
  const expected = crypto.createHmac("sha256", secret).update(payloadB64).digest();
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(sig, expected)) return null;

  let payload: GuestTokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || payload.o !== orderId || typeof payload.e !== "string") return null;
  if (!Number.isFinite(payload.x) || payload.x <= nowSecs) return null;
  return { email: payload.e };
}
