import { getSupabase } from "~~/server/utils/supabase";
import { toProduct } from "~~/server/utils/mappers";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const rawCategory = query.categoryId !== undefined ? Number(query.categoryId) : NaN;
    const categoryId = Number.isInteger(rawCategory) && rawCategory > 0 ? rawCategory : undefined;
    const featured = query.featured === "true";
    // Escape LIKE wildcards so search can't act as a broad-match probe.
    const search = (query.search as string | undefined)?.slice(0, 100).replace(/[\\%_]/g, (c) => `\\${c}`);
    // Clamp pagination: unbounded limit = full-catalog dump + heavy count.
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const offset = Math.max(0, Number(query.offset) || 0);

    const supabase = getSupabase(event);
    // Left-join variants (a product with no active variants must still list),
    // then drop inactive variants in JS.
    let req = supabase
      .from("products")
      .select("*, categories(*), product_variants(*)", { count: "exact" })
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (categoryId) req = req.eq("category_id", categoryId);
    if (featured) req = req.eq("featured", true);
    if (search) req = req.ilike("name", `%${search}%`);

    const { data, error, count } = await req;
    if (error) throw error;

    const products = (data || []).map((p: any) => ({
      ...p,
      product_variants: (p.product_variants || []).filter((v: any) => v.is_active),
    }));

    return {
      products: products.map(toProduct),
      pagination: { total: count ?? 0, limit, offset },
    };
  } catch (error: any) {
    console.error("Products fetch error:", error?.message || error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch products",
    });
  }
});
