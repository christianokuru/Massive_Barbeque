<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import AdminProductCard from "@/components/custom/admin/products/AdminProductCard.vue";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

definePageMeta({ layout: "admin", middleware: "admin" });

// Session comes from the admin middleware (single-flight) — no fetch here.

const { products, pending, fetchProducts, openCreate } = useAdminProducts();
const requestHeaders = useRequestHeaders(["cookie"]);

await useAsyncData("admin-products", async () => {
  if (process.server) {
    // SSR has no browser session; forward the request cookies instead.
    const data = await $fetch<{ products: any[] }>("/api/admin/products", {
      headers: requestHeaders,
    }).catch(() => ({ products: [] }));
    products.value = data.products ?? [];
  } else {
    await fetchProducts();
  }
  return true;
});
</script>

<template>
  <div class="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Products</h1>
        <p class="text-sm text-muted-foreground">{{ products.length }} item(s) on the menu</p>
      </div>
      <Button @click="openCreate">
        <Plus /> Add product
      </Button>
    </div>

    <div v-if="pending && products.length === 0" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Skeleton v-for="n in 4" :key="n" class="aspect-[4/5] w-full rounded-xl" />
    </div>
    <div v-else-if="products.length > 0" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AdminProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
      />
    </div>
    <div v-else class="rounded-lg border border-dashed p-12 text-center">
      <p class="font-medium">No products yet</p>
      <p class="mt-1 text-sm text-muted-foreground">Add your first item to start building the menu.</p>
      <Button class="mt-4" @click="openCreate">
        <Plus /> Add product
      </Button>
    </div>
  </div>
</template>
