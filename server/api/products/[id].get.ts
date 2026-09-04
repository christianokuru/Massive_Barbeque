import { getSupabase } from "~~/server/utils/supabase";
import { toProduct } from "~~/server/utils/mappers";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Product ID is required",
      });
    }

    const supabase = getSupabase(event);
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(*), product_variants(*)")
      .eq("id", Number(id))
      .single();

    if (error || !data) {
      throw createError({
        statusCode: 404,
        statusMessage: "Product not found",
      });
    }

    data.product_variants = (data.product_variants || []).filter(
      (v: any) => v.is_active
    );

    return { product: toProduct(data) };
  } catch (error: any) {
    console.error("Product fetch error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch product",
    });
  }
});
