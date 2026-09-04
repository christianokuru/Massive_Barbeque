import { db, schema } from '~~/server/db';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    const userId = session?.user?.id;
    const orderId = getRouterParam(event, 'id');

    if (!orderId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Order ID is required',
      });
    }

    // Fetch order
    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
      with: {
        items: {
          with: {
            variant: {
              with: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Order not found',
      });
    }

    // Check if user owns this order (admins and guest orders can view)
    const role = (session?.user as any)?.role;
    if (order.userId && order.userId !== userId && role !== "admin") {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
      });
    }

    return { order };
  } catch (error: any) {
    console.error('Order fetch error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch order',
    });
  }
});