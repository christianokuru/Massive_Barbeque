import { Resend } from "resend";
import { getServiceSupabase } from "~~/server/utils/supabase";
import { getGuestTokenSecret, issueGuestToken } from "~~/server/utils/guestToken";
import {
  buildOrderConfirmationEmail,
  buildShopOrderEmail,
  parseEmailList,
} from "~~/server/utils/orderEmailTemplate";

/**
 * Emails for a newly paid order (called by the payment webhooks right
 * after the order is marked paid):
 *   1. the buyer's confirmation
 *   2. the shop's "new paid order" alert (ORDER_NOTIFY_EMAILS, else
 *      CONTACT_RECEIVER_EMAIL)
 *
 * Never throws: the payment is already recorded, and a failing email must
 * not make the gateway redeliver the webhook. Each email is sent on its
 * own, so one failing doesn't stop the other. Problems are logged.
 *
 * Links use the canonical app URL (never the request Host).
 */
export async function sendOrderPaidEmails(event: any, orderId: string): Promise<void> {
  try {
    const config = useRuntimeConfig(event);
    if (!config.resendApiKey) {
      console.warn(`Order emails skipped for ${orderId}: RESEND_API_KEY is not set.`);
      return;
    }

    const { data: order, error } = await getServiceSupabase()
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .maybeSingle();
    if (error || !order) {
      console.error(`Order emails skipped for ${orderId}: order not readable.`, error?.message || "");
      return;
    }

    const resend = new Resend(config.resendApiKey);
    const from = config.fromEmail || "onboarding@resend.dev";
    const base = String(config.public.appUrl || "").replace(/\/+$/, "");
    const id = encodeURIComponent(order.id);

    await Promise.all([
      sendBuyerEmail(),
      sendShopEmail(),
    ]);

    async function sendBuyerEmail() {
      try {
        if (!order.customer_email) return;
        // Guests get a fresh signed order pass so the link works on any
        // device; account holders go to their dashboard.
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
        const { error: sendError } = await resend.emails.send({
          from,
          to: [order.customer_email],
          // Replies reach the shop, not a no-reply void.
          replyTo: config.contactReceiverEmail || undefined,
          subject,
          html,
          text,
        });
        if (sendError) console.error(`Buyer order email failed for ${orderId}:`, sendError);
      } catch (e: any) {
        console.error(`Buyer order email failed for ${orderId}:`, e?.message || e);
      }
    }

    async function sendShopEmail() {
      try {
        const to = parseEmailList((config as any).orderNotifyEmails);
        if (!to.length) to.push(...parseEmailList(config.contactReceiverEmail));
        if (!to.length) {
          console.warn(`Shop order email skipped for ${orderId}: no ORDER_NOTIFY_EMAILS or CONTACT_RECEIVER_EMAIL.`);
          return;
        }
        const { subject, html, text } = buildShopOrderEmail({
          order,
          adminUrl: `${base}/admin/orders/${id}`,
          appName: config.public.appName,
        });
        const { error: sendError } = await resend.emails.send({
          from,
          to,
          // Hitting reply writes straight to the customer.
          replyTo: order.customer_email || undefined,
          subject,
          html,
          text,
        });
        if (sendError) console.error(`Shop order email failed for ${orderId}:`, sendError);
      } catch (e: any) {
        console.error(`Shop order email failed for ${orderId}:`, e?.message || e);
      }
    }
  } catch (e: any) {
    console.error(`Order emails failed for ${orderId}:`, e?.message || e);
  }
}
