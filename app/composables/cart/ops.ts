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
