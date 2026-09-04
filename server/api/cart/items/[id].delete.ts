import { getSupabase, getAuthUser } from "~~/server/utils/supabase";
import { resolveCartId } from "~~/server/utils/cart";

export default defineEventHandler(async (event) => {
  try {
    const itemId = getRouterParam(event, "id");

    if (!itemId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Item ID is required",
      });
    }

    const { supabase, user } = await getAuthUser(event);
    const cartId = await resolveCartId(event, supabase, user?.id ?? null);

    // Scoped to the requester's cart.
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", Number(itemId))
      .eq("cart_id", cartId);
    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Cart item delete error:", error?.message || error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete cart item",
    });
  }
});
