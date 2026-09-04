import { db, schema } from '~~/server/db';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Product ID is required',
      });
    }

    const productId = Number(id);

    // Fetch product with variants and category
    const product = await db.query.products.findFirst({
      where: eq(schema.products.id, productId),
      with: {
        variants: {
          where: eq(schema.productVariants.isActive, true),
        },
        category: true,
      },
    });

    if (!product) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Product not found',
      });
    }

    return { product };
  } catch (error: any) {
    console.error('Product fetch error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch product',
    });
  }
});