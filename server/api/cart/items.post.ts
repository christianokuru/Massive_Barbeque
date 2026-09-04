import { z } from "zod";
import { getSupabase, getAuthUser } from "~~/server/utils/supabase";
import { resolveCartId } from "~~/server/utils/cart";

const cartItemSchema = z.object({
  productVariantId: z.number(),
  quantity: z.number().int().min(1).default(1),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, cartItemSchema.parse);

    const { supabase, user } = await getAuthUser(event);
    const cartId = await resolveCartId(event, supabase, user?.id ?? null);

    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("variant_id", body.productVariantId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + body.quantity })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("cart_items").insert({
        cart_id: cartId,
        variant_id: body.productVariantId,
        quantity: body.quantity,
      });
      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Cart item add error:", error?.message || error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid form data",
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to add item to cart",
    });
  }
});
