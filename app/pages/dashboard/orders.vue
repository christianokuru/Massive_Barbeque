<script setup lang="ts">
import OrderStatus from "@/components/custom/ecommerce/OrderStatus.vue";
definePageMeta({ layout: "dashboard", middleware: "auth" });
const { user, fetchSession } = useAuth();
await fetchSession();
if (!user.value) await navigateTo("/login");
const { data: orders } = await useAsyncData("all-orders", () =>
  $fetch<{ orders: any[] }>("/api/orders").then((r) => r.orders).catch(() => [])
);
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold">Order history</h1>
    <div class="mt-6 space-y-3">
      <div v-for="o in (orders ?? [])" :key="o.id" class="flex items-center justify-between rounded border p-4">
        <div><p class="font-medium">{{ o.orderNumber }}</p><p class="text-sm text-gray-500">{{ new Date(o.createdAt).toLocaleString() }} · ₦{{ Number(o.total).toLocaleString() }}</p></div>
        <div class="flex items-center gap-3"><OrderStatus :status="o.status" /><NuxtLink :to="`/dashboard/orders/${o.id}`" class="text-sm text-blue-600">View</NuxtLink></div>
      </div>
      <p v-if="!(orders ?? []).length" class="text-gray-500">No orders yet.</p>
    </div>
  </div>
</template>
