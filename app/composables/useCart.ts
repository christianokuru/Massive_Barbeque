// Local-first cart store. add / setQty / remove apply to memory +
// localStorage instantly with zero network. The server prices the cart
// at checkout (ids + quantities only — client money is never trusted).
//
// Loading: the server can't see localStorage, so the cart is read AFTER
// the page has hydrated (plugins/cart.client.ts calls `hydrate`). Until
// then `ready` is false and pages that depend on the cart (checkout)
// show a placeholder instead of "your cart is empty".
//
// Freshness: rows keep the name/price from when they were added.
// `refresh()` asks POST /api/cart/quote for today's values and drops
// sizes the shop removed, so the buyer never pays a surprise total.

import { applyAdd, applyQuote, applyRemove, applySetQty, type QuoteLine } from "./cart/ops";
import { createLocalCartStorage } from "./cart/storage";
import type { AddLineInput, CartRow, CartStorage } from "./cart/types";
import { cartSubtotal } from "~~/shared/utils/pricing";

let storage: CartStorage | null = null;
let lastRefresh = 0;
let inflight: Promise<CartRefreshResult> | null = null;
const REFRESH_EVERY_MS = 30_000;

export interface CartRefreshResult {
  removed: CartRow[];
  priceChanged: boolean;
  ok: boolean;
}

export function useCart() {
  const items = useState<CartRow[]>("cart:items", () => []);
  const ready = useState<boolean>("cart:ready", () => false);

  if (!storage) storage = createLocalCartStorage();

  const count = computed(() =>
    items.value.reduce((n, i) => n + Math.max(0, Math.floor(i.quantity)), 0),
  );
  const subtotal = computed(() =>
    cartSubtotal(items.value.map((i) => ({ price: i.price, quantity: i.quantity }))),
  );

  function persist(): void {
    storage!.save(items.value);
  }

  /** Read the saved cart (client only; call after hydration). */
  function hydrate(): void {
    items.value = storage!.load() ?? [];
    ready.value = true;
  }

  function addItem(input: AddLineInput): void {
    items.value = applyAdd(items.value, input);
    persist();
  }

  function updateItem(id: number, quantity: number): void {
    items.value = applySetQty(items.value, id, quantity);
    persist();
  }

  function removeItem(id: number): void {
    items.value = applyRemove(items.value, id);
    persist();
  }

  function clear(): void {
    items.value = [];
    persist();
  }

  /** Sync names/prices with the live catalog. Cheap to call often:
      repeat calls within 30s reuse the last answer unless `force`. */
  async function refresh(force = false): Promise<CartRefreshResult> {
    const none = { removed: [], priceChanged: false, ok: true };
    if (!items.value.length) return none;
    if (inflight) return inflight;
    if (!force && Date.now() - lastRefresh < REFRESH_EVERY_MS) return none;
    inflight = (async () => {
      try {
        const { lines } = await $fetch<{ lines: QuoteLine[] }>("/api/cart/quote", {
          method: "POST",
          body: { variantIds: items.value.map((i) => i.variantId) },
        });
        const result = applyQuote(items.value, lines);
        items.value = result.rows;
        persist();
        lastRefresh = Date.now();
        return { removed: result.removed, priceChanged: result.priceChanged, ok: true };
      } catch {
        // Offline / server hiccup: keep the saved cart; checkout reprices anyway.
        return { removed: [], priceChanged: false, ok: false };
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  }

  return { items, ready, count, subtotal, hydrate, addItem, updateItem, removeItem, clear, refresh };
}
