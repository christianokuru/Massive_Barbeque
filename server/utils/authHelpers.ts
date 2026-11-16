import type { H3Event } from "h3";
import { enforceRateLimit } from "~~/server/utils/api";

/**
 * Throttle an auth action per client AND per target email, BEFORE the body
 * is validated (so malformed spam is counted too). One IP can't spray many
 * accounts and one account can't be sprayed from many IPs without bound.
 * h3 caches the parsed body, so parseBody can read it again afterwards.
 */
export async function throttleByEmail(
  event: H3Event,
  bucket: string,
  opts: { limit: number; windowSecs: number; message: string },
): Promise<{ email: string; raw: Record<string, unknown> }> {
  const raw = ((await readBody(event).catch(() => ({}))) || {}) as Record<string, unknown>;
  const email = String(raw.email ?? "").trim().toLowerCase().slice(0, 254);
  enforceRateLimit(event, bucket, { ...opts, key: email });
  return { email, raw };
}

/** Supabase Auth's own 4xx messages are written for users; pass them on. */
export function isUserFacingAuthError(error: any): boolean {
  return error?.name === "AuthApiError" && error?.status >= 400 && error?.status < 500;
}
