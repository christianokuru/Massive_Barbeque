import { z } from "zod";
import { requireAdmin } from "~~/server/utils/supabase";
import { toProduct } from "~~/server/utils/mappers";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
  variants: z
    .array(
      z.object({
        name: z.string().min(1, "Variant name is required"),
        sku: z.string().min(1, "SKU is required"),
        price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
        comparePrice: z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/)
          .optional(),
        inventoryQty: z.number().int().min(0).default(0),
        weight: z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/)
          .optional(),
        isActive: z.boolean().default(true),
      })
    )
    .optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const { supabase } = await requireAdmin(event);
    const body = await readValidatedBody(event, productSchema.parse);

    // Create product
    const { data: newProduct, error: productError } = await supabase
      .from("products")
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description,
        category_id: body.categoryId,
        image_url: body.imageUrl,
        is_active: body.isActive,
        featured: body.featured,
      })
      .select()
      .single();
    if (productError) throw productError;

    // Create variants if provided
    if (body.variants && body.variants.length > 0) {
      const { error: variantsError } = await supabase
        .from("product_variants")
        .insert(
          body.variants.map((variant) => ({
            product_id: newProduct.id,
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            compare_price: variant.comparePrice ?? null,
            inventory_qty: variant.inventoryQty,
            weight: variant.weight ?? null,
            is_active: variant.isActive,
          }))
        );
      if (variantsError) throw variantsError;
    }

    // Fetch the complete product with variants
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("*, categories(*), product_variants(*)")
      .eq("id", newProduct.id)
      .single();
    if (fetchError) throw fetchError;

    return {
      success: true,
      product: toProduct(product),
    };
  } catch (error: any) {
    console.error("Product creation error:", error?.message || error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid form data",
        data: error.errors,
      });
    }
    if (error?.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Failed to create product",
    });
  }
});
