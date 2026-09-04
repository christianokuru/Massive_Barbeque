import { db, schema } from '~~/server/db';
import { eq, and, desc, sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const categoryId = query.categoryId ? Number(query.categoryId) : undefined;
    const featured = query.featured === 'true';
    const search = query.search as string | undefined;
    const limit = query.limit ? Number(query.limit) : 50;
    const offset = query.offset ? Number(query.offset) : 0;

    // Build base query
    let whereCondition = eq(schema.products.isActive, true);

    if (categoryId) {
      whereCondition = and(whereCondition, eq(schema.products.categoryId, categoryId))!;
    }

    if (featured) {
      whereCondition = and(whereCondition, eq(schema.products.featured, true))!;
    }

    // Fetch products with their variants
    const products = await db.query.products.findMany({
      where: whereCondition,
      with: {
        variants: {
          where: eq(schema.productVariants.isActive, true),
        },
        category: true,
      },
      orderBy: [desc(schema.products.createdAt)],
      limit,
      offset,
    });

    // Filter by search term if provided (client-side filtering for simplicity)
    let filteredProducts = products;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)
      );
    }

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.products)
      .where(whereCondition);

    return {
      products: filteredProducts,
      pagination: {
        total: Number(totalCount[0]?.count || 0),
        limit,
        offset,
      },
    };
  } catch (error: any) {
    console.error('Products fetch error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch products',
    });
  }
});