import { defineApi, routeId } from "~~/server/utils/api";
import { db, must, mustFind } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";
import { removeStorageUrls } from "~~/server/utils/productStorage";
import { auditAdminAction } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";

// DELETE /api/admin/product-images/:id — remove one extra gallery photo
// (the cover photo is separate and always stays).
export default defineApi(async (event) => {
  const { user } = await requireAdmin(event);
  const imageId = routeId(event, "id", "Image not found.");
  const image = mustFind(
    await db().from("product_images").select("id, image_url, products(slug)").eq("id", imageId).maybeSingle(),
    "Image not found.",
  ) as any;
  await auditAdminAction(user.email || null, "product_update", `${image.products?.slug ?? "product"}:photo-removed`, getClientIp(event));
  must(await db().from("product_images").delete().eq("id", imageId));
  await removeStorageUrls(db(), [image.image_url]);
  return { success: true };
});
