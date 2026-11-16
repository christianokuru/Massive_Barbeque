import type { H3Event } from "h3";
import { z } from "zod";
import { getClientIp } from "~~/server/utils/clientIp";
import { isRateLimited } from "~~/server/utils/rateLimit";

/*
 * API foundation — every route is built from these pieces:
 *
 *   export default defineApi(async (event) => {
 *     await requireAdmin(event);
 *     enforceRateLimit(event, "admin-thing", { limit: 20, windowSecs: 3600 });
 *     const id = routeId(event);
 *     const body = await parseBody(event, schema);
 *     ...
 *   });
 *
 * One error policy for the whole API:
 *   - errors raised on purpose (apiError / createError) pass through
 *   - invalid input → 400 with field messages, never a stack or raw zod dump
 *   - database "already exists" → 409, bad ids → 404
 *   - anything unexpected → logged server-side, generic 500 to the client
 *     (no database text, no internals)
 */

// HTTP status lines only carry Latin-1; h3 silently strips anything else
// (an em dash would vanish mid-sentence). Normalise the usual suspects.
function latin1(message: string): string {
  return message
    .replace(/[—–]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/₦/g, "NGN ")
    .replace(/[^\t\x20-\x7E\xA0-\xFF]/g, "");
}

/** Raise an intentional API error (status + human message). */
export function apiError(statusCode: number, message: string, data?: unknown): never {
  const clean = latin1(message);
  throw createError({ statusCode, statusMessage: clean, message: clean, data });
}

export function isApiError(error: unknown): error is { statusCode: number } {
  return !!error && typeof error === "object" && typeof (error as any).statusCode === "number";
}

/** Field-level messages from a zod error, safe to show a user. */
export function zodIssues(error: z.ZodError) {
  return error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}

/** Map any thrown value to the API's error policy. */
export function toApiError(error: unknown, label: string): never {
  if (isApiError(error)) throw error;
  if (error instanceof z.ZodError) {
    apiError(400, error.issues[0]?.message || "Invalid request.", { issues: zodIssues(error) });
  }
  const code = (error as any)?.code;
  if (code === "23505") apiError(409, "That already exists.");
  if (code === "22P02" || code === "PGRST116") apiError(404, "Not found.");
  if (code === "23503") apiError(409, "It is still used by other records.");
  console.error(`[api] ${label}:`, (error as any)?.message || error);
  apiError(500, "Something went wrong. Please try again.");
}

/** Wrap a route: same handler, one error policy. */
export function defineApi<T>(handler: (event: H3Event) => Promise<T> | T) {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event);
    } catch (error) {
      toApiError(error, `${event.method} ${event.path?.split("?")[0]}`);
    }
  });
}

/** Validate a JSON body. Bad or missing JSON is a 400, not a crash. */
export async function parseBody<S extends z.ZodTypeAny>(event: H3Event, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await readBody(event);
  } catch {
    apiError(400, "Request body must be valid JSON.");
  }
  const result = schema.safeParse(raw ?? {});
  if (!result.success) {
    apiError(400, result.error.issues[0]?.message || "Invalid request.", {
      issues: zodIssues(result.error),
    });
  }
  return result.data;
}

/** Validate query-string parameters. */
export function parseQuery<S extends z.ZodTypeAny>(event: H3Event, schema: S): z.infer<S> {
  const result = schema.safeParse(getQuery(event));
  if (!result.success) {
    apiError(400, result.error.issues[0]?.message || "Invalid query.", {
      issues: zodIssues(result.error),
    });
  }
  return result.data;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Positive integer route param. Anything else is a 404 (never a DB error). */
export function routeId(event: H3Event, name = "id", what = "Not found."): number {
  const raw = getRouterParam(event, name);
  const n = Number(raw);
  if (!raw || !/^\d+$/.test(raw) || !Number.isSafeInteger(n) || n <= 0) apiError(404, what);
  return n;
}

/** UUID route param. Anything else is a 404. */
export function routeUuid(event: H3Event, name = "id", what = "Not found."): string {
  const raw = getRouterParam(event, name);
  if (!raw || !UUID_RE.test(raw)) apiError(404, what);
  return raw.toLowerCase();
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * Per-client throttle. `key` narrows the bucket further (e.g. an email or
 * order id) so one noisy target can't lock everyone else out.
 */
export function enforceRateLimit(
  event: H3Event,
  bucket: string,
  opts: { limit: number; windowSecs: number; key?: string; message?: string },
): void {
  const ip = getClientIp(event);
  const id = [bucket, ip, opts.key].filter(Boolean).join(":");
  const { limited, retryAfterSecs } = isRateLimited(id, { limit: opts.limit, windowSecs: opts.windowSecs });
  if (limited) {
    setResponseHeader(event, "Retry-After", String(retryAfterSecs));
    apiError(429, opts.message || "Too many requests. Try again later.");
  }
}

/** Common pagination query: ?limit=&offset= with safe bounds. */
export function pageQuery(event: H3Event, defaults: { limit: number; max: number }) {
  const q = getQuery(event);
  const limit = Math.min(defaults.max, Math.max(1, Math.floor(Number(q.limit)) || defaults.limit));
  const offset = Math.max(0, Math.floor(Number(q.offset)) || 0);
  return { limit, offset };
}
