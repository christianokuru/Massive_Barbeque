import { getServiceSupabase } from "~~/server/utils/supabase";

/**
 * Claim guest orders (user_id IS NULL) whose customer_email matches the
 * authenticated user's email (case-insensitive exact). Called after
 * successful login/register. Idempotent — already-claimed rows are not
 * touched.
 *
 * Requires a CONFIRMED email: a password only proves someone owns the
 * account, not the inbox. Without this check, anyone could sign up with a
 * buyer's email (when Supabase email confirmation is off) and read their
 * past orders — name, phone and home address.
 */
export async function claimGuestOrders(
  user: { id?: string | null; email?: string | null; email_confirmed_at?: string | null } | null | undefined
): Promise<number> {
  const userId = user?.id;
  const email = user?.email;
  if (!userId || !email) return 0;
  if (!user?.email_confirmed_at) return 0;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return 0;

  const supabase = getServiceSupabase();

  // ilike without wildcards is case-insensitive exact in Postgres.
  // Fetch candidates via DB, then re-filter exact in JS to avoid
  // false positives from LIKE wildcards (_ / %) in the email.
  const { data: candidates, error: fetchError } = await supabase
    .from("orders")
    .select("id, customer_email")
    .is("user_id", null)
    .ilike("customer_email", normalized);

  if (fetchError) {
    console.error("Claim guest orders fetch failed:", fetchError.message || fetchError);
    return 0;
  }
  const ids = (candidates || [])
    .filter((r: any) => r.customer_email?.trim().toLowerCase() === normalized)
    .map((r: any) => r.id as string);

  if (!ids.length) return 0;

  const { error: updError } = await supabase
    .from("orders")
    .update({ user_id: userId, updated_at: new Date().toISOString() })
    .in("id", ids);

  if (updError) {
    console.error("Claim guest orders update failed:", updError.message || updError);
    return 0;
  }
  if (ids.length) {
    console.log(`Claimed ${ids.length} guest order(s) for ${normalized} → ${userId}`);
  }
  return ids.length;
}
