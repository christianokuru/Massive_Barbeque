import { defineApi, routeId } from "~~/server/utils/api";
import { db, must, mustFind } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";
import { auditAdminAction } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";

// DELETE /api/admin/variants/:id — remove a size/option (audited). Past
// orders keep their snapshot (order_items.variant_id is SET NULL).
export default defineApi(async (event) => {
  const { user } = await requireAdmin(event);
  const id = routeId(event, "id", "Variant not found.");
  const existing = mustFind(
    await db().from("product_variants").select("id, sku, products(slug)").eq("id", id).maybeSingle(),
    "Variant not found.",
  ) as any;
  await auditAdminAction(user.email || null, "product_update", `${existing.products?.slug ?? "product"}:variant-removed:${existing.sku}`, getClientIp(event));
  must(await db().from("product_variants").delete().eq("id", id));
  return { success: true };
});
