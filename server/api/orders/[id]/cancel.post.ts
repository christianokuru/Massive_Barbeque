import { apiError, defineApi, enforceRateLimit, parseBody, routeUuid } from "~~/server/utils/api";
import { db, must } from "~~/server/utils/db";
import { z } from "zod";
import { toOrder } from "~~/server/utils/mappers";
import { canUserCancelOrder } from "~~/shared/utils/orderStatus";
import { assertOrderAccess } from "~~/server/utils/orderAccess";

// POST /api/orders/:id/cancel — buyer self-cancel.
// Pending + unpaid only (same rule the UI previews with canUserCancelOrder):
// paid or confirmed orders go through staff, since the kitchen may already
// be cooking and paid money needs a refund.
const bodySchema = z.object({
  guestToken: z.string().max(4096).optional(),
});

export default defineApi(async (event) => {
  const id = routeUuid(event, "id", "Order not found.");
  enforceRateLimit(event, "order-cancel", { limit: 10, windowSecs: 3600, key: id });
  const body = await parseBody(event, bodySchema);

  const { order } = await assertOrderAccess(event, id, body.guestToken);
  const check = canUserCancelOrder(order.status, order.payment_status);
  if (!check.ok) apiError(400, check.reason);

  // Conditional update: only flips a row that is STILL pending + unpaid,
  // so a payment landing at the same moment can't be cancelled under it.
  const updated = must(
    await db()
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending")
      .neq("payment_status", "paid")
      .select("id"),
  );
  if (!updated?.length) {
    apiError(409, "This order just changed. Refresh to see its latest status.");
  }

  const full = must(
    await db().from("orders").select("*, order_items(*)").eq("id", id).single(),
  );
  return { success: true, order: toOrder(full) };
});
