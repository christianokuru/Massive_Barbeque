import { z } from "zod";
import { requireAdmin } from "~~/server/utils/supabase";

const PRICE_RE = /^\d+(\.\d{1,2})?$/;

const variantSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  price: z.string().regex(PRICE_RE, "Invalid price format").optional(),
  comparePrice: z.string().regex(PRICE_RE).nullable().optional(),
  inventoryQty: z.number().int().min(0).optional(),
  weight: z.string().regex(PRICE_RE).nullable().optional(),
  isActive: z.boolean().optional(),
});

const FIELD_MAP: Record<string, string> = {
  name: "name",
  sku: "sku",
  price: "price",
  comparePrice: "compare_price",
  inventoryQty: "inventory_qty",
  weight: "weight",
  isActive: "is_active",
};

export default defineEventHandler(async (event) => {
  try {
    const { supabase } = await requireAdmin(event);

    const id = Number(getRouterParam(event, "id"));
    if (!id) throw createError({ statusCode: 400, statusMessage: "Variant ID required" });

    const body = await readValidatedBody(event, variantSchema.parse);
    const update: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && FIELD_MAP[key]) update[FIELD_MAP[key]] = value;
    }

    const { data, error } = await supabase
      .from("product_variants")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    return { success: true, variant: data };
  } catch (error: any) {
    console.error("Variant update error:", error?.message || error);

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
      statusMessage: error?.message || "Failed to update variant",
    });
  }
});
