import { z } from "zod";
import { getSupabase, getAuthUser } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";
import { cartSubtotal, lineTotal, orderTotals } from "~~/shared/utils/pricing";
import crypto from "crypto";

const orderSchema = z.object({
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
    const { supabase, user } = await getAuthUser(event);
    const userId = user?.id ?? null;

    const body = await readValidatedBody(event, orderSchema.parse);

    // Resolve cart: logged-in users by user_id, guests by cookie.
    let cartId = getCookie(event, "cart_id");
    if (userId) {
      const { data: userCart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (userCart) cartId = userCart.id;
    }
    if (!cartId) {
      throw createError({ statusCode: 400, statusMessage: "Cart not found" });
    }

    const { data: items, error: itemsError } = await supabase
      .from("cart_items")
      .select("*, product_variants!inner(*, products!inner(id, name))")
      .eq("cart_id", cartId);
    if (itemsError) throw itemsError;
    if (!items || items.length === 0) {
      throw createError({ statusCode: 400, statusMessage: "Cart is empty" });
    }

    // Totals (shared pricing logic — keep in sync with checkout page).
    const subtotal = cartSubtotal(
      items.map((i: any) => ({
        price: i.product_variants.price,
        quantity: i.quantity,
      }))
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
      items.map((item: any) => ({
        order_id: newOrder.id,
        variant_id: item.product_variants.id,
        product_name: item.product_variants.products.name,
        variant_name: item.product_variants.name,
        sku: item.product_variants.sku,
        quantity: item.quantity,
        unit_price: Number(item.product_variants.price).toFixed(2),
        total_price: lineTotal(
          item.product_variants.price,
          item.quantity
        ).toFixed(2),
      }))
    );
    if (orderItemsError) throw orderItemsError;

    // Clear cart.
    const { error: clearError } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cartId);
    if (clearError) throw clearError;

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
