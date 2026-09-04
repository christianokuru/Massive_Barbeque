import { z } from 'zod';
import { db, schema } from '~~/server/db';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const orderSchema = z.object({
  fulfillmentType: z.enum(['delivery', 'pickup']),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  deliveryAddress: z.object({
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string().optional(),
  }).optional(),
  pickupTime: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(['paystack', 'flutterwave']),
});

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);
    const userId = session?.user?.id;
    
    const body = await readValidatedBody(event, orderSchema.parse);

    // Get user's cart
    let cartId = getCookie(event, 'cart_id');
    
    if (userId) {
      const userCart = await db.query.carts.findFirst({
        where: eq(schema.carts.userId, userId),
      });
      if (userCart) cartId = userCart.id;
    }

    if (!cartId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cart not found',
      });
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

    if (!cart || cart.items.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cart is empty',
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + (Number(item.variant.price) * item.quantity);
    }, 0);

    const deliveryFee = body.fulfillmentType === 'delivery' ? 2000 : 0; // Example delivery fee
    const total = subtotal + deliveryFee;

    // Generate order number
    const orderNumber = `MB${Date.now().toString().slice(-8)}`;

    // Create order
    const [newOrder] = await db.insert(schema.orders).values({
      id: crypto.randomUUID(),
      userId: userId || null,
      orderNumber,
      status: 'pending',
      fulfillmentType: body.fulfillmentType,
      subtotal: subtotal.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      total: total.toFixed(2),
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      deliveryAddress: body.deliveryAddress || null,
      pickupTime: body.pickupTime ? new Date(body.pickupTime) : null,
      notes: body.notes || null,
      paymentMethod: body.paymentMethod,
      paymentStatus: 'pending',
    }).returning();

    // Create order items
    const orderItemsData = cart.items.map(item => ({
      orderId: newOrder.id,
      productVariantId: item.variant.id,
      productName: item.variant.product.name,
      variantName: item.variant.name,
      sku: item.variant.sku,
      quantity: item.quantity,
      unitPrice: item.variant.price,
      totalPrice: (Number(item.variant.price) * item.quantity).toFixed(2),
    }));

    await db.insert(schema.orderItems).values(orderItemsData);

    // Clear cart
    await db.delete(schema.cartItems).where(eq(schema.cartItems.cartId, cartId));

    // Fetch complete order
    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.id, newOrder.id),
      with: {
        items: true,
      },
    });

    return { 
      success: true, 
      order 
    };
  } catch (error: any) {
    console.error('Order creation error:', error);
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid form data',
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create order',
    });
  }
});