import { db, schema } from '~~/server/db';
import { desc } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    // TODO: Add proper admin authentication middleware
    const session = await getUserSession(event);
    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    // Fetch all orders
    const orders = await db.query.orders.findMany({
      with: {
        items: true,
      },
      orderBy: [desc(schema.orders.createdAt)],
    });

    return { orders };
  } catch (error: any) {
    console.error('Admin orders fetch error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch orders',
    });
  }
});