<script setup lang="ts">
import ProductCard from "@/components/custom/ecommerce/ProductCard.vue";

useSeoMeta({
  title: "Massive Barbeque — Premium BBQ in Lagos",
  description:
    "Order premium BBQ in Lagos: barbeque catfish, chicken, turkey, croaker and sides. Delivery and pickup available.",
  ogTitle: "Massive Barbeque — Premium BBQ in Lagos",
  ogDescription:
    "Order premium BBQ in Lagos: barbeque catfish, chicken, turkey, croaker and sides.",
  ogImage: "/og-image.png",
  twitterCard: "summary_large_image",
});

useSchemaOrg([
  {
    "@type": "WebPage",
    "@id": "https://massivebarbeque.com/#webpage",
    name: "Massive Barbeque — Premium BBQ in Lagos",
    url: "https://massivebarbeque.com",
    isPartOf: { "@id": "https://massivebarbeque.com/#website" },
    about: { "@id": "https://massivebarbeque.com/#restaurant" },
  },
]);

const { data: featured } = await useAsyncData("featured-products", () =>
  $fetch<{ products: any[] }>("/api/products", { params: { featured: "true", limit: 6 } })
    .then((r) => r.products)
    .catch(() => [])
);
</script>

<template>
  <div class="size-full">
    <!-- Hero -->
    <section class="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-black text-white">
      <div class="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <p class="mb-4 text-xs uppercase tracking-[0.4em] text-[#FF6B35]">Lagos · Nigeria</p>
        <h1 class="text-5xl font-bold leading-tight md:text-7xl">
          Fire-grilled BBQ,<br /><span class="text-[#FF6B35]">delivered hot.</span>
        </h1>
        <p class="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
          Barbeque catfish, chicken, turkey, croaker and sides — grilled to order.
          Delivery across Lagos or quick pickup.
        </p>
        <div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <NuxtLink to="/menu" class="rounded bg-[#FF6B35] px-10 py-4 text-sm font-medium uppercase tracking-widest text-white hover:opacity-90">
            Order now
          </NuxtLink>
          <NuxtLink to="/menu" class="text-sm uppercase tracking-widest text-gray-300 hover:text-white">
            View menu →
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Featured -->
    <section class="mx-auto max-w-7xl px-6 py-20">
      <div class="mb-10 flex items-end justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.4em] text-[#FF6B35]">Customer favourites</p>
          <h2 class="mt-2 text-4xl font-bold md:text-5xl">Fresh off the grill</h2>
        </div>
        <NuxtLink to="/menu" class="text-sm font-medium text-gray-600 hover:underline">See full menu →</NuxtLink>
      </div>
      <div v-if="(featured ?? []).length" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ProductCard v-for="p in (featured ?? [])" :key="p.id" :product="p" />
      </div>
      <div v-else class="rounded-lg border border-dashed p-10 text-center text-gray-500">
        Our menu is firing up — <NuxtLink to="/menu" class="text-[#FF6B35] hover:underline">browse all items</NuxtLink>.
      </div>
    </section>

    <!-- How it works -->
    <section class="bg-gray-50 px-6 py-20">
      <div class="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
        <div class="rounded-lg bg-white p-8 shadow-sm">
          <p class="text-3xl">🔥</p>
          <h3 class="mt-3 text-xl font-semibold">Pick your BBQ</h3>
          <p class="mt-2 text-gray-600">Catfish, chicken, turkey, croaker — choose a size and sides.</p>
        </div>
        <div class="rounded-lg bg-white p-8 shadow-sm">
          <p class="text-3xl">💳</p>
          <h3 class="mt-3 text-xl font-semibold">Pay securely</h3>
          <p class="mt-2 text-gray-600">Paystack or Flutterwave. Cards, transfers, and more.</p>
        </div>
        <div class="rounded-lg bg-white p-8 shadow-sm">
          <p class="text-3xl">🛵</p>
          <h3 class="mt-3 text-xl font-semibold">Delivery or pickup</h3>
          <p class="mt-2 text-gray-600">Hot delivery across Lagos, or grab it fresh at pickup.</p>
        </div>
      </div>
    </section>
  </div>
</template>
