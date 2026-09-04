import { db, schema } from '~~/server/db';
import { eq, desc } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const activeOnly = query.activeOnly !== 'false';

    let whereCondition;
    if (activeOnly) {
      whereCondition = eq(schema.categories.isActive, true);
    }

    // Fetch categories
    const categories = await db.query.categories.findMany({
      where: whereCondition,
      with: {
        parent: true,
      },
      orderBy: [desc(schema.categories.createdAt)],
    });

    return { categories };
  } catch (error: any) {
    console.error('Categories fetch error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch categories',
    });
  }
});