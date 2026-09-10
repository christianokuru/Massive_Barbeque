<script setup lang="ts">
import ProductCard from "@/components/custom/ecommerce/ProductCard.vue";
import M3Icon from "@/components/M3Icon.vue";
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

const products = computed(() => data.value ?? []);
const hasFilter = computed(() => search.value.trim() !== "" || categoryId.value !== undefined);

function clearFilters() {
  search.value = "";
  categoryId.value = undefined;
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-20 sm:py-24 md:px-6">
    <p class="text-xs font-medium uppercase tracking-[0.4em] text-primary">Our menu</p>
    <h1 class="m3-display-sm mt-3 md:m3-display-md">Fresh off the grill</h1>
    <p class="m3-body-md mt-2 text-muted-foreground">
      Catfish, chicken, turkey, croaker &amp; sides — grilled to order.
      <span v-if="!pending && products.length" class="whitespace-nowrap">
        {{ products.length }} item{{ products.length === 1 ? "" : "s" }} right now.
      </span>
    </p>

    <div class="mt-6 flex flex-col gap-3">
      <label class="relative block md:max-w-sm">
        <span class="sr-only">Search BBQ</span>
        <M3Icon
          name="search"
          :size="20"
          class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          v-model="search"
          type="search"
          placeholder="Search BBQ…"
          class="w-full rounded-full border border-border bg-card py-2.5 pr-4 pl-11 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Filter by category">
        <button
          type="button"
          :aria-pressed="categoryId === undefined"
          :class="[
            'shrink-0 rounded-full px-4 py-2 text-xs font-medium tracking-[0.1em] uppercase transition-colors',
            categoryId === undefined
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card hover:bg-secondary-container/60',
          ]"
          @click="categoryId = undefined"
        >
          All
        </button>
        <button
          v-for="c in (categories ?? [])"
          :key="c.id"
          type="button"
          :aria-pressed="categoryId === c.id"
          :class="[
            'shrink-0 rounded-full px-4 py-2 text-xs font-medium tracking-[0.1em] uppercase transition-colors',
            categoryId === c.id
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card hover:bg-secondary-container/60',
          ]"
          @click="categoryId = categoryId === c.id ? undefined : c.id"
        >
          {{ c.name }}
        </button>
      </div>
      <button
        v-if="hasFilter"
        type="button"
        class="self-start text-xs font-medium text-primary hover:underline"
        @click="clearFilters"
      >
        Clear filters
      </button>
    </div>

    <div v-if="pending" class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5" aria-label="Loading menu">
      <div v-for="n in 10" :key="n" class="overflow-hidden rounded-xl bg-muted">
        <Skeleton class="aspect-[4/5] w-full rounded-none" />
      </div>
    </div>
    <div v-else-if="products.length" class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      <ProductCard v-for="p in products" :key="p.id" :product="p" showcase />
    </div>
    <div v-else class="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <span class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
        <M3Icon name="search_off" :size="24" />
      </span>
      <p class="mt-4 font-medium">Nothing on the grill matches that</p>
      <p class="mt-1 text-sm text-muted-foreground">Try another search or category.</p>
      <button
        type="button"
        class="mt-5 rounded-full bg-primary px-6 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-primary-foreground transition-colors hover:bg-primary/90"
        @click="clearFilters"
      >
        Clear filters
      </button>
    </div>
  </div>
</template>
