<script setup lang="ts">
import ProductCard from "@/components/custom/ecommerce/ProductCard.vue";

/* Single responsibility: related-products rail.
   Title + products arrive via props; renders nothing when empty. */

interface Props {
  title: string;
  products: Array<Record<string, any>>;
}

defineProps<Props>();
</script>

<template>
  <section v-if="products.length" class="mt-16">
    <h2 class="m3-headline-md">{{ title }}</h2>
    <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <ProductCard v-for="p in products" :key="p.id" :product="p" />
    </div>
  </section>
</template>
