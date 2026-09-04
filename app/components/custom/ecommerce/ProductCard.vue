<script setup lang="ts">
const props = defineProps({
  product: { type: Object, required: true },
});

const lowestPrice = computed(() => {
  const variants = props.product.variants ?? [];
  if (!variants.length) return null;
  return Math.min(...variants.map((v: any) => Number(v.price)));
});

const formatNaira = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
</script>

<template>
  <NuxtLink
    :to="`/product/${product.id}`"
    class="group block overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
  >
    <div class="aspect-[4/3] w-full overflow-hidden bg-gray-100">
      <img
        v-if="product.imageUrl"
        :src="product.imageUrl"
        :alt="product.name"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
      />
      <div v-else class="flex h-full w-full items-center justify-center text-4xl">🔥</div>
    </div>
    <div class="space-y-1 p-4">
      <p v-if="product.category?.name" class="text-xs uppercase tracking-wider text-gray-500">
        {{ product.category.name }}
      </p>
      <h3 class="font-semibold text-gray-900">{{ product.name }}</h3>
      <p v-if="lowestPrice !== null" class="text-sm font-medium text-[#FF6B35]">
        From {{ formatNaira(lowestPrice) }}
      </p>
      <p v-else class="text-sm text-gray-500">Price on request</p>
    </div>
  </NuxtLink>
</template>
