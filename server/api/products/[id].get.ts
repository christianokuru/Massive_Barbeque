import { defineApi, routeId } from "~~/server/utils/api";
import { mustFind } from "~~/server/utils/db";
import { getSupabase } from "~~/server/utils/supabase";
import { toProduct } from "~~/server/utils/mappers";

// GET /api/products/:id — one ACTIVE product with its active sizes and
// photo gallery. Hidden drafts read as 404.
export default defineApi(async (event) => {
  const id = routeId(event, "id", "Product not found");
  const product = mustFind(
    await getSupabase(event)
      .from("products")
      .select("*, categories(*), product_variants(*), product_images(*)")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle(),
    "Product not found",
  ) as any;
  product.product_variants = (product.product_variants || []).filter((v: any) => v.is_active);
  return { product: toProduct(product) };
});
