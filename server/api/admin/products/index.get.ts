import { requireAdmin } from "~~/server/utils/supabase";
import { getServiceSupabase } from "~~/server/utils/supabase";
import { toProduct } from "~~/server/utils/mappers";

// Full catalog for the admin console: includes inactive products and
// their variants (the public endpoint only exposes active rows).
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const admin = getServiceSupabase();
    const { data, error } = await admin
      .from("products")
      .select("*, categories(*), product_variants(*), product_images(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return { products: (data || []).map(toProduct) };
  } catch (error: any) {
    console.error("Admin products fetch error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch products",
    });
  }
});
