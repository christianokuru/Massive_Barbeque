import { z } from "zod";
import { defineApi, parseBody } from "~~/server/utils/api";
import { db, must } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";
import { toProduct } from "~~/server/utils/mappers";
import { auditAdminAction } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";
import { assertCategoryExists, conflictAs, slugSchema, variantInputSchema } from "~~/server/utils/catalogAdmin";
import { imageUrlSchema } from "~~/server/utils/productImages";

// POST /api/admin/products — create a product with its variants (audited).
// Cover photo is required: every food needs a picture.
const schema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(200),
  slug: slugSchema.min(1, "Slug is required"),
  description: z.string().max(5000).optional(),
  categoryId: z.number().int().positive().optional(),
  imageUrl: imageUrlSchema,
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
  variants: z.array(variantInputSchema).max(100).optional(),
});

export default defineApi(async (event) => {
  const { user } = await requireAdmin(event);
  const body = await parseBody(event, schema);
  await assertCategoryExists(body.categoryId);

  await auditAdminAction(user.email || null, "product_create", body.slug, getClientIp(event));
  const { data: product, error } = await db()
    .from("products")
    .insert({
      name: body.name,
      slug: body.slug,
      description: body.description?.trim() || null,
      category_id: body.categoryId ?? null,
      image_url: body.imageUrl,
      is_active: body.isActive,
      featured: body.featured,
    })
    .select("id")
    .single();
  if (error) conflictAs(error, "A product with this slug already exists.");

  if (body.variants?.length) {
    const { error: variantError } = await db()
      .from("product_variants")
      .insert(
        body.variants.map((v) => ({
          product_id: product.id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          compare_price: v.comparePrice ?? null,
          inventory_qty: v.inventoryQty,
          weight: v.weight ?? null,
          is_active: v.isActive,
        })),
      );
    if (variantError) {
      // No transaction across the two inserts: don't leave a variant-less
      // product behind when a SKU clashes.
      await db().from("products").delete().eq("id", product.id);
      conflictAs(variantError, "A variant with this SKU already exists.");
    }
  }

  const full = must(
    await db().from("products").select("*, categories(*), product_variants(*), product_images(*)").eq("id", product.id).single(),
  );
  return { success: true, product: toProduct(full) };
});
