import { z } from 'zod';
import { db, schema } from '~~/server/db';
import { eq } from 'drizzle-orm';

const orderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
});

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

    const orderId = getRouterParam(event, 'id');
    
    if (!orderId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Order ID is required',
      });
    }

    const body = await readValidatedBody(event, orderStatusSchema.parse);

    // Update order status
    const updateData: any = {
      status: body.status,
      updatedAt: new Date(),
    };

    if (body.paymentStatus) {
      updateData.paymentStatus = body.paymentStatus;
    }

    await db.update(schema.orders)
      .set(updateData)
      .where(eq(schema.orders.id, orderId));

    // Fetch updated order
    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
      with: {
        items: true,
      },
    });

    return { 
      success: true, 
      order 
    };
  } catch (error: any) {
    console.error('Order status update error:', error);
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid form data',
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update order status',
    });
  }
});