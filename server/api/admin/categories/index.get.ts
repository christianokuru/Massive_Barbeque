import { requireAdmin, getServiceSupabase } from "~~/server/utils/supabase";
import { toCategory } from "~~/server/utils/mappers";

// Full category list for the admin console, including inactive ones
// (the public endpoint only exposes active rows).
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const admin = getServiceSupabase();
    const { data, error } = await admin
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const rows = data || [];
    const byId = new Map(rows.map((r: any) => [r.id, r]));
    const withParents = rows.map((r: any) => ({
      ...r,
      parent: r.parent_id ? byId.get(r.parent_id) ?? null : null,
    }));

    return { categories: withParents.map(toCategory) };
  } catch (error: any) {
    console.error("Admin categories fetch error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch categories",
    });
  }
});
