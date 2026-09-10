<script setup lang="ts">
import OrderStatus from "@/components/custom/ecommerce/OrderStatus.vue";

definePageMeta({ layout: "dashboard", middleware: "auth" });
const { user, fetchSession } = useAuth();
await fetchSession();
if (!user.value) await navigateTo("/login");

const { data: orders } = await useAsyncData("dashboard-orders", () =>
  $fetch<{ orders: any[] }>("/api/orders").then((r) => r.orders).catch(() => [])
);
const recent = computed(() => (orders.value ?? []).slice(0, 5));
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold sm:text-3xl">Hi, {{ user?.name ?? "foodie" }} 👋</h1>
    <p class="mt-1 text-sm text-muted-foreground sm:text-base">Recent orders and quick actions.</p>
    <div class="mt-6 flex gap-3">
      <NuxtLink to="/menu" class="rounded bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">Order now</NuxtLink>
      <NuxtLink to="/dashboard/orders" class="rounded border border-border px-5 py-2 text-sm">All orders</NuxtLink>
    </div>
    <div class="mt-8 space-y-3">
      <div v-for="o in recent" :key="o.id" class="flex items-center justify-between rounded border border-border bg-card p-4">
        <div><p class="font-medium">{{ o.orderNumber }}</p><p class="text-sm text-muted-foreground">₦{{ Number(o.total).toLocaleString() }}</p></div>
        <div class="flex items-center gap-3"><OrderStatus :status="o.status" /><NuxtLink :to="`/dashboard/orders/${o.id}`" class="text-sm text-primary">View</NuxtLink></div>
      </div>
      <p v-if="!recent.length" class="text-muted-foreground">No orders yet. Hungry? <NuxtLink to="/menu" class="text-primary">Browse the menu</NuxtLink>.</p>
    </div>
  </div>
</template>
