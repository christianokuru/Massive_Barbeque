import { z } from 'zod';
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";
import { assertOrderAccess } from "~~/server/utils/orderAccess";

// Display-only: never writes to the DB (webhooks are the sole paid
// writer). Returns a minimal paid/orderId/amount tuple — never the raw
// provider payload.
const flutterwaveVerifySchema = z.object({
  transaction_id: z.coerce.string().min(1).max(100),
  guestToken: z.string().max(4096).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readValidatedBody(event, flutterwaveVerifySchema.parse);
    const ip = getClientIp(event);
    const { limited } = isRateLimited(`pay-verify:${ip}:${body.transaction_id.slice(0, 64)}`, { limit: 60, windowSecs: 3600 });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many verification attempts. Try again later." });
    }

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

    // Transaction ids are global across merchants — only honor ones WE
    // initiated (un-guessable tx_ref match), otherwise this endpoint is
    // a customer-data oracle.
    const { getServiceSupabase } = await import("~~/server/utils/supabase");
    const supabase = getServiceSupabase();
    const { data: known } = await supabase
      .from("payments")
      .select("order_id, reference")
      .eq("provider", "flutterwave")
      .eq("reference", data.data?.tx_ref)
      .maybeSingle();
    if (!known) {
      throw createError({ statusCode: 404, statusMessage: "Transaction not found." });
    }
    const { order } = await assertOrderAccess(event, known.order_id, body.guestToken);

    // Bind the provider answer to OUR order before calling it paid.
    const paid =
      data.data?.status === "successful" &&
      data.data?.tx_ref === known.reference &&
      data.data?.currency === "NGN" &&
      Number.isFinite(Number(data.data?.amount)) &&
      Number(data.data.amount) >= Number(order.total);

    return {
      success: true,
      paid,
      orderId: known.order_id,
      amount: Number(order.total),
      currency: "NGN",
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
    // Preserve inner codes (notably 429) — never mask them as 500.
    if (error?.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to verify payment',
    });
  }
});
