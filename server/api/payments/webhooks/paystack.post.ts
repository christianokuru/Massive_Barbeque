import crypto from 'crypto';
import { db, schema } from '~~/server/db';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readBody(event);
    
    // Get Paystack signature from headers
    const signature = getHeader(event, 'x-paystack-signature');
    
    if (!signature) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing signature',
      });
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', config.paystackSecretKey)
      .update(JSON.stringify(body))
      .digest('hex');

    if (hash !== signature) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid signature',
      });
    }

    // Process webhook event
    const event_type = body.event;
    
    if (event_type === 'charge.success') {
      const paymentData = body.data;
      
      // Update payment status in database
      await db.update(schema.payments)
        .set({
          status: 'succeeded',
          transactionId: paymentData.reference,
          gatewayResponse: paymentData,
          updatedAt: new Date(),
        })
        .where(eq(schema.payments.reference, paymentData.reference));

      // Update order status
      const payment = await db.query.payments.findFirst({
        where: eq(schema.payments.reference, paymentData.reference),
      });

      if (payment) {
        await db.update(schema.orders)
          .set({
            paymentStatus: 'paid',
            status: 'confirmed',
            updatedAt: new Date(),
          })
          .where(eq(schema.orders.id, payment.orderId));
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Paystack webhook error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook processing failed',
    });
  }
});