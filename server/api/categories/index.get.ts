import { getSupabase } from "~~/server/utils/supabase";
import { toCategory } from "~~/server/utils/mappers";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const activeOnly = query.activeOnly !== "false";

    const supabase = getSupabase(event);
    // Public readable via RLS; server route keeps the response shape stable.
    let req = supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });
    if (activeOnly) req = req.eq("is_active", true);

    const { data, error } = await req;
    if (error) throw error;

    // Attach parents when the column exists (migration 0002).
    let rows = data || [];
    if (rows.some((r: any) => r.parent_id != null)) {
      const parentIds = [...new Set(rows.map((r: any) => r.parent_id).filter(Boolean))];
      if (parentIds.length) {
        const { data: parents } = await supabase
          .from("categories")
          .select("*")
          .in("id", parentIds);
        const byId = new Map((parents || []).map((p: any) => [p.id, p]));
        rows = rows.map((r: any) => ({
          ...r,
          parent: r.parent_id ? byId.get(r.parent_id) ?? null : null,
        }));
      }
    }

    return { categories: rows.map(toCategory) };
  } catch (error: any) {
    console.error("Categories fetch error:", error?.message || error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch categories",
    });
  }
});
