import { db, schema } from "~~/server/db";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, statusMessage: "Product ID required" });

  await db.delete(schema.products).where(eq(schema.products.id, id));
  return { success: true };
});
