import { z } from "zod";
import { db, schema } from "~~/server/db";
import { eq } from "drizzle-orm";

const productSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  categoryId: z.number().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, statusMessage: "Product ID required" });

  const body = await readValidatedBody(event, productSchema.parse);
  await db.update(schema.products).set(body).where(eq(schema.products.id, id));
  const product = await db.query.products.findFirst({
    where: eq(schema.products.id, id),
    with: { variants: true, category: true },
  });
  return { success: true, product };
});
