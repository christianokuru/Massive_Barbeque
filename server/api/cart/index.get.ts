import { getSupabase, getAuthUser } from "~~/server/utils/supabase";
import { resolveCartId } from "~~/server/utils/cart";
import { toCartItem } from "~~/server/utils/mappers";
import { cartSubtotal } from "~~/shared/utils/pricing";

export default defineEventHandler(async (event) => {
  try {
    const { supabase, user } = await getAuthUser(event);
    const cartId = await resolveCartId(event, supabase, user?.id ?? null);

    const { data: items, error } = await supabase
      .from("cart_items")
      .select(
        "*, product_variants!inner(*, products!inner(id, name, image_url))"
      )
      .eq("cart_id", cartId);
    if (error) throw error;

    const mapped = (items || []).map(toCartItem);
    const total = cartSubtotal(
      mapped.map((i: any) => ({
        price: i.variant?.price ?? 0,
        quantity: i.quantity,
      }))
    );

    return { cart: { id: cartId, items: mapped, total } };
  } catch (error: any) {
    console.error("Cart fetch error:", error?.message || error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch cart",
    });
  }
});
