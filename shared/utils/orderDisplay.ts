// Display + dashboard helpers shared by the admin console and customer
// pages. `delivery_address` is stored raw (snake_case JSONB) — every
// reader goes through deliveryAddressLines, never inline parsing.
import { pctChange } from "./pricing";

/** Rendered address lines for a raw `delivery_address` JSONB value. */
export function deliveryAddressLines(address: unknown): string[] {
  if (!address || typeof address !== "object") return [];
  const a = address as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return [
    [str(a.first_name), str(a.last_name)].filter(Boolean).join(" "),
    str(a.address_line_1),
    str(a.address_line_2),
    [str(a.city), str(a.state)].filter(Boolean).join(", "),
    str(a.phone),
  ].filter(Boolean);
}

/** Short en-NG date-time for ops screens, e.g. "16 Sept, 1:08 AM". */
export function formatOrderDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export interface OrderSearchRow {
  orderNumber?: string | null
  customerName?: string | null
  customerEmail?: string | null
}

/** Case-insensitive match across order number, customer name and email. */
export function filterOrderRows<T extends OrderSearchRow>(rows: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) =>
    [r.orderNumber, r.customerName, r.customerEmail].some((v) =>
      (v ?? "").toLowerCase().includes(q),
    ),
  );
}

export interface AttentionRow {
  status?: string | null
}

/**
 * Orders needing kitchen action right now (pending + in-progress),
 * newest first assumption left to the caller — capped so the dashboard
 * home stays a glanceable queue, never an archive.
 */
export function needsAttentionRows<T extends AttentionRow>(
  rows: T[],
  statuses: readonly string[],
  limit = 20,
): T[] {
  return rows.filter((r) => statuses.includes(r.status ?? "")).slice(0, limit);
}

/** Flat row shape consumed by the admin DataTable (single definition). */
export interface OrderRow {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  itemCount: number
  total: number
  status: string
  paymentStatus: string
  createdAt: string
}

export interface RowSource {
  id: unknown
  orderNumber?: unknown
  customerName?: unknown
  customerEmail?: unknown
  items?: unknown
  total?: unknown
  status?: unknown
  paymentStatus?: unknown
  createdAt?: unknown
}

/** Map a toOrder-shaped order to a table row (null-safe throughout). */
export function toOrderRow(o: RowSource): OrderRow {
  const items = Array.isArray(o.items) ? (o.items as Array<{ quantity?: unknown }>) : [];
  return {
    id: String(o.id ?? ""),
    orderNumber:
      typeof o.orderNumber === "string" && o.orderNumber
        ? o.orderNumber
        : `#${String(o.id ?? "").slice(0, 8).toUpperCase()}`,
    customerName: typeof o.customerName === "string" && o.customerName ? o.customerName : "Guest",
    customerEmail: typeof o.customerEmail === "string" ? o.customerEmail : "",
    itemCount: items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0),
    total: Number(o.total || 0),
    status: typeof o.status === "string" && o.status ? o.status : "pending",
    paymentStatus:
      typeof o.paymentStatus === "string" && o.paymentStatus ? o.paymentStatus : "pending",
    createdAt: typeof o.createdAt === "string" ? o.createdAt : "",
  };
}

export interface PaidSumSource {
  paymentStatus?: unknown
  total?: unknown
  createdAt?: unknown
}

/** Week-over-week paid-revenue delta; null hides the badge (no baseline). */
export function revenueDeltaFor(orders: PaidSumSource[], now = Date.now()): number | null {
  const week = 7 * 24 * 60 * 60 * 1000;
  const paidSum = (from: number, to: number) =>
    orders
      .filter((o) => {
        if (o.paymentStatus !== "paid") return false;
        const t = new Date(o.createdAt as string).getTime();
        return Number.isFinite(t) && t >= from && t < to;
      })
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
  return pctChange(paidSum(now - week, now), paidSum(now - 2 * week, now - week));
}

/** Paid revenue grouped by UTC day, oldest first (chart input). */
export function buildRevenueSeries(
  orders: PaidSumSource[],
): Array<{ date: string; revenue: number }> {
  const byDay = new Map<string, number>();
  for (const o of orders) {
    if (o.paymentStatus !== "paid") continue;
    const t = new Date(o.createdAt as string);
    if (Number.isNaN(t.getTime())) continue;
    const day = t.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + Number(o.total || 0));
  }
  return [...byDay.entries()]
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
