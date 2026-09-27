import { z } from "zod";
import { requireAdmin, getServiceSupabase } from "~~/server/utils/supabase";
import { imageUrlSchema } from "~~/server/utils/productImages";
import { slugify } from "~~/shared/utils/slug";
import { throwIfUniqueViolation } from "~~/server/utils/uniqueViolation";
import { toCategory } from "~~/server/utils/mappers";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  imageUrl: imageUrlSchema.optional(),
  isActive: z.boolean().default(true),
  parentId: z.number().int().positive().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);
    const body = await readValidatedBody(event, categorySchema.parse);

    // Slug falls back to the name; an un-sluggable name is a 400, not an
    // empty unique column waiting to collide.
    const slug = (body.slug?.trim() || slugify(body.name)).trim();
    if (!slug) {
      throw createError({ statusCode: 400, statusMessage: "Name must contain letters or numbers." });
    }

    const admin = getServiceSupabase();
    if (body.parentId) {
      const { data: parent } = await admin
        .from("categories")
        .select("id")
        .eq("id", body.parentId)
        .maybeSingle();
      if (!parent) {
        throw createError({ statusCode: 400, statusMessage: "Parent category not found." });
      }
    }

    const { data, error } = await admin
      .from("categories")
      .insert({
        name: body.name.trim(),
        slug,
        description: body.description?.trim() || null,
        image_url: body.imageUrl ?? null,
        is_active: body.isActive,
        parent_id: body.parentId ?? null,
      })
      .select()
      .single();
    if (error) throwIfUniqueViolation(error, "A category with this slug already exists.");

    return { success: true, category: toCategory(data) };
  } catch (error: any) {
    console.error("Category creation error:", error?.message || error);

    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: "Invalid form data", data: error.errors });
    }
    if (error?.statusCode) throw error;

    throw createError({ statusCode: 500, statusMessage: error?.message || "Failed to create category" });
  }
});
