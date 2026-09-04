import { z } from "zod";
import { getSupabase, getAuthUser } from "~~/server/utils/supabase";
import { resolveCartId } from "~~/server/utils/cart";

const cartItemUpdateSchema = z.object({
  quantity: z.number().int().min(1),
});

export default defineEventHandler(async (event) => {
  try {
    const itemId = getRouterParam(event, "id");

    if (!itemId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Item ID is required",
      });
    }

    const body = await readValidatedBody(event, cartItemUpdateSchema.parse);

    const { supabase, user } = await getAuthUser(event);
    const cartId = await resolveCartId(event, supabase, user?.id ?? null);

    // Scoped to the requester's cart — one guest can't edit another's items.
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: body.quantity })
      .eq("id", Number(itemId))
      .eq("cart_id", cartId);
    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Cart item update error:", error?.message || error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid form data",
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update cart item",
    });
  }
});
