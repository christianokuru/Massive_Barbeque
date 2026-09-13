<script setup lang="ts">
import OrderStatus from "@/components/custom/ecommerce/OrderStatus.vue";

definePageMeta({ layout: "dashboard", middleware: "auth" });
const { user, fetchSession } = useAuth();
await fetchSession();
if (!user.value) await navigateTo("/login");

const { data: orders } = await useAsyncData("all-orders", () =>
  $fetch<{ orders: any[] }>("/api/orders").then((r) => r.orders).catch(() => [])
);
const all = computed(() => orders.value ?? []);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
</script>

<template>
  <div>
    <p class="text-xs font-medium uppercase tracking-[0.4em] text-primary">History</p>
    <h1 class="m3-display-sm mt-3 md:m3-display-md">Order history</h1>
    <p v-if="all.length" class="m3-body-md mt-2 text-muted-foreground">
      {{ all.length }} order{{ all.length === 1 ? "" : "s" }} so far.
    </p>

    <div v-if="all.length" class="mt-6 space-y-3">
      <div
        v-for="o in all"
        :key="o.id"
        class="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
      >
        <div class="min-w-0">
          <p class="truncate font-semibold">{{ o.orderNumber }}</p>
          <p class="mt-0.5 truncate text-sm text-muted-foreground">
            {{ formatDate(o.createdAt) }} · ₦{{ Number(o.total).toLocaleString() }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-3">
          <OrderStatus :status="o.status" />
          <NuxtLink :to="`/dashboard/orders/${o.id}`" class="text-sm font-medium text-primary hover:underline">View</NuxtLink>
        </div>
      </div>
    </div>
    <div v-else class="mt-6 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <p class="font-medium">No orders yet</p>
      <p class="mt-1 text-sm text-muted-foreground">Your history will show up here.</p>
      <NuxtLink to="/menu" class="mt-4 inline-block rounded-full bg-primary px-8 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90">
        Browse the menu
      </NuxtLink>
    </div>
  </div>
</template>
