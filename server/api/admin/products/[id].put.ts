import { z } from "zod";
import { defineApi, parseBody, routeId } from "~~/server/utils/api";
import { db, must, mustFind } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";
import { toProduct } from "~~/server/utils/mappers";
import { auditAdminAction } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";
import { assertCategoryExists, conflictAs, slugSchema } from "~~/server/utils/catalogAdmin";
import { imageUrlSchema } from "~~/server/utils/productImages";

// PUT /api/admin/products/:id — edit product fields (audited). The cover
// photo can be replaced but never cleared.
const schema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  slug: slugSchema.min(1).optional(),
  description: z.string().max(5000).nullable().optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  imageUrl: imageUrlSchema.optional(),
  isActive: z.boolean().optional(),
  featured: z.boolean().optional(),
});

const COLUMNS: Record<string, string> = {
  name: "name",
  slug: "slug",
  description: "description",
  categoryId: "category_id",
  imageUrl: "image_url",
  isActive: "is_active",
  featured: "featured",
};

export default defineApi(async (event) => {
  const { user } = await requireAdmin(event);
  const id = routeId(event, "id", "Product not found.");
  const body = await parseBody(event, schema);
  const existing = mustFind(
    await db().from("products").select("id, slug").eq("id", id).maybeSingle(),
    "Product not found.",
  ) as any;
  if (body.categoryId !== undefined) await assertCategoryExists(body.categoryId);

  const update: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined && COLUMNS[key]) update[COLUMNS[key]] = value;
  }
  if (typeof update.description === "string") update.description = update.description.trim() || null;

  await auditAdminAction(user.email || null, "product_update", existing.slug || String(id), getClientIp(event));
  const { error } = await db().from("products").update(update).eq("id", id);
  if (error) conflictAs(error, "A product with this slug already exists.");

  const full = must(
    await db().from("products").select("*, categories(*), product_variants(*), product_images(*)").eq("id", id).single(),
  );
  return { success: true, product: toProduct(full) };
});
