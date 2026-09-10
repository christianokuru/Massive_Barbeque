import { requireAdmin } from "~~/server/utils/supabase";
import { getServiceSupabase } from "~~/server/utils/supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = "product-images";

// Accepts multipart form data (`file` field) from the admin console,
// stores it in the public product-images bucket, returns the public URL.
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const parts = await readMultipartFormData(event);
    const file = parts?.find((part) => part.name === "file" && part.filename);
    if (!file || !file.data) {
      throw createError({ statusCode: 400, statusMessage: "No image file provided" });
    }
    if (!ALLOWED_TYPES.includes(file.type || "")) {
      throw createError({
        statusCode: 400,
        statusMessage: "Only JPG, PNG or WebP images are allowed",
      });
    }
    if (file.data.length > MAX_BYTES) {
      throw createError({
        statusCode: 400,
        statusMessage: "Image must be smaller than 5MB",
      });
    }

    const ext = (file.filename?.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const admin = getServiceSupabase();
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, file.data, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, path };
  } catch (error: any) {
    console.error("Product image upload error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Failed to upload image",
    });
  }
});
