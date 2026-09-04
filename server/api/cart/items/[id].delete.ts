import { db, schema } from '~~/server/db';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    const itemId = getRouterParam(event, 'id');
    
    if (!itemId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Item ID is required',
      });
    }

    // Delete cart item
    await db.delete(schema.cartItems)
      .where(eq(schema.cartItems.id, Number(itemId)));

    return { success: true };
  } catch (error: any) {
    console.error('Cart item delete error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete cart item',
    });
  }
});