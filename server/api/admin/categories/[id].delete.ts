import { apiError, defineApi, routeId } from "~~/server/utils/api";
import { db, must, mustFind } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";
import { auditAdminAction } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";

// DELETE /api/admin/categories/:id — products on it become uncategorised
// (FK ON DELETE SET NULL); subcategories block the delete so they can't
// silently become top-level. Audited.
export default defineApi(async (event) => {
  const { user } = await requireAdmin(event);
  const id = routeId(event, "id", "Category not found.");
  const existing = mustFind(
    await db().from("categories").select("id, slug").eq("id", id).maybeSingle(),
    "Category not found.",
  ) as any;

  const { count, error } = await db()
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);
  if (error) throw error;
  if ((count ?? 0) > 0) apiError(409, "Move its subcategories elsewhere first.");

  await auditAdminAction(user.email || null, "product_delete", `category:${existing.slug}`, getClientIp(event));
  must(await db().from("categories").delete().eq("id", id));
  return { success: true };
});
