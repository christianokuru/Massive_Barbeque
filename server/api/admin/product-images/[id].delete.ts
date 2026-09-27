import { requireAdmin, getServiceSupabase } from "~~/server/utils/supabase";
import { removeStorageUrls } from "~~/server/utils/productStorage";

// Remove one extra gallery photo. The cover photo (products.image_url)
// is untouched, so a food always keeps at least its required picture.
// Best-effort storage cleanup: our own bucket files are removed too,
// anything else (seeded local paths, external URLs) is just unlinked.
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const imageId = Number(getRouterParam(event, "id"));
  if (!imageId) throw createError({ statusCode: 400, statusMessage: "Image ID required" });

  const admin = getServiceSupabase();
  const { data: image } = await admin
    .from("product_images")
    .select("id, image_url")
    .eq("id", imageId)
    .single();
  if (!image) throw createError({ statusCode: 404, statusMessage: "Image not found" });

  const { error } = await admin.from("product_images").delete().eq("id", imageId);
  if (error) throw error;

  await removeStorageUrls(admin, [image.image_url]);

  return { success: true };
});
