<script setup lang="ts">
import ProductCard from "@/components/custom/ecommerce/ProductCard.vue";

/* Single responsibility: "fresh off the grill" product rail.
   Copy + data arrive via props — this component owns layout only. */

interface Props {
  eyebrow: string;
  title: string;
  browseLabel: string;
  browseTo: string;
  emptyLead: string;
  emptyCtaLabel: string;
  emptyCtaTo: string;
  products: Array<Record<string, any>>;
}

defineProps<Props>();
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
    <div class="mb-10 flex items-end justify-between gap-4">
      <div>
        <p class="text-xs font-medium uppercase tracking-[0.4em] text-primary">{{ eyebrow }}</p>
        <h2 class="m3-headline-lg mt-3 sm:m3-display-sm md:m3-display-md">{{ title }}</h2>
      </div>
      <NuxtLink :to="browseTo" class="shrink-0 text-xs font-medium text-muted-foreground hover:underline">
        {{ browseLabel }}
      </NuxtLink>
    </div>
    <div v-if="products.length" class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <ProductCard v-for="p in products.slice(0, 4)" :key="p.id" :product="p" showcase />
    </div>
    <div v-else class="m3-body-md rounded-lg border border-dashed p-10 text-center text-muted-foreground">
      {{ emptyLead }} <NuxtLink :to="emptyCtaTo" class="text-primary hover:underline">{{ emptyCtaLabel }}</NuxtLink>.
    </div>
  </section>
</template>
