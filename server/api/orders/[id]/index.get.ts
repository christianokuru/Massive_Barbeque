import { defineApi, enforceRateLimit, parseQuery, routeUuid } from "~~/server/utils/api";
import { z } from "zod";
import { toOrder } from "~~/server/utils/mappers";
import { assertOrderAccess } from "~~/server/utils/orderAccess";

// GET /api/orders/:id[?token=<guest pass>]
// Owner, admin, or guest with the signed pass (see orderAccess). PII-bearing,
// so throttled per client to blunt id probing. Denied → 404.
const querySchema = z.object({ token: z.string().max(4096).optional() });

export default defineApi(async (event) => {
  enforceRateLimit(event, "order-read", { limit: 120, windowSecs: 3600 });
  const id = routeUuid(event, "id", "Order not found.");
  const { token } = parseQuery(event, querySchema);

  const { order, viewer } = await assertOrderAccess(
    event,
    id,
    token,
    "*, order_items(*), payments(*)",
  );

  const mapped = toOrder(order);
  // Payment rows carry provider references and refund state — staff
  // tooling only. Buyers see their payment status on the order itself.
  if (viewer !== "admin") mapped.payments = [];
  return { order: mapped };
});
