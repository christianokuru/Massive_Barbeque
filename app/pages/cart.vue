<script setup lang="ts">
import CartItem from "@/components/custom/ecommerce/CartItem.vue";

useSeoMeta({ title: "Cart | Massive Barbeque" });

const { items, subtotal, pending, refresh, updateItem, removeItem } = useCart();
await refresh();

const formatNaira = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-24 md:px-6">
    <h1 class="text-3xl font-bold md:text-4xl">Your Cart</h1>
    <p v-if="pending" class="mt-6 text-gray-500">Loading cart…</p>
    <div v-else-if="items.length" class="mt-6 space-y-4">
      <CartItem
        v-for="item in items"
        :key="item.id"
        :item="item"
        @update="(q: number) => updateItem(item.id, q)"
        @remove="removeItem(item.id)"
      />
      <div class="flex items-center justify-between rounded-lg bg-gray-50 p-4">
        <span class="font-medium">Subtotal</span>
        <span class="text-lg font-bold">{{ formatNaira(subtotal) }}</span>
      </div>
      <NuxtLink to="/checkout" class="block rounded bg-[#FF6B35] px-6 py-3 text-center font-medium text-white">
        Proceed to checkout
      </NuxtLink>
      <NuxtLink to="/menu" class="block text-center text-sm text-gray-500 hover:underline">Continue shopping</NuxtLink>
    </div>
    <div v-else class="mt-6 rounded-lg border border-dashed p-10 text-center text-gray-500">
      Your cart is empty. <NuxtLink to="/menu" class="text-[#FF6B35] hover:underline">Browse the menu</NuxtLink>
    </div>
  </div>
</template>
