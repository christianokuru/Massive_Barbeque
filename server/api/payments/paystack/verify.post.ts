import { z } from 'zod';

const paystackVerifySchema = z.object({
  reference: z.string(),
});

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readValidatedBody(event, paystackVerifySchema.parse);

    // Call Paystack API to verify transaction
    const response = await fetch(`https://api.paystack.co/transaction/verify/${body.reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.status) {
      throw createError({
        statusCode: 400,
        statusMessage: data.message || 'Failed to verify payment',
      });
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error: any) {
    console.error('Paystack verification error:', error);
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid form data',
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to verify payment',
    });
  }
});