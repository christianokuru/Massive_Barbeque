// Order confirmation email — pure builder (no network, no Nuxt) so it can
// be unit-tested. Reads the raw `orders` row shape (snake_case, including
// `order_items`). Every value from the database is HTML-escaped: names,
// notes and addresses are customer-typed.
//
// Email clients ignore stylesheets and CSS variables, so this uses plain
// inline colours (the site's theme tokens can't reach an inbox).
import { deliveryAddressLines } from "~~/shared/utils/orderDisplay";
import { formatNaira } from "~~/shared/utils/pricing";

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Pickup time in Lagos time, e.g. "Sat, 8 Nov, 2:30 pm". */
export function formatLagosTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export interface OrderEmailInput {
  order: any;
  /** Link where the buyer can view the order (already absolute). */
  orderUrl: string;
  appName?: string;
}

export function buildOrderConfirmationEmail({ order, orderUrl, appName }: OrderEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const brand = appName || "Massive Barbeque";
  const number = String(order?.order_number ?? "");
  const firstName = String(order?.customer_name ?? "").trim().split(/\s+/)[0] || "there";
  const items: any[] = Array.isArray(order?.order_items) ? order.order_items : [];
  const isPickup = order?.fulfillment_type === "pickup";
  const pickupAt = formatLagosTime(order?.pickup_time);
  const address = deliveryAddressLines(order?.delivery_address);

  const subject = `Order ${number} confirmed — ${brand}`;

  const itemRows = items
    .map(
      (i) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">
            ${escapeHtml(i.product_name)} <span style="color:#666;">(${escapeHtml(i.variant_name)})</span> × ${escapeHtml(i.quantity)}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">
            ${escapeHtml(formatNaira(i.total_price))}
          </td>
        </tr>`
    )
    .join("");

  const fulfillmentHtml = isPickup
    ? `<p style="margin:0;"><strong>Pickup</strong>${pickupAt ? ` — ${escapeHtml(pickupAt)}` : ""}</p>`
    : `<p style="margin:0 0 4px;"><strong>Delivery to:</strong></p>
       <p style="margin:0;color:#333;">${address.map(escapeHtml).join("<br>")}</p>`;

  const notesHtml = order?.notes
    ? `<p style="margin:16px 0 0;"><strong>Your notes:</strong><br><span style="white-space:pre-wrap;">${escapeHtml(order.notes)}</span></p>`
    : "";

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#111;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;">
      <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#c2410c;">${escapeHtml(brand)}</p>
      <h1 style="margin:8px 0 4px;font-size:22px;">Thanks, ${escapeHtml(firstName)} — your order is confirmed</h1>
      <p style="margin:0 0 20px;color:#555;">We've received your payment. Order <strong>${escapeHtml(number)}</strong> is on its way to the grill.</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
        ${itemRows}
        <tr><td style="padding:8px 0;color:#555;">Subtotal</td><td style="padding:8px 0;text-align:right;">${escapeHtml(formatNaira(order?.subtotal))}</td></tr>
        <tr><td style="padding:0 0 8px;color:#555;">Delivery</td><td style="padding:0 0 8px;text-align:right;">${escapeHtml(formatNaira(order?.delivery_fee))}</td></tr>
        <tr><td style="padding:8px 0;border-top:1px solid #ddd;font-weight:bold;">Total paid</td><td style="padding:8px 0;border-top:1px solid #ddd;text-align:right;font-weight:bold;">${escapeHtml(formatNaira(order?.total))}</td></tr>
      </table>

      <div style="margin-top:20px;font-size:14px;">
        ${fulfillmentHtml}
        ${notesHtml}
      </div>

      <p style="margin:24px 0 0;">
        <a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:#c2410c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:14px;">View your order</a>
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#777;">Questions? Just reply to this email.</p>
    </div>
  </body>
</html>`;

  const text = [
    `Thanks, ${firstName} — your order ${number} is confirmed.`,
    "",
    ...items.map((i) => `${i.product_name} (${i.variant_name}) x ${i.quantity} — ${formatNaira(i.total_price)}`),
    "",
    `Subtotal: ${formatNaira(order?.subtotal)}`,
    `Delivery: ${formatNaira(order?.delivery_fee)}`,
    `Total paid: ${formatNaira(order?.total)}`,
    "",
    isPickup ? `Pickup${pickupAt ? `: ${pickupAt}` : ""}` : `Delivery to: ${address.join(", ")}`,
    "",
    `View your order: ${orderUrl}`,
  ].join("\n");

  return { subject, html, text };
}
