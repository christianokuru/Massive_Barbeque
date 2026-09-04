import { z } from 'zod';
import { db, schema } from '~~/server/db';
import { eq, and } from 'drizzle-orm';

const cartItemSchema = z.object({
  productVariantId: z.number(),
  quantity: z.number().int().min(1).default(1),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, cartItemSchema.parse);
    
    // Get cart ID
    let cartId = getCookie(event, 'cart_id');
    
    if (!cartId) {
      cartId = crypto.randomUUID();
      setCookie(event, 'cart_id', cartId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    // Check if user is logged in
    const session = await getUserSession(event);
    const userId = session?.user?.id;

    if (userId) {
      const existingUserCart = await db.query.carts.findFirst({
        where: eq(schema.carts.userId, userId),
      });

      if (existingUserCart) {
        cartId = existingUserCart.id;
      } else {
        await db.insert(schema.carts).values({
          id: cartId,
          userId,
        });
      }
    } else {
      const existingCart = await db.query.carts.findFirst({
        where: eq(schema.carts.id, cartId),
      });

      if (!existingCart) {
        await db.insert(schema.carts).values({
          id: cartId,
          sessionId: cartId,
        });
      }
    }

    // Check if item already exists in cart
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(schema.cartItems.cartId, cartId),
        eq(schema.cartItems.productVariantId, body.productVariantId)
      ),
    });

    if (existingItem) {
      // Update quantity
      await db.update(schema.cartItems)
        .set({ quantity: existingItem.quantity + body.quantity })
        .where(eq(schema.cartItems.id, existingItem.id));
    } else {
      // Add new item
      await db.insert(schema.cartItems).values({
        cartId,
        productVariantId: body.productVariantId,
        quantity: body.quantity,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Cart item add error:', error);
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid form data',
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to add item to cart',
    });
  }
});