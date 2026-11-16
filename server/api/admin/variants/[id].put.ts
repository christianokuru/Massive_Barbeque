import { z } from "zod";
import { defineApi, parseBody, routeId } from "~~/server/utils/api";
import { db, mustFind } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";
import { toVariant } from "~~/server/utils/mappers";
import { auditAdminAction } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";
import { conflictAs, optionalDecimal, priceSchema } from "~~/server/utils/catalogAdmin";

// PUT /api/admin/variants/:id — edit a size/option (audited).
const schema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  sku: z.string().trim().min(1).max(100).optional(),
  price: priceSchema.optional(),
  comparePrice: optionalDecimal.nullable().optional(),
  inventoryQty: z.number().int().min(0).max(1000000).optional(),
  weight: optionalDecimal.nullable().optional(),
  isActive: z.boolean().optional(),
});

const COLUMNS: Record<string, string> = {
  name: "name",
  sku: "sku",
  price: "price",
  comparePrice: "compare_price",
  inventoryQty: "inventory_qty",
  weight: "weight",
  isActive: "is_active",
};

export default defineApi(async (event) => {
  const { user } = await requireAdmin(event);
  const id = routeId(event, "id", "Variant not found.");
  const body = await parseBody(event, schema);
  const existing = mustFind(
    await db().from("product_variants").select("id, sku, products(slug)").eq("id", id).maybeSingle(),
    "Variant not found.",
  ) as any;

  const update: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined && COLUMNS[key]) update[COLUMNS[key]] = value;
  }

  await auditAdminAction(user.email || null, "product_update", `${existing.products?.slug ?? "product"}:variant:${existing.sku}`, getClientIp(event));
  const { data, error } = await db().from("product_variants").update(update).eq("id", id).select().single();
  if (error) conflictAs(error, "A variant with this SKU already exists.");
  return { success: true, variant: toVariant(data) };
});
