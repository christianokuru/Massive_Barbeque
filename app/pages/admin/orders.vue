<script setup lang="ts">
import OrderTable from "@/components/custom/admin/OrderTable.vue";
definePageMeta({ layout: "admin", middleware: "admin" });
const { user, fetchSession } = useAuth();
if (process.client) {
  await fetchSession();
  if (!user.value) await navigateTo("/login");
}
const requestHeaders = useRequestHeaders(["cookie"]);
const { data: orders } = await useAsyncData("admin-orders", () =>
  $fetch<{ orders: any[] }>("/api/admin/orders", { headers: requestHeaders }).then((r) => r.orders).catch(() => [])
);
</script>

<template>
  <div class="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
    <h1 class="text-3xl font-bold">Orders</h1>
    <OrderTable :orders="orders ?? []" />
  </div>
</template>
