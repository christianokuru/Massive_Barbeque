import { requireAdmin } from "~~/server/utils/supabase";
import { getServiceSupabase } from "~~/server/utils/supabase";
import { toProduct } from "~~/server/utils/mappers";

// Full catalog for the admin console: includes inactive products and
// their variants (the public endpoint only exposes active rows).
// Bounded like the orders endpoint (default 200, max 1000).
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const query = getQuery(event);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));
    const offset = Math.max(0, Number(query.offset) || 0);

    const admin = getServiceSupabase();
    const { data, error, count } = await admin
      .from("products")
      .select("*, categories(*), product_variants(*), product_images(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    return {
      products: (data || []).map(toProduct),
      pagination: { total: count ?? 0, limit, offset },
    };
  } catch (error: any) {
    console.error("Admin products fetch error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch products",
    });
  }
});
