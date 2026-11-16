// Pure cart mutations — no framework, no I/O, fully unit-tested
// (`tests/cartStore.test.ts`). The store (`useCart.ts`) is a thin
// reactive wrapper: apply + persist. Reuse verbatim elsewhere.

import type { AddLineInput, CartRow } from "./types";

const MAX_QTY = 99;

function cleanQty(quantity: number | undefined, fallback: number): number {
  const qty = Math.floor(quantity ?? fallback);
  if (!Number.isFinite(qty)) return fallback;
  return Math.min(MAX_QTY, qty);
}

/** Add a line, or bump quantity when the variant is already present.
    Rows are unique by variant id. */
export function applyAdd(rows: CartRow[], input: AddLineInput): CartRow[] {
  const quantity = Math.max(1, cleanQty(input.quantity, 1));
  const existing = rows.find((r) => r.variantId === input.variantId);
  if (existing) {
    return rows.map((r) =>
      r.variantId === input.variantId
        ? { ...r, quantity: Math.min(MAX_QTY, r.quantity + quantity) }
        : r,
    );
  }
  const s = input.snapshot;
  return [
    ...rows,
    {
      id: input.variantId,
      variantId: input.variantId,
      quantity,
      name: s?.productName ?? "",
      variantName: s?.variantName ?? "",
      sku: s?.sku ?? "",
      price: s?.price ?? 0,
      imageUrl: s?.imageUrl ?? null,
      productId: s?.productId,
    },
  ];
}

/** Set a line's quantity. Quantities below 1 remove the line, so the
    UI never has to branch — minus-to-zero just deletes. */
export function applySetQty(rows: CartRow[], id: number, quantity: number): CartRow[] {
  if (cleanQty(quantity, 0) < 1) return applyRemove(rows, id);
  return rows.map((r) =>
    r.id === id ? { ...r, quantity: Math.min(MAX_QTY, Math.floor(quantity)) } : r,
  );
}

export function applyRemove(rows: CartRow[], id: number): CartRow[] {
  return rows.filter((r) => r.id !== id);
}

/** Live catalog values for one variant (from POST /api/cart/quote). */
export interface QuoteLine {
  variantId: number;
  available: boolean;
  price?: number;
  productId?: number;
  productName?: string;
  variantName?: string;
  sku?: string;
  imageUrl?: string | null;
}

/** Bring rows up to date with the live catalog: refresh names, prices
    and photos; drop sizes the shop removed. Rows the quote doesn't
    mention are left alone. Reports what changed so the UI can say so. */
export function applyQuote(
  rows: CartRow[],
  lines: QuoteLine[],
): { rows: CartRow[]; removed: CartRow[]; priceChanged: boolean } {
  const byId = new Map(lines.map((l) => [l.variantId, l]));
  const removed: CartRow[] = [];
  let priceChanged = false;
  const next: CartRow[] = [];
  for (const r of rows) {
    const q = byId.get(r.variantId);
    if (!q) {
      next.push(r);
      continue;
    }
    if (!q.available) {
      removed.push(r);
      continue;
    }
    if (q.price !== undefined && Number(q.price) !== Number(r.price)) priceChanged = true;
    next.push({
      ...r,
      price: q.price ?? r.price,
      name: q.productName ?? r.name,
      variantName: q.variantName ?? r.variantName,
      sku: q.sku ?? r.sku,
      imageUrl: q.imageUrl === undefined ? r.imageUrl : q.imageUrl,
      productId: q.productId ?? r.productId,
    });
  }
  return { rows: next, removed, priceChanged };
}
