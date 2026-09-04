<script setup lang="ts">
import ProductCard from "@/components/custom/ecommerce/ProductCard.vue";

useSeoMeta({
  title: "Menu | Massive Barbeque",
  description: "Order BBQ catfish, chicken, turkey, croaker and sides in Lagos. Delivery and pickup available.",
});

const search = ref("");
const categoryId = ref<number | undefined>(undefined);
const { data, pending, refresh } = await useAsyncData("products", () =>
  $fetch<{ products: any[] }>("/api/products", {
    params: { search: search.value || undefined, categoryId: categoryId.value, limit: 60 },
  }).then((r) => r.products)
);
const { data: categories } = await useAsyncData("categories", () =>
  $fetch<{ categories: any[] }>("/api/categories").then((r) => r.categories ?? [])
);

let debounce: any;
watch([search, categoryId], () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => refresh(), 300);
});
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-24 md:px-6">
    <h1 class="text-4xl font-bold md:text-5xl">Our Menu</h1>
    <p class="mt-2 text-gray-600">Fresh off the grill — catfish, chicken, turkey, croaker & sides.</p>

    <div class="mt-6 flex flex-col gap-3 md:flex-row">
      <input
        v-model="search"
        type="search"
        placeholder="Search BBQ…"
        class="w-full rounded border border-gray-300 px-4 py-2 md:max-w-sm"
      />
      <select v-model="categoryId" class="rounded border border-gray-300 px-4 py-2">
        <option :value="undefined">All categories</option>
        <option v-for="c in (categories ?? [])" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <p v-if="pending" class="mt-8 text-gray-500">Loading menu…</p>
    <div v-else-if="(data ?? []).length" class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <ProductCard v-for="p in (data ?? [])" :key="p.id" :product="p" />
    </div>
    <p v-else class="mt-8 text-gray-500">No items found. Try another search.</p>
  </div>
</template>
