<script setup lang="ts">
import ProductCard from "@/components/custom/ecommerce/ProductCard.vue";
import { Skeleton } from "@/components/ui/skeleton";

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
  <div class="mx-auto max-w-7xl px-4 py-20 sm:py-24 md:px-6">
    <h1 class="text-3xl font-bold sm:text-4xl md:text-5xl">Our Menu</h1>
    <p class="mt-2 text-sm text-muted-foreground sm:text-base">Fresh off the grill — catfish, chicken, turkey, croaker & sides.</p>

    <div class="mt-6 flex flex-col gap-3 md:flex-row">
      <input
        v-model="search"
        type="search"
        placeholder="Search BBQ…"
        class="w-full rounded border border-border bg-background px-4 py-2 md:max-w-sm"
      />
      <select v-model="categoryId" class="rounded border border-border bg-background px-4 py-2">
        <option :value="undefined">All categories</option>
        <option v-for="c in (categories ?? [])" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <div v-if="pending" class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading menu">
      <div v-for="n in 6" :key="n" class="overflow-hidden rounded-xl border border-border bg-card">
        <Skeleton class="aspect-[4/3] w-full rounded-none" />
        <div class="space-y-2 p-4">
          <Skeleton class="h-5 w-2/3" />
          <Skeleton class="h-4 w-1/3" />
        </div>
      </div>
    </div>
    <div v-else-if="(data ?? []).length" class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <ProductCard v-for="p in (data ?? [])" :key="p.id" :product="p" />
    </div>
    <p v-else class="mt-8 text-muted-foreground">No items found. Try another search.</p>
  </div>
</template>
