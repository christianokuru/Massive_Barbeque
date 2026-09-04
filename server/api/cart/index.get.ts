import { db, schema } from '~~/server/db';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    const userId = session?.user?.id;
    
    // Get cart ID from cookie or create new one
    let cartId = getCookie(event, 'cart_id');
    
    if (!cartId) {
      // Create new cart
      cartId = crypto.randomUUID();
      setCookie(event, 'cart_id', cartId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    // If user is logged in, use their cart
    if (userId) {
      const existingUserCart = await db.query.carts.findFirst({
        where: eq(schema.carts.userId, userId),
      });

      if (existingUserCart) {
        cartId = existingUserCart.id;
      } else {
        // Create user cart
        await db.insert(schema.carts).values({
          id: cartId,
          userId,
        });
      }
    } else {
      // Ensure cart exists for guest
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

    // Fetch cart with items
    const cart = await db.query.carts.findFirst({
      where: eq(schema.carts.id, cartId),
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

    if (!cart) {
      return {
        cart: {
          id: cartId,
          items: [],
          total: 0,
        },
      };
    }

    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      return sum + (Number(item.variant.price) * item.quantity);
    }, 0);

    return {
      cart: {
        ...cart,
        total,
      },
    };
  } catch (error: any) {
    console.error('Cart fetch error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch cart',
    });
  }
});