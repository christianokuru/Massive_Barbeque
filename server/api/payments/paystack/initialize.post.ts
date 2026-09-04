import { z } from 'zod';
import crypto from 'crypto';

const paystackInitializeSchema = z.object({
  email: z.string().email(),
  amount: z.number().positive(),
  orderId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readValidatedBody(event, paystackInitializeSchema.parse);

    const reference = `PAY_${crypto.randomUUID()}`;
    const amountInKobo = Math.round(body.amount * 100); // Paystack uses kobo

    const payload = {
      email: body.email,
      amount: amountInKobo,
      reference,
      callback_url: `${config.public.appUrl}/checkout/confirm`,
      metadata: {
        ...body.metadata,
        orderId: body.orderId,
        custom_fields: [
          {
            display_name: "Order ID",
            variable_name: "order_id",
            value: body.orderId || reference,
          },
        ],
      },
    };

    // Call Paystack API to initialize transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.status) {
      throw createError({
        statusCode: 400,
        statusMessage: data.message || 'Failed to initialize payment',
      });
    }

    // Record the pending payment so the webhook can confirm the order.
    if (body.orderId) {
      const { getServiceSupabase } = await import("~~/server/utils/supabase");
      await getServiceSupabase()
        .from("payments")
        .upsert(
          {
            order_id: body.orderId,
            provider: "paystack",
            reference: data.data.reference,
            amount: body.amount,
            currency: "NGN",
            status: "pending",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "reference" }
        );
    }

    return {
      success: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      access_code: data.data.access_code,
    };
  } catch (error: any) {
    console.error('Paystack initialization error:', error);
    
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