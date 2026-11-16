import { z } from "zod";
import crypto from "crypto";
import { apiError, defineApi, enforceRateLimit, parseBody } from "~~/server/utils/api";
import { db, must } from "~~/server/utils/db";
import { getAuthUser } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";
import { cartSubtotal, lineTotal } from "~~/shared/utils/pricing";
import { getDeliveryFee } from "~~/server/utils/siteSettings";
import { getGuestTokenSecret, issueGuestToken } from "~~/server/utils/guestToken";

// POST /api/orders — place an order (guests and signed-in customers).
//
// The browser sends ids + quantities ONLY. Prices, availability and totals
// come from the live catalog; the delivery fee from settings. A signed-in
// buyer's email comes from their session, never the form. Guests get a
// signed pass (guestToken) bound to order + email for every later step.
// Service role writes: there is no customer insert policy on orders.
const PICKUP_GRACE_MS = 5 * 60 * 1000;

const schema = z
  .object({
    items: z
      .array(z.object({
        variantId: z.number().int().positive(),
        quantity: z.number().int().min(1, "Quantity must be at least 1.").max(99),
      }))
      .min(1, "Your cart is empty.")
      .max(50),
    fulfillmentType: z.enum(["delivery", "pickup"]),
    customerEmail: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
    customerName: z.string().trim().min(1, "Enter your name.").max(100),
    customerPhone: z.string().trim().min(1, "Enter your phone number.").max(30),
    deliveryAddress: z
      .object({
        firstName: z.string().trim().min(1).max(100),
        lastName: z.string().trim().min(1).max(100),
        phone: z.string().trim().min(1).max(30),
        addressLine1: z.string().trim().min(1, "Enter a delivery address.").max(300),
        addressLine2: z.string().trim().max(300).optional(),
        city: z.string().trim().min(1).max(100),
        state: z.string().trim().min(1).max(100),
        postalCode: z.string().trim().max(20).optional(),
      })
      .optional(),
    pickupTime: z
      .string()
      .max(100)
      .optional()
      .refine((v) => v === undefined || Number.isFinite(Date.parse(v)), { message: "Invalid pickup time" })
      // Any future time (small grace for clock differences).
      .refine((v) => v === undefined || Date.parse(v) > Date.now() - PICKUP_GRACE_MS, {
        message: "Pickup time must be in the future",
      }),
    notes: z.string().max(2000).optional(),
    paymentMethod: z.enum(["paystack", "flutterwave"]),
  })
  .refine((d) => d.fulfillmentType === "pickup" || d.deliveryAddress, {
    message: "Delivery address is required for delivery orders",
    path: ["deliveryAddress"],
  })
  .refine((d) => d.fulfillmentType === "delivery" || !!d.pickupTime, {
    message: "Pickup time is required for pickup orders",
    path: ["pickupTime"],
  });

export default defineApi(async (event) => {
  // Cheap to create, easy to abuse for DB bloat: 20 per client per 15 min.
  enforceRateLimit(event, "orders", { limit: 20, windowSecs: 900, message: "Too many orders. Try again later." });
  const body = await parseBody(event, schema);
  const { user } = await getAuthUser(event);
  const userId = user?.id ?? null;
  const customerEmail = (user?.email || body.customerEmail).toLowerCase();

  // Merge duplicate lines so each size is priced once (capped at 99).
  const quantities = new Map<number, number>();
  for (const item of body.items) {
    quantities.set(item.variantId, Math.min(99, (quantities.get(item.variantId) ?? 0) + item.quantity));
  }
  const variantIds = [...quantities.keys()];

  // Live catalog truth: active size under an active product. Anything else
  // means a stale cart. No stock gate — grilled to order (owner decision
  // 2026-09-20); inventory_qty is informational.
  const variants = must(
    await db()
      .from("product_variants")
      .select("*, products!inner(id, name, is_active)")
      .in("id", variantIds)
      .eq("is_active", true),
  ) as any[];
  const live = variants.filter((v) => v.products?.is_active !== false);
  if (live.length !== variantIds.length) apiError(400, "Some items in your cart are no longer available.");

  const lines = live.map((v) => ({ variant: v, quantity: quantities.get(v.id)!, total: lineTotal(v.price, quantities.get(v.id)!) }));
  const subtotal = cartSubtotal(lines.map((l) => ({ price: l.variant.price, quantity: l.quantity })));
  const deliveryFee = body.fulfillmentType === "delivery" ? await getDeliveryFee() : 0;
  const total = subtotal + deliveryFee;

  const orderId = crypto.randomUUID();
  const a = body.deliveryAddress;
  must(
    await db().from("orders").insert({
      id: orderId,
      user_id: userId,
      // Unpredictable, collision-resistant (time-based numbers collided and
      // leaked order volume).
      order_number: `MB${crypto.randomInt(10000000, 100000000)}`,
      status: "pending",
      fulfillment_type: body.fulfillmentType,
      subtotal: subtotal.toFixed(2),
      delivery_fee: deliveryFee.toFixed(2),
      total: total.toFixed(2),
      customer_email: customerEmail,
      customer_name: body.customerName,
      customer_phone: body.customerPhone,
      // Stored raw snake_case (readers use deliveryAddressLines).
      delivery_address: a
        ? {
            first_name: a.firstName,
            last_name: a.lastName,
            phone: a.phone,
            address_line_1: a.addressLine1,
            address_line_2: a.addressLine2 || null,
            city: a.city,
            state: a.state,
            postal_code: a.postalCode || null,
          }
        : null,
      pickup_time: body.fulfillmentType === "pickup" && body.pickupTime ? new Date(body.pickupTime).toISOString() : null,
      notes: body.notes?.trim() || null,
      payment_method: body.paymentMethod,
      payment_status: "pending",
    }),
  );

  const { error: itemsError } = await db().from("order_items").insert(
    lines.map((l) => ({
      order_id: orderId,
      variant_id: l.variant.id,
      product_name: l.variant.products.name,
      variant_name: l.variant.name,
      sku: l.variant.sku,
      quantity: l.quantity,
      unit_price: Number(l.variant.price).toFixed(2),
      total_price: l.total.toFixed(2),
    })),
  );
  if (itemsError) {
    // No transaction across the two inserts: never leave an empty order.
    const { error: cleanupError } = await db().from("orders").delete().eq("id", orderId);
    if (cleanupError) console.error(`[orders] ${orderId} left without items:`, cleanupError.message);
    throw itemsError;
  }

  const order = must(await db().from("orders").select("*, order_items(*)").eq("id", orderId).single());
  const guestToken = userId ? undefined : issueGuestToken(orderId, customerEmail, getGuestTokenSecret(event));
  return { success: true, order: toOrder(order), guestToken };
});
