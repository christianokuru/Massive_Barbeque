import { z } from 'zod';

const flutterwaveVerifySchema = z.object({
  transaction_id: z.string(),
});

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readValidatedBody(event, flutterwaveVerifySchema.parse);

    // Call Flutterwave API to verify transaction
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${body.transaction_id}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.flutterwaveSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.status !== 'success') {
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
    console.error('Flutterwave verification error:', error);
    
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