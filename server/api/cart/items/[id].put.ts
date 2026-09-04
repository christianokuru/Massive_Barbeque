import { z } from 'zod';
import { db, schema } from '~~/server/db';
import { eq } from 'drizzle-orm';

const cartItemUpdateSchema = z.object({
  quantity: z.number().int().min(1),
});

export default defineEventHandler(async (event) => {
  try {
    const itemId = getRouterParam(event, 'id');
    
    if (!itemId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Item ID is required',
      });
    }

    const body = await readValidatedBody(event, cartItemUpdateSchema.parse);

    // Update cart item
    await db.update(schema.cartItems)
      .set({ quantity: body.quantity })
      .where(eq(schema.cartItems.id, Number(itemId)));

    return { success: true };
  } catch (error: any) {
    console.error('Cart item update error:', error);
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid form data',
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update cart item',
    });
  }
});