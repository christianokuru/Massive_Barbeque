import { apiError, defineApi, enforceRateLimit } from "~~/server/utils/api";
import { db } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";

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

// POST /api/admin/products/images — upload one photo (multipart `file`),
// stored in the public product-images bucket; returns its public URL.
// Type and extension come from the file's bytes, never its name.
export default defineApi(async (event) => {
  await requireAdmin(event);
  enforceRateLimit(event, "admin-upload", { limit: 120, windowSecs: 3600 });

  const parts = await readMultipartFormData(event);
  const file = parts?.find((part) => part.name === "file" && part.filename);
  if (!file?.data?.length) apiError(400, "No image file provided.");
  if (file.data.length > MAX_BYTES) apiError(400, "Image must be smaller than 5MB.");
  const sniffed = sniffImage(file.data);
  if (!sniffed) apiError(400, "Only JPG, PNG or WebP images are allowed.");

  const path = `admin-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${sniffed.ext}`;
  const { error } = await db()
    .storage.from(BUCKET)
    .upload(path, file.data, { contentType: sniffed.mime, upsert: false });
  if (error) throw error;
  const { data } = db().storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
});
