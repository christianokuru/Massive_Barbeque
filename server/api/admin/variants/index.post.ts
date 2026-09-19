import { z } from "zod";
import { requireAdmin } from "~~/server/utils/supabase";

const PRICE_RE = /^\d+(\.\d{1,2})?$/;

const variantSchema = z.object({
  productId: z.number().int().positive("Product is required"),
  name: z.string().min(1, "Variant name is required").max(200),
  sku: z.string().min(1, "SKU is required").max(100),
  price: z.string().regex(PRICE_RE, "Invalid price format"),
  comparePrice: z.string().regex(PRICE_RE).nullish(),
  inventoryQty: z.number().int().min(0).max(1000000).default(0),
  weight: z.string().regex(PRICE_RE).nullish(),
  isActive: z.boolean().default(true),
});

export default defineEventHandler(async (event) => {
  try {
    const { supabase } = await requireAdmin(event);
    const body = await readValidatedBody(event, variantSchema.parse);

    const { data, error } = await supabase
      .from("product_variants")
      .insert({
        product_id: body.productId,
        name: body.name,
        sku: body.sku,
        price: body.price,
        compare_price: body.comparePrice ?? null,
        inventory_qty: body.inventoryQty,
        weight: body.weight ?? null,
        is_active: body.isActive,
      })
      .select()
      .single();
    if (error) throw error;

    return { success: true, variant: data };
  } catch (error: any) {
    console.error("Variant creation error:", error?.message || error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid variant data",
        data: error.errors,
      });
    }
    if (error?.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Failed to create variant",
    });
  }
});
