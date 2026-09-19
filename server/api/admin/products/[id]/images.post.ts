import { z } from "zod";
import { requireAdmin, getServiceSupabase } from "~~/server/utils/supabase";
import { imageUrlSchema, MAX_EXTRA_IMAGES } from "~~/server/utils/productImages";

const bodySchema = z.object({ imageUrl: imageUrlSchema });

// Attach one extra gallery photo to a product (cover photo untouched).
// Extras are optional; the cap bounds payload size and storage growth.
export default defineEventHandler(async (event) => {
  const { supabase } = await requireAdmin(event);

  const productId = Number(getRouterParam(event, "id"));
  if (!productId) throw createError({ statusCode: 400, statusMessage: "Product ID required" });

  const body = await readValidatedBody(event, bodySchema.parse);

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .single();
  if (!product) throw createError({ statusCode: 404, statusMessage: "Product not found" });

  const admin = getServiceSupabase();
  const { count } = await admin
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  if ((count ?? 0) >= MAX_EXTRA_IMAGES) {
    throw createError({
      statusCode: 400,
      statusMessage: `At most ${MAX_EXTRA_IMAGES} extra photos per product`,
    });
  }

  const { data: last } = await admin
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: image, error } = await admin
    .from("product_images")
    .insert({
      product_id: productId,
      image_url: body.imageUrl,
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select("id, image_url")
    .single();
  if (error) throw error;

  return { image: { id: image.id, imageUrl: image.image_url } };
});
