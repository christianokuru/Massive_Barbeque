import { z } from "zod";
import { requireAdmin } from "~~/server/utils/supabase";
import { imageUrlSchema } from "~~/server/utils/productImages";
import { toProduct } from "~~/server/utils/mappers";

const productSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  // Cover photo can stay untouched (absent), but if the key is sent it
  // must be a real image — null/empty is rejected so a food can never
  // be left with zero pictures. No .nullable() on purpose: clearing the
  // cover fails validation instead of silently wiping it.
  imageUrl: imageUrlSchema.optional(),
  isActive: z.boolean().optional(),
  featured: z.boolean().optional(),
});

const FIELD_MAP: Record<string, string> = {
  name: "name",
  slug: "slug",
  description: "description",
  categoryId: "category_id",
  imageUrl: "image_url",
  isActive: "is_active",
  featured: "featured",
};

export default defineEventHandler(async (event) => {
  const { supabase } = await requireAdmin(event);

  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, statusMessage: "Product ID required" });

  const body = await readValidatedBody(event, productSchema.parse);
  const update: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined && FIELD_MAP[key]) update[FIELD_MAP[key]] = value;
  }
  const { error: updateError } = await supabase
    .from("products")
    .update(update)
    .eq("id", id);
  if (updateError) throw updateError;

  const { data: product, error } = await supabase
    .from("products")
    .select("*, categories(*), product_variants(*), product_images(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return { success: true, product: toProduct(product) };
});
