import { getServiceSupabase } from "~~/server/utils/supabase";

/**
 * Claim guest orders (user_id IS NULL) whose customer_email matches the
 * authenticated user's email (case-insensitive exact). Called after
 * successful login/register once email ownership is proven via password.
 * Idempotent — already-claimed rows are not touched.
 */
export async function claimGuestOrders(userId: string, email: string): Promise<number> {
  if (!userId || !email) return 0;
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
