const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve the requester's cart: cookie cart_id (must be a UUID) for
 * guests, or the user's own cart when logged in. Creates the row if
 * missing. Returns the cart id.
 */
export async function resolveCartId(
  event: any,
  supabase: any,
  userId: string | null
): Promise<string> {
  let cartId = getCookie(event, "cart_id");
  if (cartId && !UUID_RE.test(cartId)) cartId = undefined;

  if (userId) {
    const { data: userCart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (userCart) {
      cartId = userCart.id;
    } else {
      if (!cartId) cartId = crypto.randomUUID();
      const { error } = await supabase
        .from("carts")
        .insert({ id: cartId, user_id: userId });
      if (error && error.code !== "23505") throw error;
    }
  } else {
    if (!cartId) cartId = crypto.randomUUID();
    const { data: existing } = await supabase
      .from("carts")
      .select("id")
      .eq("id", cartId)
      .maybeSingle();
    if (!existing) {
      const { error } = await supabase
        .from("carts")
        .insert({ id: cartId, user_id: null });
      if (error && error.code !== "23505") throw error;
    }
  }

  setCookie(event, "cart_id", cartId as string, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return cartId as string;
}
