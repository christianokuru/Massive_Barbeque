import { z } from "zod";
import { getServiceSupabase } from "~~/server/utils/supabase";
import { auditAdminAction, requireOwner } from "~~/server/utils/adminGovernance";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";

const refundSchema = z.object({
  // OUR payment reference (un-guessable PAY_/FLW_ uuid), never a client amount.
  reference: z.string().min(1).max(200),
});

// Owner-only money-out: moves real money at the provider, then records it.
// Only paid payments refund; provider confirmation is required before any
// write (a merely-accepted refund stays pending and is retried by hand).
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireOwner(event);
    const ip = getClientIp(event);
    const { limited } = isRateLimited(`admin-refund:${ip}`, { limit: 20, windowSecs: 3600 });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many attempts. Try again later." });
    }

    const config = useRuntimeConfig();
    const body = await readValidatedBody(event, refundSchema.parse);
    const admin = getServiceSupabase();

    const { data: payment } = await admin
      .from("payments")
      .select("order_id, provider, reference, amount, currency, status, raw")
      .eq("reference", body.reference)
      .maybeSingle();
    if (!payment) throw createError({ statusCode: 404, statusMessage: "Payment not found." });
    if (payment.status !== "paid") {
      throw createError({ statusCode: 400, statusMessage: "Only paid payments can be refunded." });
    }

    let confirmed = false;
    let pending = false;
    if (payment.provider === "paystack") {
      const res = await fetch("https://api.paystack.co/refund", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        // No amount: full refund of the original transaction.
        body: JSON.stringify({ transaction: payment.reference }),
      });
      const data = await res.json().catch(() => null);
      const state = String(data?.data?.status || "").toLowerCase();
      confirmed = data?.status === true && (state === "success" || state === "processed");
      pending = data?.status === true && (state === "pending" || state === "processing");
      if (!confirmed && !pending) {
        throw createError({
          statusCode: 400,
          statusMessage: data?.message || "Refund was not accepted by Paystack.",
        });
      }
    } else if (payment.provider === "flutterwave") {
      // Provider transaction id lives in the stored webhook payload.
      const transactionId = (payment.raw as any)?.id;
      if (transactionId === undefined || transactionId === null) {
        throw createError({ statusCode: 400, statusMessage: "No provider transaction on record for this payment." });
      }
      const res = await fetch(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/refund`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.flutterwaveSecretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount: Number(payment.amount) }),
        }
      );
      const data = await res.json().catch(() => null);
      const state = String(data?.data?.status || "").toLowerCase();
      confirmed = data?.status === "success" && (state === "success" || state === "successful");
      pending = data?.status === "success" && (state === "pending" || state === "processing");
      if (!confirmed && !pending) {
        throw createError({
          statusCode: 400,
          statusMessage: data?.message || "Refund was not accepted by Flutterwave.",
        });
      }
    } else {
      throw createError({ statusCode: 400, statusMessage: "Unknown payment provider." });
    }

    // Provider merely accepted: report pending, write nothing. The money
    // state flips only on confirmation (retry the button later).
    if (pending && !confirmed) {
      return { success: true, state: "pending" as const };
    }

    await admin
      .from("payments")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("reference", payment.reference)
      .eq("status", "paid");
    await admin
      .from("orders")
      .update({ payment_status: "refunded", updated_at: new Date().toISOString() })
      .eq("id", payment.order_id);
    await auditAdminAction(user.email || null, "refund", payment.reference, ip);

    return { success: true, state: "refunded" as const };
  } catch (error: any) {
    console.error("Refund error:", error?.message || error);

    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: "Invalid request." });
    }
    if (error?.statusCode) throw error;

    throw createError({ statusCode: 500, statusMessage: "Refund failed." });
  }
});
