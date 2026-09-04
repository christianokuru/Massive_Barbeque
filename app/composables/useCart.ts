export interface CartItemRow {
  id: number;
  quantity: number;
  variant: { id: number; name: string; price: string; sku: string; product: { id: number; name: string; imageUrl?: string | null } };
}

export function useCart() {
  const items = useState<CartItemRow[]>("cart:items", () => []);
  const pending = useState<boolean>("cart:pending", () => false);

  const count = computed(() => items.value.reduce((n, i) => n + i.quantity, 0));
  const subtotal = computed(() =>
    items.value.reduce((sum, i) => sum + Number(i.variant?.price ?? 0) * i.quantity, 0)
  );

  async function refresh() {
    pending.value = true;
    try {
      const data = await $fetch<{ cart: { items: CartItemRow[] } }>("/api/cart");
      items.value = data.cart?.items ?? [];
    } catch {
      items.value = [];
    } finally {
      pending.value = false;
    }
  }

  async function addItem(productVariantId: number, quantity = 1) {
    await $fetch("/api/cart/items", { method: "POST", body: { productVariantId, quantity } });
    await refresh();
  }

  async function updateItem(id: number, quantity: number) {
    await $fetch(`/api/cart/items/${id}`, { method: "PUT", body: { quantity } });
    await refresh();
  }

  async function removeItem(id: number) {
    await $fetch(`/api/cart/items/${id}`, { method: "DELETE" });
    await refresh();
  }

  return { items, pending, count, subtotal, refresh, addItem, updateItem, removeItem };
}
