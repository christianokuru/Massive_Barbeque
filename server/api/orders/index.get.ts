import { db, schema } from '~~/server/db';
import { eq, desc } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    const userId = session?.user?.id;

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    // Fetch user's orders
    const orders = await db.query.orders.findMany({
      where: eq(schema.orders.userId, userId),
      with: {
        items: true,
      },
      orderBy: [desc(schema.orders.createdAt)],
    });

    return { orders };
  } catch (error: any) {
    console.error('Orders fetch error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch orders',
    });
  }
});