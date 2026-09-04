import { z } from 'zod';
import crypto from 'crypto';

const flutterwaveInitializeSchema = z.object({
  email: z.string().email(),
  amount: z.number().positive(),
  orderId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readValidatedBody(event, flutterwaveInitializeSchema.parse);

    const txRef = `FLW_${crypto.randomUUID()}`;

    const payload = {
      tx_ref: txRef,
      amount: body.amount,
      currency: 'NGN',
      email: body.email,
      customer: {
        email: body.email,
        name: body.customerName || '',
        phone: body.customerPhone || '',
      },
      redirect_url: `${config.public.appUrl}/checkout/confirm`,
      meta: {
        orderId: body.orderId,
        ...body.metadata,
      },
    };

    // Call Flutterwave API to initialize transaction
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.flutterwaveSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.status !== 'success') {
      throw createError({
        statusCode: 400,
        statusMessage: data.message || 'Failed to initialize payment',
      });
    }

    return {
      success: true,
      link: data.data.link,
      tx_ref: data.data.tx_ref,
    };
  } catch (error: any) {
    console.error('Flutterwave initialization error:', error);
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid form data',
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to initialize payment',
    });
  }
});