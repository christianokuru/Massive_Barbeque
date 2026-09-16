import { getServiceSupabase, requireUser } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUser(event);
    const service = getServiceSupabase();

    // Owned orders (user_id = me)
    const { data: owned, error: ownedError } = await service
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (ownedError) throw ownedError;

    // Guest orders that used the same email before the account existed.
    // RLS hides user_id IS NULL from the user-scoped client, so we must use
    // the service role and filter in code (ilike is case-insensitive exact).
    let guest: any[] = [];
    const normalizedEmail = user.email?.trim().toLowerCase();
    if (normalizedEmail) {
      const { data: candidates, error: guestError } = await service
        .from("orders")
        .select("*, order_items(*)")
        .is("user_id", null)
        .ilike("customer_email", normalizedEmail)
        .order("created_at", { ascending: false });
      if (guestError) throw guestError;
      guest = (candidates || []).filter(
        (r: any) => r.customer_email?.trim().toLowerCase() === normalizedEmail,
      );
    }

    const all = [...(owned || []), ...guest].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return { orders: all.map(toOrder) };
  } catch (error: any) {
    console.error("Orders fetch error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch orders",
    });
  }
});
