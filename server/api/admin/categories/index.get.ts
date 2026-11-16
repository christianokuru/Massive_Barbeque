import { defineApi } from "~~/server/utils/api";
import { db, must } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";
import { toCategory } from "~~/server/utils/mappers";

// GET /api/admin/categories — every category (inactive included), with its
// parent and how many products use it.
export default defineApi(async (event) => {
  await requireAdmin(event);
  const [rows, products] = await Promise.all([
    db().from("categories").select("*").order("created_at", { ascending: false }),
    db().from("products").select("category_id"),
  ]);
  const categories = must(rows) as any[];
  const counts = new Map<number, number>();
  for (const p of must(products) as any[]) {
    if (p.category_id != null) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  }
  const byId = new Map(categories.map((r) => [r.id, r]));
  return {
    categories: categories.map((r) => ({
      ...toCategory({ ...r, parent: r.parent_id ? byId.get(r.parent_id) ?? null : null }),
      productCount: counts.get(r.id) ?? 0,
    })),
  };
});
