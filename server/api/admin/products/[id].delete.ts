import { requireAdmin, getServiceSupabase } from "~~/server/utils/supabase";
import { removeStorageUrls } from "~~/server/utils/productStorage";
import { auditAdminAction } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";

export default defineEventHandler(async (event) => {
  const { user } = await requireAdmin(event);

  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, statusMessage: "Product ID required" });

  const admin = getServiceSupabase();
  const { data: product } = await admin
    .from("products")
    .select("id, slug, image_url")
    .eq("id", id)
    .maybeSingle();
  if (!product) throw createError({ statusCode: 404, statusMessage: "Product not found." });

  const { data: extras } = await admin
    .from("product_images")
    .select("image_url")
    .eq("product_id", id);

  // Fail-closed: audit the destructive intent before it happens.
  await auditAdminAction(user.email || null, "product_delete", product.slug || String(id), getClientIp(event));

  // Variants + gallery rows cascade in the DB; bucket files don't, so
  // collect every referenced URL first and remove them best-effort after.
  const { error } = await admin.from("products").delete().eq("id", id);
  if (error) throw error;

  await removeStorageUrls(admin, [
    product.image_url,
    ...(extras || []).map((e: any) => e.image_url),
  ]);

  return { success: true };
});
