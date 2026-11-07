import { Resend } from "resend";
import { getServiceSupabase } from "~~/server/utils/supabase";
import { getGuestTokenSecret, issueGuestToken } from "~~/server/utils/guestToken";
import { buildOrderConfirmationEmail } from "~~/server/utils/orderEmailTemplate";

/**
 * Email the buyer that their order is confirmed (called by the payment
 * webhooks right after an order is marked paid).
 *
 * Never throws: the payment is already recorded, and a failing email must
 * not make the gateway redeliver the webhook. Problems are logged.
 *
 * The link uses the canonical app URL (never the request Host). Guests get
 * a fresh signed order pass in the link so they can open the order from
 * any device; account holders are sent to their dashboard.
 */
export async function sendOrderConfirmationEmail(event: any, orderId: string): Promise<void> {
  try {
    const config = useRuntimeConfig(event);
    if (!config.resendApiKey) {
      console.warn(`Order email skipped for ${orderId}: RESEND_API_KEY is not set.`);
      return;
    }

    const { data: order, error } = await getServiceSupabase()
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .maybeSingle();
    if (error || !order) {
      console.error(`Order email skipped for ${orderId}: order not readable.`, error?.message || "");
      return;
    }
    if (!order.customer_email) return;

    const base = String(config.public.appUrl || "").replace(/\/+$/, "");
    const id = encodeURIComponent(order.id);
    let orderUrl = `${base}/dashboard/orders/${id}`;
    if (!order.user_id) {
      const token = issueGuestToken(order.id, order.customer_email, getGuestTokenSecret(event));
      orderUrl = `${base}/checkout/confirm?order=${id}&token=${encodeURIComponent(token)}`;
    }

    const { subject, html, text } = buildOrderConfirmationEmail({
      order,
      orderUrl,
      appName: config.public.appName,
    });

    const resend = new Resend(config.resendApiKey);
    const { error: sendError } = await resend.emails.send({
      from: config.fromEmail || "onboarding@resend.dev",
      to: [order.customer_email],
      // Replies reach the shop, not a no-reply void.
      replyTo: config.contactReceiverEmail || undefined,
      subject,
      html,
      text,
    });
    if (sendError) {
      console.error(`Order email failed for ${orderId}:`, sendError);
    }
  } catch (e: any) {
    console.error(`Order email failed for ${orderId}:`, e?.message || e);
  }
}
