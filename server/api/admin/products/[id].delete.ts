import { defineApi, routeId } from "~~/server/utils/api";
import { db, must, mustFind } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";
import { removeStorageUrls } from "~~/server/utils/productStorage";
import { auditAdminAction } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";

// DELETE /api/admin/products/:id — remove a product, its variants and
// gallery (DB cascade), then its uploaded photos (best effort). Past
// orders keep their own name/price snapshot. Audited first.
export default defineApi(async (event) => {
  const { user } = await requireAdmin(event);
  const id = routeId(event, "id", "Product not found.");
  const product = mustFind(
    await db().from("products").select("id, slug, image_url").eq("id", id).maybeSingle(),
    "Product not found.",
  ) as any;
  const extras = must(await db().from("product_images").select("image_url").eq("product_id", id)) as any[];

  await auditAdminAction(user.email || null, "product_delete", product.slug || String(id), getClientIp(event));
  must(await db().from("products").delete().eq("id", id));
  await removeStorageUrls(db(), [product.image_url, ...extras.map((e) => e.image_url)]);
  return { success: true };
});
