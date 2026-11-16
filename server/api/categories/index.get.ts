import { defineApi } from "~~/server/utils/api";
import { must } from "~~/server/utils/db";
import { getSupabase } from "~~/server/utils/supabase";
import { toCategory } from "~~/server/utils/mappers";

// GET /api/categories — active categories for the menu, each with its
// parent attached. (RLS only ever serves active rows to the public, so the
// old ?activeOnly=false switch had no effect and is gone.)
export default defineApi(async (event) => {
  const rows = must(
    await getSupabase(event)
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ) as any[];
  const byId = new Map(rows.map((r) => [r.id, r]));
  return {
    categories: rows.map((r) => toCategory({ ...r, parent: r.parent_id ? byId.get(r.parent_id) ?? null : null })),
  };
});
