import { z } from "zod";
import { apiError, defineApi, enforceRateLimit, parseBody, routeUuid } from "~~/server/utils/api";
import { db, must, mustFind } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  canAdminSetPaymentStatus,
  canTransitionOrder,
} from "~~/shared/utils/orderStatus";
import { auditAdminAction } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";

// PUT /api/admin/orders/:id/status — move an order through the kitchen
// pipeline (and, for unpaid orders only, relabel pending ↔ failed).
//
// Rules (shared/utils/orderStatus.ts, also used by the UI):
//   - forward-only pipeline, cancel allowed until completed, no resurrection
//   - `paid` comes only from verified webhooks, `refunded` only from the
//     refund endpoint; a paid/refunded order's payment status is locked
//   - audited BEFORE the write (fail-closed: no trail, no change)
//   - the write is conditional on the state we validated against, so two
//     staff clicking at once can't skip a step
const bodySchema = z.object({
  status: z.enum(ORDER_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
});

export default defineApi(async (event) => {
  const { user } = await requireAdmin(event);
  enforceRateLimit(event, "admin-order-status", { limit: 300, windowSecs: 3600 });
  const id = routeUuid(event, "id", "Order not found.");
  const body = await parseBody(event, bodySchema);

  const current = mustFind(
    await db().from("orders").select("status, payment_status").eq("id", id).maybeSingle(),
    "Order not found.",
  ) as { status: any; payment_status: string };

  if (!canTransitionOrder(current.status, body.status)) {
    apiError(400, `Cannot move order from ${current.status} to ${body.status}.`);
  }
  const paymentChanging = !!body.paymentStatus && body.paymentStatus !== current.payment_status;
  if (paymentChanging) {
    const check = canAdminSetPaymentStatus(current.payment_status, body.paymentStatus);
    if (!check.ok) apiError(400, check.reason);
  }
  const statusChanging = body.status !== current.status;
  if (!statusChanging && !paymentChanging) {
    const full = must(await db().from("orders").select("*, order_items(*), payments(*)").eq("id", id).single());
    return { success: true, order: toOrder(full) };
  }

  const auditTarget = [
    id,
    statusChanging ? `status:${current.status}->${body.status}` : "",
    paymentChanging ? `payment:${current.payment_status}->${body.paymentStatus}` : "",
  ].filter(Boolean).join(" ");
  await auditAdminAction(user.email || null, "status_change", auditTarget, getClientIp(event));

  const update: Record<string, string> = { status: body.status, updated_at: new Date().toISOString() };
  if (paymentChanging) update.payment_status = body.paymentStatus!;

  const changed = must(
    await db()
      .from("orders")
      .update(update)
      .eq("id", id)
      .eq("status", current.status)
      .eq("payment_status", current.payment_status)
      .select("id"),
  );
  if (!changed?.length) {
    apiError(409, "This order was just updated by someone else. Refresh and try again.");
  }

  const full = must(await db().from("orders").select("*, order_items(*), payments(*)").eq("id", id).single());
  return { success: true, order: toOrder(full) };
});
