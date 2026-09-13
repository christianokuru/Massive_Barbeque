import { z } from 'zod';
import { isRateLimited } from "~~/server/utils/rateLimit";

const flutterwaveVerifySchema = z.object({
  transaction_id: z.string(),
});

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const ip = getRequestIP(event) || "unknown";
    const { limited } = isRateLimited(`pay-verify:${ip}`, { limit: 60, windowSecs: 3600 });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many verification attempts. Try again later." });
    }
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

    // Transaction ids are global across merchants — only reveal provider
    // data for transactions WE initiated (un-guessable tx_ref match),
    // otherwise this endpoint is a customer-data oracle.
    const { getServiceSupabase } = await import("~~/server/utils/supabase");
    const { data: known } = await getServiceSupabase()
      .from("payments")
      .select("id")
      .eq("provider", "flutterwave")
      .eq("reference", data.data?.tx_ref)
      .maybeSingle();
    if (!known) {
      throw createError({ statusCode: 404, statusMessage: "Transaction not found." });
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