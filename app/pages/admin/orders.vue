<script setup lang="ts">
import OrderTable from "@/components/custom/admin/OrderTable.vue";
definePageMeta({ layout: "admin" });
const { user, fetchSession } = useAuth();
await fetchSession();
if (!user.value) await navigateTo("/login");
const { data: orders } = await useAsyncData("admin-orders", () =>
  $fetch<{ orders: any[] }>("/api/admin/orders").then((r) => r.orders).catch(() => [])
);
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold">Orders</h1>
    <OrderTable :orders="orders ?? []" class="mt-6" />
  </div>
</template>
