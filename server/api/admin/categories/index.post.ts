import { z } from "zod";
import { apiError, defineApi, parseBody } from "~~/server/utils/api";
import { db, must } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";
import { toCategory } from "~~/server/utils/mappers";
import { slugify } from "~~/shared/utils/slug";
import { auditAdminAction } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";
import { assertCategoryExists, conflictAs, slugSchema } from "~~/server/utils/catalogAdmin";
import { imageUrlSchema } from "~~/server/utils/productImages";

// POST /api/admin/categories — create a category (audited).
const schema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(200),
  slug: z.union([slugSchema, z.literal("")]).optional(),
  description: z.string().max(2000).optional(),
  imageUrl: imageUrlSchema.optional(),
  isActive: z.boolean().default(true),
  parentId: z.number().int().positive().nullable().optional(),
});

export default defineApi(async (event) => {
  const { user } = await requireAdmin(event);
  const body = await parseBody(event, schema);
  const slug = body.slug || slugify(body.name);
  if (!slug) apiError(400, "Name must contain letters or numbers.");
  await assertCategoryExists(body.parentId);

  await auditAdminAction(user.email || null, "product_create", `category:${slug}`, getClientIp(event));
  const { data, error } = await db()
    .from("categories")
    .insert({
      name: body.name,
      slug,
      description: body.description?.trim() || null,
      image_url: body.imageUrl ?? null,
      is_active: body.isActive,
      parent_id: body.parentId ?? null,
    })
    .select()
    .single();
  if (error) conflictAs(error, "A category with this slug already exists.");
  return { success: true, category: toCategory(data) };
});
