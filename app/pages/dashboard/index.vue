<script setup lang="ts">
import OrderStatus from "@/components/custom/ecommerce/OrderStatus.vue";

definePageMeta({ layout: "dashboard", middleware: "auth" });
const { user, displayName, fetchSession } = useAuth();
await fetchSession();
if (!user.value) await navigateTo("/login");

const { data: orders } = await useAsyncData("dashboard-orders", () =>
  $fetch<{ orders: any[] }>("/api/orders").then((r) => r.orders).catch(() => [])
);
const all = computed(() => orders.value ?? []);
const recent = computed(() => all.value.slice(0, 5));

const firstName = computed(() => (displayName.value || "").split(" ")[0] || "foodie");
const activeCount = computed(
  () => all.value.filter((o) => !["completed", "cancelled"].includes(o.status)).length
);
const totalSpent = computed(() =>
  all.value
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + Number(o.total || 0), 0)
);

const stats = computed(() => [
  { label: "Total orders", value: String(all.value.length) },
  { label: "In progress", value: String(activeCount.value) },
  { label: "Total spent", value: `₦${totalSpent.value.toLocaleString()}` },
]);
</script>

<template>
  <div>
    <p class="text-xs font-medium uppercase tracking-[0.4em] text-primary">Your account</p>
    <h1 class="m3-display-sm mt-3 md:m3-display-md">Hi, {{ firstName }}</h1>
    <p class="m3-body-md mt-2 text-muted-foreground">Recent orders and quick actions.</p>

    <div class="mt-6 grid grid-cols-3 gap-3">
      <div
        v-for="s in stats"
        :key="s.label"
        class="rounded-2xl border border-border bg-card p-3 sm:p-4"
      >
        <p class="truncate text-lg font-bold sm:text-2xl">{{ s.value }}</p>
        <p class="mt-0.5 truncate text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">{{ s.label }}</p>
      </div>
    </div>

    <div class="mt-6 flex flex-col gap-3 sm:flex-row">
      <NuxtLink to="/menu" class="rounded-full bg-primary px-8 py-3 text-center text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90">
        Order now
      </NuxtLink>
      <NuxtLink to="/dashboard/orders" class="rounded-full border border-border px-8 py-3 text-center text-xs font-medium uppercase tracking-widest transition-colors hover:bg-secondary-container/60">
        All orders
      </NuxtLink>
    </div>

    <h2 class="m3-headline-md mt-10">Recent orders</h2>
    <div v-if="recent.length" class="mt-4 space-y-3">
      <div
        v-for="o in recent"
        :key="o.id"
        class="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
      >
        <div class="min-w-0">
          <p class="truncate font-semibold">{{ o.orderNumber }}</p>
          <p class="mt-0.5 text-sm text-muted-foreground">₦{{ Number(o.total).toLocaleString() }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-3">
          <OrderStatus :status="o.status" />
          <NuxtLink :to="`/dashboard/orders/${o.id}`" class="text-sm font-medium text-primary hover:underline">View</NuxtLink>
        </div>
      </div>
    </div>
    <div v-else class="mt-4 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <p class="font-medium">No orders yet</p>
      <p class="mt-1 text-sm text-muted-foreground"> Hungry? Your feast is one tap away.</p>
      <NuxtLink to="/menu" class="mt-4 inline-block rounded-full bg-primary px-8 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90">
        Browse the menu
      </NuxtLink>
    </div>
  </div>
</template>
