import { z } from "zod";
import { apiError, defineApi, parseBody, routeId } from "~~/server/utils/api";
import { db, must, mustFind } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";
import { MAX_EXTRA_IMAGES } from "~~/server/utils/productImages";
import { auditAdminAction } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";
import {} from "~~/server/utils/catalogAdmin";
import { imageUrlSchema } from "~~/server/utils/productImages";

// POST /api/admin/products/:id/images — attach one extra gallery photo.
const schema = z.object({ imageUrl: imageUrlSchema });

export default defineApi(async (event) => {
  const { user } = await requireAdmin(event);
  const productId = routeId(event, "id", "Product not found.");
  const body = await parseBody(event, schema);
  const product = mustFind(
    await db().from("products").select("id, slug").eq("id", productId).maybeSingle(),
    "Product not found.",
  ) as any;

  const { count, error } = await db()
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  if (error) throw error;
  if ((count ?? 0) >= MAX_EXTRA_IMAGES) apiError(400, `At most ${MAX_EXTRA_IMAGES} extra photos per product.`);

  const last = must(
    await db().from("product_images").select("sort_order").eq("product_id", productId)
      .order("sort_order", { ascending: false }).limit(1).maybeSingle(),
  ) as any;

  await auditAdminAction(user.email || null, "product_update", `${product.slug}:photo-added`, getClientIp(event));
  const image = must(
    await db()
      .from("product_images")
      .insert({ product_id: productId, image_url: body.imageUrl, sort_order: (last?.sort_order ?? -1) + 1 })
      .select("id, image_url")
      .single(),
  ) as any;
  return { image: { id: image.id, imageUrl: image.image_url } };
});
