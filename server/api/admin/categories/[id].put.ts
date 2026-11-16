import { z } from "zod";
import { apiError, defineApi, parseBody, routeId } from "~~/server/utils/api";
import { db, must, mustFind } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";
import { toCategory } from "~~/server/utils/mappers";
import { slugify } from "~~/shared/utils/slug";
import { auditAdminAction } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";
import { conflictAs, slugSchema } from "~~/server/utils/catalogAdmin";
import { imageUrlSchema } from "~~/server/utils/productImages";

// PUT /api/admin/categories/:id — edit a category (audited). Parent must
// exist and can't create a loop.
const schema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  slug: z.union([slugSchema, z.literal("")]).optional(),
  description: z.string().max(2000).nullable().optional(),
  imageUrl: imageUrlSchema.nullable().optional(),
  isActive: z.boolean().optional(),
  parentId: z.number().int().positive().nullable().optional(),
});

export default defineApi(async (event) => {
  const { user } = await requireAdmin(event);
  const id = routeId(event, "id", "Category not found.");
  const body = await parseBody(event, schema);

  const existing = mustFind(
    await db().from("categories").select("id, name, slug").eq("id", id).maybeSingle(),
    "Category not found.",
  ) as any;

  if (body.parentId != null) {
    if (body.parentId === id) apiError(400, "A category can't be its own parent.");
    let cursor: number | null = body.parentId;
    for (let depth = 0; cursor != null && depth < 50; depth++) {
      if (cursor === id) apiError(400, "That parent would create a loop.");
      const row = must(await db().from("categories").select("parent_id").eq("id", cursor).maybeSingle()) as any;
      if (!row) apiError(400, "Parent category not found.");
      cursor = row.parent_id;
    }
  }

  const update: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) update.name = body.name;
  if (body.slug !== undefined) {
    const slug = body.slug || slugify(body.name ?? existing.name);
    if (!slug) apiError(400, "Slug must contain letters or numbers.");
    update.slug = slug;
  }
  if (body.description !== undefined) update.description = body.description?.trim() || null;
  if (body.imageUrl !== undefined) update.image_url = body.imageUrl;
  if (body.isActive !== undefined) update.is_active = body.isActive;
  if (body.parentId !== undefined) update.parent_id = body.parentId;

  await auditAdminAction(user.email || null, "product_update", `category:${existing.slug}`, getClientIp(event));
  const { data, error } = await db().from("categories").update(update).eq("id", id).select().single();
  if (error) conflictAs(error, "A category with this slug already exists.");
  return { success: true, category: toCategory(data) };
});
