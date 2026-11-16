import { getServiceSupabase } from "~~/server/utils/supabase";
import { apiError } from "~~/server/utils/api";

/*
 * Database access helpers.
 *
 * Supabase never throws — it returns { data, error }. Forgetting to check
 * `error` is how writes silently fail, so every query goes through one of
 * these: a database error always becomes an exception (→ the API's error
 * policy), and "no row" becomes a clean 404 where that's what it means.
 */

type Result<T> = { data: T; error: any };

/** Service-role client (bypasses RLS). Server-only; authorise in code first. */
export function db() {
  return getServiceSupabase();
}

/** Data or throw. */
export function must<T>(result: Result<T>): T {
  if (result.error) throw result.error;
  return result.data;
}

/** Exactly one row or a 404 with the given message. */
export function mustFind<T>(result: Result<T | null>, notFound = "Not found."): T {
  if (result.error && result.error.code !== "PGRST116") throw result.error;
  if (result.data == null) apiError(404, notFound);
  return result.data as T;
}

/** Throw if the write failed; returns the count of affected rows when selected. */
export function mustWrite(result: { error: any; data?: any }): void {
  if (result.error) throw result.error;
}
