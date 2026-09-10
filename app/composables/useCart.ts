// Local-first cart store. Everything is synchronous and instant —
// add / setQty / remove apply to memory + localStorage with zero
// network. The server sees the cart exactly once: at checkout, where
// the client submits ids + quantities and the server prices from the
// database (never trust client money).
//
// HOST SEAM: `~~/shared/utils/pricing` is the only host import —
// repoint it (or inline `Number()` sums) when reusing elsewhere.

import { applyAdd, applyRemove, applySetQty } from "./cart/ops";
import { createLocalCartStorage } from "./cart/storage";
import type { AddLineInput, CartRow, CartStorage } from "./cart/types";
// HOST: money helpers from the host project.
import { cartSubtotal } from "~~/shared/utils/pricing";

let storage: CartStorage | null = null;
let hydrated = false;

export function useCart() {
  const items = useState<CartRow[]>("cart:items", () => []);

  if (!storage) storage = createLocalCartStorage();
  if (!hydrated) {
    hydrated = true;
    const cached = storage.load();
    if (cached) items.value = cached;
  }

  const count = computed(() =>
    items.value.reduce((n, i) => n + Math.max(0, Math.floor(i.quantity)), 0),
  );
  const subtotal = computed(() =>
    cartSubtotal(items.value.map((i) => ({ price: i.price, quantity: i.quantity }))),
  );

  function persist(): void {
    storage!.save(items.value);
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

  return { items, count, subtotal, addItem, updateItem, removeItem, clear };
}
