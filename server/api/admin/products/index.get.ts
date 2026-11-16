import { defineApi, pageQuery } from "~~/server/utils/api";
import { db } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";
import { toProduct } from "~~/server/utils/mappers";

// GET /api/admin/products?limit=&offset= — full catalog (inactive included)
// with variants, category and gallery.
export default defineApi(async (event) => {
  await requireAdmin(event);
  const { limit, offset } = pageQuery(event, { limit: 200, max: 1000 });
  const { data, error, count } = await db()
    .from("products")
    .select("*, categories(*), product_variants(*), product_images(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return {
    products: (data || []).map(toProduct),
    pagination: { total: count ?? 0, limit, offset },
  };
});
