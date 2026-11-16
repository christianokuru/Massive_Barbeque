import { z } from "zod";
import { defineApi, parseQuery } from "~~/server/utils/api";
import { getSupabase } from "~~/server/utils/supabase";
import { toProduct } from "~~/server/utils/mappers";

// GET /api/products?categoryId=&featured=true&search=&limit=&offset=
// Public menu: active products only, active sizes only. Bad or out-of-range
// query values are ignored or clamped (never an error, never a full dump).
const querySchema = z.object({
  categoryId: z.coerce.number().int().positive().optional().catch(undefined),
  featured: z.enum(["true", "false"]).optional().catch(undefined),
  search: z.string().max(100).optional().catch(undefined),
  limit: z.coerce.number().int().catch(50).default(50),
  offset: z.coerce.number().int().catch(0).default(0),
});

export default defineApi(async (event) => {
  const q = parseQuery(event, querySchema);
  const limit = Math.min(100, Math.max(1, q.limit || 50));
  const offset = Math.max(0, q.offset);
  // Escape LIKE wildcards so search can't act as a broad-match probe.
  const search = q.search?.trim().replace(/[\\%_]/g, (c) => `\\${c}`);

  // User-scoped client: RLS serves the public catalog.
  let req = getSupabase(event)
    .from("products")
    .select("*, categories(*), product_variants(*)", { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (q.categoryId) req = req.eq("category_id", q.categoryId);
  if (q.featured === "true") req = req.eq("featured", true);
  if (search) req = req.ilike("name", `%${search}%`);

  const { data, error, count } = await req;
  if (error) throw error;

  return {
    products: (data || []).map((p: any) =>
      toProduct({ ...p, product_variants: (p.product_variants || []).filter((v: any) => v.is_active) }),
    ),
    pagination: { total: count ?? 0, limit, offset },
  };
});
