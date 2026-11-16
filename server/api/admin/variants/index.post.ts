import { z } from "zod";
import { defineApi, parseBody } from "~~/server/utils/api";
import { db, mustFind } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";
import { toVariant } from "~~/server/utils/mappers";
import { auditAdminAction } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";
import { conflictAs, variantInputSchema } from "~~/server/utils/catalogAdmin";

// POST /api/admin/variants — add a size/option to a product (audited).
const schema = variantInputSchema.extend({
  productId: z.number().int().positive("Product is required"),
});

export default defineApi(async (event) => {
  const { user } = await requireAdmin(event);
  const body = await parseBody(event, schema);
  const product = mustFind(
    await db().from("products").select("id, slug").eq("id", body.productId).maybeSingle(),
    "Product not found.",
  ) as any;

  await auditAdminAction(user.email || null, "product_update", `${product.slug}:variant-added:${body.sku}`, getClientIp(event));
  const { data, error } = await db()
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
  if (error) conflictAs(error, "A variant with this SKU already exists.");
  return { success: true, variant: toVariant(data) };
});
