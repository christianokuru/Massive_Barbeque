import { z } from "zod";
import { getServiceSupabase, getAuthUser } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";
import { cartSubtotal, lineTotal, orderTotals } from "~~/shared/utils/pricing";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";
import { getGuestTokenSecret, issueGuestToken } from "~~/server/utils/guestToken";
import crypto from "crypto";

// The cart lives in the browser; the client submits ids + quantities
// ONLY. Prices, availability, and totals are resolved from the live
// catalog below — client money is never trusted.
//
// Writes go through the service role: RLS carries no customer insert
// policy for orders, and every value written here is server-derived
// (identity from the verified session, prices from the database).
const orderItemSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99),
});

const orderSchema = z
  .object({
    items: z.array(orderItemSchema).min(1).max(50),
    fulfillmentType: z.enum(["delivery", "pickup"]),
    customerEmail: z.string().email().max(254).toLowerCase().trim(),
    customerName: z.string().min(1).max(100),
    customerPhone: z.string().min(1).max(30),
    deliveryAddress: z
      .object({
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        phone: z.string().min(1).max(30),
        addressLine1: z.string().min(1).max(300),
        addressLine2: z.string().max(300).optional(),
        city: z.string().min(1).max(100),
        state: z.string().min(1).max(100),
        postalCode: z.string().max(20).optional(),
      })
      .optional(),
    pickupTime: z
      .string()
      .max(100)
      .optional()
      .refine((v) => v === undefined || Number.isFinite(Date.parse(v)), {
        message: "Invalid pickup time",
      }),
    notes: z.string().max(2000).optional(),
    paymentMethod: z.enum(["paystack", "flutterwave"]),
  })
  // Delivery is meaningless without an address — reject rather than
  // storing a deliver-to-nowhere order.
  .refine((data) => data.fulfillmentType === "pickup" || data.deliveryAddress, {
    message: "Delivery address is required for delivery orders",
    path: ["deliveryAddress"],
  });

export default defineEventHandler(async (event) => {
  try {
    // Cheap to create, easy to abuse for DB bloat: 20 per IP per 15 min.
    const ip = getClientIp(event);
    const { limited, retryAfterSecs } = isRateLimited(`orders:${ip}`, {
      limit: 20,
      windowSecs: 900,
    });
    if (limited) {
      setResponseHeader(event, "Retry-After", String(retryAfterSecs));
      throw createError({
        statusCode: 429,
        statusMessage: "Too many orders. Try again later.",
      });
    }

    const { user } = await getAuthUser(event);
    const userId = user?.id ?? null;
    const supabase = getServiceSupabase();

    const body = await readValidatedBody(event, orderSchema.parse);

    // A logged-in caller can't plant orders into someone else's history:
    // identity comes from the verified session, never the client.
    const customerEmail = (user?.email || body.customerEmail).toLowerCase();

    // Merge duplicate lines so each variant is priced once.
    const quantities = new Map<number, number>();
    for (const item of body.items) {
      quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity);
    }
    const variantIds = [...quantities.keys()];

    // Live catalog truth: variant must exist and be active under an
    // active product. Anything else means a stale cart.
    const { data: variants, error: variantsError } = await supabase
      .from("product_variants")
      .select("*, products!inner(id, name, is_active)")
      .in("id", variantIds)
      .eq("is_active", true);
    if (variantsError) throw variantsError;
    const live = (variants || []).filter((v: any) => v.products?.is_active !== false);
    if (live.length !== variantIds.length) {
      throw createError({
        statusCode: 400,
        statusMessage: "Some items in your cart are no longer available.",
      });
    }

    // No stock gate: the kitchen grills to order and everything is always
    // available (owner decision 2026-09-20). Availability = the variant
    // exists and is active under an active product (checked above).
    // inventory_qty remains in the schema as informational metadata only.

    const lines = live.map((v: any) => {
      const quantity = Math.min(99, quantities.get(v.id) ?? 1);
      return { variant: v, quantity, total: lineTotal(v.price, quantity) };
    });
    const subtotal = cartSubtotal(
      lines.map((l) => ({ price: l.variant.price, quantity: l.quantity }))
    );
    const { deliveryFee, total } = orderTotals(subtotal, body.fulfillmentType);

    // Unpredictable, collision-resistant order numbers (Date.now-based
    // numbers collide under concurrency and leak order rate).
    const orderNumber = `MB${crypto.randomInt(10000000, 100000000)}`;

    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        id: crypto.randomUUID(),
        user_id: userId,
        order_number: orderNumber,
        status: "pending",
        fulfillment_type: body.fulfillmentType,
        subtotal: subtotal.toFixed(2),
        delivery_fee: deliveryFee.toFixed(2),
        total: total.toFixed(2),
        customer_email: customerEmail,
        customer_name: body.customerName,
        customer_phone: body.customerPhone,
        delivery_address: body.deliveryAddress
          ? {
              first_name: body.deliveryAddress.firstName,
              last_name: body.deliveryAddress.lastName,
              phone: body.deliveryAddress.phone,
              address_line_1: body.deliveryAddress.addressLine1,
              address_line_2: body.deliveryAddress.addressLine2 ?? null,
              city: body.deliveryAddress.city,
              state: body.deliveryAddress.state,
              postal_code: body.deliveryAddress.postalCode ?? null,
            }
          : null,
        pickup_time: body.pickupTime ? new Date(body.pickupTime).toISOString() : null,
        notes: body.notes || null,
        payment_method: body.paymentMethod,
        payment_status: "pending",
      })
      .select()
      .single();
    if (orderError) throw orderError;

    const { error: orderItemsError } = await supabase.from("order_items").insert(
      lines.map((l: any) => ({
        order_id: newOrder.id,
        variant_id: l.variant.id,
        product_name: l.variant.products.name,
        variant_name: l.variant.name,
        sku: l.variant.sku,
        quantity: l.quantity,
        unit_price: Number(l.variant.price).toFixed(2),
        total_price: l.total.toFixed(2),
      }))
    );
    if (orderItemsError) throw orderItemsError;

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", newOrder.id)
      .single();
    if (fetchError) throw fetchError;

    // Guest orders get a signed token (HMAC, bound to order + email,
    // 30-day expiry). The buyer must present it to read the order, init
    // payment, or verify — UUID alone no longer authorizes anything.
    const guestToken = userId
      ? undefined
      : issueGuestToken(newOrder.id, customerEmail, getGuestTokenSecret(event));

    return { success: true, order: toOrder(order), guestToken };
  } catch (error: any) {
    console.error("Order creation error:", error?.message || error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid form data",
        data: error.errors,
      });
    }
    if (error?.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Failed to create order",
    });
  }
});
