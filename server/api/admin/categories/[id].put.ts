import { z } from "zod";
import { requireAdmin, getServiceSupabase } from "~~/server/utils/supabase";
import { imageUrlSchema } from "~~/server/utils/productImages";
import { slugify } from "~~/shared/utils/slug";
import { throwIfUniqueViolation } from "~~/server/utils/uniqueViolation";
import { toCategory } from "~~/server/utils/mappers";

const categorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  imageUrl: imageUrlSchema.nullable().optional(),
  isActive: z.boolean().optional(),
  parentId: z.number().int().positive().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const id = Number(getRouterParam(event, "id"));
    if (!id) throw createError({ statusCode: 400, statusMessage: "Category ID required" });

    const body = await readValidatedBody(event, categorySchema.parse);
    const admin = getServiceSupabase();

    const { data: existing } = await admin
      .from("categories")
      .select("id, name")
      .eq("id", id)
      .maybeSingle();
    if (!existing) throw createError({ statusCode: 404, statusMessage: "Category not found." });

    // Parent rules: must exist, must not be self, must not create a cycle
    // (walk the chain upward — it is short by construction).
    let parentId = body.parentId;
    if (parentId !== undefined && parentId !== null) {
      if (parentId === id) {
        throw createError({ statusCode: 400, statusMessage: "A category can't be its own parent." });
      }
      let cursor: number | null = parentId;
      for (let depth = 0; depth < 50; depth++) {
        if (cursor === id) {
          throw createError({ statusCode: 400, statusMessage: "That parent would create a loop." });
        }
        if (cursor == null) break;
        const { data: row } = await admin
          .from("categories")
          .select("parent_id")
          .eq("id", cursor)
          .maybeSingle();
        if (!row) {
          throw createError({ statusCode: 400, statusMessage: "Parent category not found." });
        }
        cursor = row.parent_id;
      }
    }

    const update: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) update.name = body.name.trim();
    // Empty slug re-derives from the (new) name; never store blanks.
    if (body.slug !== undefined) {
      const derived = (body.slug.trim() || slugify(body.name ?? existing.name)).trim();
      if (!derived) throw createError({ statusCode: 400, statusMessage: "Slug must contain letters or numbers." });
      update.slug = derived;
    }
    if (body.description !== undefined) update.description = body.description?.trim() || null;
    if (body.imageUrl !== undefined) update.image_url = body.imageUrl;
    if (body.isActive !== undefined) update.is_active = body.isActive;
    if (parentId !== undefined) update.parent_id = parentId;

    const { data, error } = await admin
      .from("categories")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error) throwIfUniqueViolation(error, "A category with this slug already exists.");

    return { success: true, category: toCategory(data) };
  } catch (error: any) {
    console.error("Category update error:", error?.message || error);

    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: "Invalid form data", data: error.errors });
    }
    if (error?.statusCode) throw error;

    throw createError({ statusCode: 500, statusMessage: error?.message || "Failed to update category" });
  }
});
