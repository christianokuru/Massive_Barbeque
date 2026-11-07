import { describe, expect, it } from "vitest";
import { buildOrderConfirmationEmail, escapeHtml, formatLagosTime } from "../server/utils/orderEmailTemplate";

const baseOrder = {
  order_number: "MB12345678",
  customer_name: "Ada Obi",
  subtotal: "14000.00",
  delivery_fee: "2000.00",
  total: "16000.00",
  fulfillment_type: "delivery",
  delivery_address: {
    first_name: "Ada",
    last_name: "Obi",
    address_line_1: "12 Allen Avenue",
    city: "Ikeja",
    state: "Lagos",
    phone: "08012345678",
  },
  order_items: [
    { product_name: "Chicken", variant_name: "Regular", quantity: 2, total_price: "14000.00" },
  ],
};

describe("buildOrderConfirmationEmail", () => {
  it("includes order number, items, totals, address and link", () => {
    const { subject, html, text } = buildOrderConfirmationEmail({
      order: baseOrder,
      orderUrl: "https://massivebarbeque.com/dashboard/orders/abc",
    });
    expect(subject).toContain("MB12345678");
    expect(html).toContain("Chicken");
    expect(html).toContain("₦14,000");
    expect(html).toContain("₦16,000");
    expect(html).toContain("12 Allen Avenue");
    expect(html).toContain("https://massivebarbeque.com/dashboard/orders/abc");
    expect(text).toContain("Total paid: ₦16,000");
  });

  it("shows the pickup time in Lagos time for pickup orders", () => {
    const { html, text } = buildOrderConfirmationEmail({
      order: {
        ...baseOrder,
        fulfillment_type: "pickup",
        delivery_address: null,
        delivery_fee: "0.00",
        pickup_time: "2026-11-08T13:30:00.000Z", // 2:30 pm in Lagos (UTC+1)
      },
      orderUrl: "https://x.test/o",
    });
    expect(html).toContain("Pickup");
    expect(html).not.toContain("Delivery to");
    expect(text).toMatch(/2:30/);
  });

  it("escapes customer-typed text", () => {
    const { html } = buildOrderConfirmationEmail({
      order: { ...baseOrder, customer_name: "<script>x</script>", notes: '"><img src=x>' },
      orderUrl: "https://x.test/o?a=1&b=2",
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("a=1&amp;b=2");
  });
});

describe("helpers", () => {
  it("escapeHtml handles null", () => {
    expect(escapeHtml(null)).toBe("");
  });
  it("formatLagosTime ignores bad input", () => {
    expect(formatLagosTime(null)).toBe("");
    expect(formatLagosTime("not a date")).toBe("");
  });
});

import { buildShopOrderEmail, parseEmailList } from "../server/utils/orderEmailTemplate";

describe("buildShopOrderEmail", () => {
  it("gives the shop who, what, where and an admin link", () => {
    const { subject, html, text } = buildShopOrderEmail({
      order: { ...baseOrder, customer_email: "ada@example.com", customer_phone: "08012345678", payment_method: "paystack", notes: "Extra pepper" },
      adminUrl: "https://massivebarbeque.com/admin/orders/abc",
    });
    expect(subject).toContain("MB12345678");
    expect(subject).toContain("₦16,000");
    expect(subject).toContain("Delivery");
    expect(html).toContain("08012345678");
    expect(html).toContain("ada@example.com");
    expect(html).toContain("12 Allen Avenue");
    expect(html).toContain("Extra pepper");
    expect(html).toContain("https://massivebarbeque.com/admin/orders/abc");
    expect(text).toContain("2 x Chicken (Regular)");
  });

  it("puts pickup time in the subject for pickup orders", () => {
    const { subject } = buildShopOrderEmail({
      order: { ...baseOrder, fulfillment_type: "pickup", pickup_time: "2026-11-08T13:30:00.000Z" },
      adminUrl: "https://x.test/a",
    });
    expect(subject).toMatch(/Pickup .*2:30/);
  });

  it("escapes customer-typed text", () => {
    const { html } = buildShopOrderEmail({
      order: { ...baseOrder, customer_name: "<b>x</b>", notes: "<img src=x>" },
      adminUrl: "https://x.test/a",
    });
    expect(html).not.toContain("<b>x</b>");
    expect(html).not.toContain("<img src=x>");
  });
});

describe("parseEmailList", () => {
  it("splits, trims, lowercases, dedupes and drops junk", () => {
    expect(parseEmailList(" Owner@Shop.com, kitchen@shop.com;owner@shop.com  nope ")).toEqual([
      "owner@shop.com",
      "kitchen@shop.com",
    ]);
    expect(parseEmailList(undefined)).toEqual([]);
  });
});
