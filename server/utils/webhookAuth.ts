import crypto from "crypto";

/** Constant-time string comparison (length leak only). */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/** Paystack: HMAC-SHA512 of the RAW request body with the secret key. */
export function paystackSignatureValid(rawBody: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

/** Flutterwave: static `verif-hash` header (sha256 of the secret, our setup). */
export function flutterwaveHashValid(hash: string, secret: string): boolean {
  if (!secret || !hash) return false;
  return safeEqual(crypto.createHash("sha256").update(secret).digest("hex"), hash);
}
