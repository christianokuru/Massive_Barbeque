import { requireAdmin, getServiceSupabase } from "~~/server/utils/supabase";

// Delete a category. Products on it detach to uncategorized automatically
// (FK ON DELETE SET NULL); subcategories block the delete so they can't
// silently become top-level — move them first.
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const id = Number(getRouterParam(event, "id"));
    if (!id) throw createError({ statusCode: 400, statusMessage: "Category ID required" });

    const admin = getServiceSupabase();
    const { count: childCount } = await admin
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", id);
    if ((childCount ?? 0) > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: "Move its subcategories elsewhere first.",
      });
    }

    const { data, error } = await admin.from("categories").delete().eq("id", id).select("id");
    if (error) throw error;
    if (!data || data.length === 0) {
      throw createError({ statusCode: 404, statusMessage: "Category not found." });
    }
    return { success: true };
  } catch (error: any) {
    console.error("Category delete error:", error?.message || error);

    if (error?.statusCode) throw error;

    throw createError({ statusCode: 500, statusMessage: error?.message || "Failed to delete category" });
  }
});
