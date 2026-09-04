<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
const { user, fetchSession } = useAuth();
if (process.client) {
  await fetchSession();
  if (!user.value) await navigateTo("/login");
}
const { data: products, refresh } = await useAsyncData("admin-products", () =>
  $fetch<{ products: any[] }>("/api/products?limit=100").then((r) => r.products)
);
async function removeProduct(id: number) {
  if (!confirm("Delete this product?")) return;
  await $fetch(`/api/admin/products/${id}`, { method: "DELETE" });
  await refresh();
}
</script>

<template>
  <div class="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">Products</h1>
      <NuxtLink to="/admin/products/new" class="rounded bg-black px-5 py-2 text-sm text-white">+ New product</NuxtLink>
    </div>
    <div class="space-y-2">
      <div v-for="p in (products ?? [])" :key="p.id" class="flex items-center justify-between rounded border p-4">
        <div><p class="font-medium">{{ p.name }}</p><p class="text-sm text-gray-500">{{ p.slug }} · {{ (p.variants ?? []).length }} variants</p></div>
        <div class="flex gap-3 text-sm">
          <NuxtLink :to="`/admin/products/${p.id}`" class="text-blue-600">Edit</NuxtLink>
          <button class="text-red-600" @click="removeProduct(p.id)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>
