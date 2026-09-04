import { z } from "zod";
import { requireAdmin } from "~~/server/utils/supabase";
import { toProduct } from "~~/server/utils/mappers";

const productSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  categoryId: z.number().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
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
    .select("*, categories(*), product_variants(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return { success: true, product: toProduct(product) };
});
