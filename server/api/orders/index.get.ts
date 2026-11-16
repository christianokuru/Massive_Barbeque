import { defineApi } from "~~/server/utils/api";
import { db, must } from "~~/server/utils/db";
import { requireUser } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";

// GET /api/orders — the signed-in customer's orders, newest first.
// Includes guest orders placed with the same email before the account
// existed — but ONLY when the account's email is confirmed. Without that,
// anyone could sign up with a buyer's address and read their orders.
const MAX_ORDERS = 500;

export default defineApi(async (event) => {
  const { user } = await requireUser(event);

  const owned = must(
    await db()
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(MAX_ORDERS),
  ) as any[];

  let guest: any[] = [];
  const email = user.email?.trim().toLowerCase();
  if (email && (user as any).email_confirmed_at) {
    // ilike without wildcards = case-insensitive match; re-check exactly in
    // code so "_" / "%" in an address can't widen the match.
    const candidates = must(
      await db()
        .from("orders")
        .select("*, order_items(*)")
        .is("user_id", null)
        .ilike("customer_email", email.replace(/[\\%_]/g, (c) => `\\${c}`))
        .order("created_at", { ascending: false })
        .limit(MAX_ORDERS),
    ) as any[];
    guest = candidates.filter((r) => r.customer_email?.trim().toLowerCase() === email);
  }

  const all = [...owned, ...guest].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return { orders: all.map(toOrder) };
});
