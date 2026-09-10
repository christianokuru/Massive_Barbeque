<script setup lang="ts">
import OrderStatus from "@/components/custom/ecommerce/OrderStatus.vue";
definePageMeta({ layout: "dashboard", middleware: "auth" });
const route = useRoute();
const { user, fetchSession } = useAuth();
await fetchSession();
if (!user.value) await navigateTo("/login");
const { data: order } = await useAsyncData(`order-${route.params.id}`, () =>
  $fetch<{ order: any }>(`/api/orders/${route.params.id}`).then((r) => r.order)
);
</script>

<template>
  <div>
    <NuxtLink to="/dashboard/orders" class="text-sm text-muted-foreground hover:underline">← All orders</NuxtLink>
    <div v-if="order" class="mt-4">
      <h1 class="text-2xl font-bold break-all sm:text-3xl">{{ order.orderNumber }}</h1>
      <div class="mt-2 flex gap-2"><OrderStatus :status="order.status" /><OrderStatus :status="order.paymentStatus" /></div>
      <ul class="mt-6 space-y-2">
        <li v-for="i in (order.items ?? [])" :key="i.id" class="flex justify-between rounded border p-3 text-sm">
          <span>{{ i.productName }} ({{ i.variantName }}) × {{ i.quantity }}</span>
          <span>₦{{ Number(i.totalPrice).toLocaleString() }}</span>
        </li>
      </ul>
      <p class="mt-4 text-right font-bold">Total: ₦{{ Number(order.total).toLocaleString() }}</p>
      <NuxtLink to="/menu" class="mt-6 inline-block rounded bg-primary px-5 py-2 text-sm text-primary-foreground">Reorder favourites</NuxtLink>
    </div>
    <p v-else class="mt-6 text-muted-foreground">Order not found.</p>
  </div>
</template>
