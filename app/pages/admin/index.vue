<script setup lang="ts">
definePageMeta({ layout: "admin" });
const { user, fetchSession } = useAuth();
await fetchSession();
if (!user.value) await navigateTo("/login");

const { data: orders } = await useAsyncData("admin-orders-overview", () =>
  $fetch<{ orders: any[] }>("/api/admin/orders").then((r) => r.orders).catch(() => [])
);
const revenue = computed(() => (orders.value ?? []).filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + Number(o.total), 0));
const pendingCount = computed(() => (orders.value ?? []).filter((o) => o.status === "pending").length);
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold">Admin overview</h1>
    <div class="mt-6 grid gap-4 md:grid-cols-3">
      <div class="rounded border p-5"><p class="text-sm text-gray-500">Revenue (paid)</p><p class="text-2xl font-bold">₦{{ revenue.toLocaleString() }}</p></div>
      <div class="rounded border p-5"><p class="text-sm text-gray-500">Total orders</p><p class="text-2xl font-bold">{{ (orders ?? []).length }}</p></div>
      <div class="rounded border p-5"><p class="text-sm text-gray-500">Pending</p><p class="text-2xl font-bold">{{ pendingCount }}</p></div>
    </div>
    <div class="mt-6 flex gap-3">
      <NuxtLink to="/admin/products" class="rounded bg-black px-5 py-2 text-sm text-white">Manage products</NuxtLink>
      <NuxtLink to="/admin/orders" class="rounded border px-5 py-2 text-sm">Manage orders</NuxtLink>
    </div>
  </div>
</template>
