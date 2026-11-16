import { defineApi, pageQuery } from "~~/server/utils/api";
import { db, must } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";

// GET /api/admin/orders?limit=&offset= — every order, newest first.
// Bounded (default 200, max 1000); the archive passes a high limit so its
// tabs, search and bulk actions see the whole list.
export default defineApi(async (event) => {
  await requireAdmin(event);
  const { limit, offset } = pageQuery(event, { limit: 200, max: 1000 });
  const { data, error, count } = await db()
    .from("orders")
    .select("*, order_items(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return {
    orders: (data || []).map(toOrder),
    pagination: { total: count ?? 0, limit, offset },
  };
});
