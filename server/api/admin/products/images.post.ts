import { requireAdmin } from "~~/server/utils/supabase";
import { getServiceSupabase } from "~~/server/utils/supabase";

const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = "product-images";

// Client-supplied MIME/filenames are attacker-controlled — sniff magic
// bytes and derive everything (type + extension) from the content.
function sniffImage(data: Uint8Array): { ext: string; mime: string } | null {
  if (data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    data.length > 8 &&
    data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47 &&
    data[4] === 0x0d && data[5] === 0x0a && data[6] === 0x1a && data[7] === 0x0a
  ) {
    return { ext: "png", mime: "image/png" };
  }
  if (
    data.length > 12 &&
    data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 &&
    data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

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
    if (file.data.length > MAX_BYTES) {
      throw createError({
        statusCode: 400,
        statusMessage: "Image must be smaller than 5MB",
      });
    }
    // Magic bytes decide — a polyglot/mislabeled upload (e.g. HTML
    // claiming image/png) is rejected, and the stored extension and
    // Content-Type come from the sniffed type, never the filename.
    const sniffed = sniffImage(file.data);
    if (!sniffed) {
      throw createError({
        statusCode: 400,
        statusMessage: "Only JPG, PNG or WebP images are allowed",
      });
    }

    const path = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${sniffed.ext}`;

    const admin = getServiceSupabase();
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, file.data, { contentType: sniffed.mime, upsert: false });
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
