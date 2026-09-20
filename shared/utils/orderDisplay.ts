// Display helpers shared by the admin order console and the customer
// order pages. `delivery_address` is stored raw (snake_case JSONB) —
// every reader must go through here, never inline its own parsing.

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
