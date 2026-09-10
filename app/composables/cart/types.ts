// Local-first cart contract — pure TypeScript, zero framework imports.
//
// The cart lives entirely in the browser (see `useCart.ts` + `storage.ts`).
// The server re-enters only at checkout, where the client submits
// variant ids + quantities and the server prices from the database.
//
// To reuse in another project: keep `types.ts` / `storage.ts` / `ops.ts`;
// point the HOST-marked import in `useCart.ts` at the new money helpers.

/** Display data for a row, supplied by the caller (product card / page)
    so rows render fully without any fetch. */
export interface CartLineSnapshot {
  variantId: number;
  productName: string;
  variantName: string;
  sku: string;
  /** Unit price for display; never trusted for money (server reprices). */
  price: string | number;
  imageUrl?: string | null;
}

/** One cart line. `id` is the variant id — rows are unique by variant. */
export interface CartRow {
  id: number;
  variantId: number;
  quantity: number;
  name: string;
  variantName: string;
  sku: string;
  price: string | number;
  imageUrl?: string | null;
}

export interface AddLineInput {
  variantId: number;
  quantity?: number;
  snapshot?: CartLineSnapshot;
}

/** The checkout payload: ids + quantities only. The server looks up
    everything else and sets the price — the client never sends money. */
export interface CheckoutLineInput {
  variantId: number;
  quantity: number;
}

/** Persistence seam — default is localStorage (`storage.ts`). */
export interface CartStorage {
  load(): CartRow[] | null;
  save(rows: CartRow[]): void;
  clear(): void;
}
