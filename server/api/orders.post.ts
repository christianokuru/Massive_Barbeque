import { z } from "zod";
import { getServiceSupabase, getAuthUser } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";
import { cartSubtotal, lineTotal, orderTotals } from "~~/shared/utils/pricing";
import { isRateLimited } from "~~/server/utils/rateLimit";
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

const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1).max(50),
  fulfillmentType: z.enum(["delivery", "pickup"]),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  deliveryAddress: z
    .object({
      firstName: z.string(),
      lastName: z.string(),
      phone: z.string(),
      addressLine1: z.string(),
      addressLine2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string().optional(),
    })
    .optional(),
  pickupTime: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["paystack", "flutterwave"]),
});

export default defineEventHandler(async (event) => {
  try {
    // Cheap to create, easy to abuse for DB bloat: 20 per IP per 15 min.
    const ip = getRequestIP(event) || "unknown";
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

    const lines = live.map((v: any) => {
      const quantity = Math.min(99, quantities.get(v.id) ?? 1);
      return { variant: v, quantity, total: lineTotal(v.price, quantity) };
    });
    const subtotal = cartSubtotal(
      lines.map((l) => ({ price: l.variant.price, quantity: l.quantity }))
    );
    const { deliveryFee, total } = orderTotals(subtotal, body.fulfillmentType);

    const orderNumber = `MB${Date.now().toString().slice(-8)}`;

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
        customer_email: body.customerEmail,
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

    return { success: true, order: toOrder(order) };
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
