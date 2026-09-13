<script setup lang="ts">
import OrderStatus from "@/components/custom/ecommerce/OrderStatus.vue";

definePageMeta({ layout: "dashboard", middleware: "auth" });
const route = useRoute();
const { user, fetchSession } = useAuth();
await fetchSession();
if (!user.value) await navigateTo("/login");

const { data: order } = await useAsyncData(`order-${route.params.id}`, () =>
  $fetch<{ order: any }>(`/api/orders/${route.params.id}`).then((r) => r.order).catch(() => null)
);
</script>

<template>
  <div>
    <NuxtLink to="/dashboard/orders" class="text-sm text-muted-foreground hover:underline">← All orders</NuxtLink>
    <div v-if="order" class="mt-4">
      <p class="text-xs font-medium uppercase tracking-[0.4em] text-primary">Order</p>
      <h1 class="m3-headline-md mt-2 break-all">{{ order.orderNumber }}</h1>
      <div class="mt-3 flex flex-wrap gap-2">
        <OrderStatus :status="order.status" />
        <OrderStatus :status="order.paymentStatus" />
      </div>
      <div class="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <ul class="divide-y divide-border">
          <li v-for="i in (order.items ?? [])" :key="i.id" class="flex justify-between gap-3 p-4 text-sm">
            <span class="text-muted-foreground">{{ i.productName }} ({{ i.variantName }}) × {{ i.quantity }}</span>
            <span class="shrink-0 font-medium">₦{{ Number(i.totalPrice).toLocaleString() }}</span>
          </li>
        </ul>
        <div class="space-y-1 border-t border-border bg-muted/50 p-4 text-sm">
          <p class="flex justify-between"><span class="text-muted-foreground">Subtotal</span><span>₦{{ Number(order.subtotal ?? order.total).toLocaleString() }}</span></p>
          <p class="flex justify-between"><span class="text-muted-foreground">Delivery</span><span>₦{{ Number(order.deliveryFee ?? 0).toLocaleString() }}</span></p>
          <p class="flex justify-between font-bold"><span>Total</span><span>₦{{ Number(order.total).toLocaleString() }}</span></p>
        </div>
      </div>
      <NuxtLink to="/menu" class="mt-6 inline-block rounded-full bg-primary px-8 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90">
        Order again
      </NuxtLink>
    </div>
    <div v-else class="mt-6 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <p class="font-medium">Order not found</p>
      <p class="mt-1 text-sm text-muted-foreground">It may have been removed.</p>
    </div>
  </div>
</template>
