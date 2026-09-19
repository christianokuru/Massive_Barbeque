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
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw createError({ statusCode: 404, statusMessage: "Product not found" });
    }
    // Public path serves active products only — hidden drafts stay hidden.
    // Extras included for the details-page gallery (ordered in toProduct).
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(*), product_variants(*), product_images(*)")
      .eq("id", numericId)
      .eq("is_active", true)
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
