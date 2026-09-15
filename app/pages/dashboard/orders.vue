<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";
import OrderStatus from "@/components/custom/ecommerce/OrderStatus.vue";

definePageMeta({ layout: "dashboard", middleware: "auth" });
// Guarded by middleware (server-safe via /api/auth/session) — no in-page
// session guard: $supabase is client-only (undefined on SSR).

const { data: orders } = await useAsyncData("all-orders", () =>
  $fetch<{ orders: any[] }>("/api/orders", { headers: useRequestHeaders(["cookie"]) }).then((r) => r.orders).catch(() => [])
);
const all = computed(() => orders.value ?? []);

type Filter = "all" | "active" | "completed" | "cancelled";
const activeFilter = ref<Filter>("all");

const filters: { id: Filter; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "receipt_long" },
  { id: "active", label: "In progress", icon: "schedule" },
  { id: "completed", label: "Completed", icon: "check_circle" },
  { id: "cancelled", label: "Cancelled", icon: "cancel" },
];

const visible = computed(() => {
  if (activeFilter.value === "all") return all.value;
  if (activeFilter.value === "active")
    return all.value.filter((o) => !["completed", "cancelled"].includes(o.status));
  return all.value.filter((o) => o.status === activeFilter.value);
});

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
    <p class="m3-label-lg uppercase tracking-[0.2em] text-primary">History</p>
    <h1 class="m3-display-sm mt-2 sm:m3-display-md">Order history</h1>
    <p v-if="all.length" class="m3-body-md mt-2 text-muted-foreground">
      {{ all.length }} order{{ all.length === 1 ? "" : "s" }} so far — every smoky one of them.
    </p>

    <!-- Filter chips -->
    <div v-if="all.length" class="mt-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter orders">
      <button
        v-for="f in filters"
        :key="f.id"
        type="button"
        role="tab"
        :aria-selected="activeFilter === f.id"
        class="inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors"
        :class="activeFilter === f.id
          ? 'border-transparent bg-secondary-container text-on-secondary-container shadow-m3-1'
          : 'border-border bg-card text-muted-foreground hover:text-foreground'"
        @click="activeFilter = f.id"
      >
        <M3Icon v-if="activeFilter === f.id" name="check" :size="18" />
        <M3Icon v-else :name="f.icon" :size="18" />
        {{ f.label }}
      </button>
    </div>

    <div v-if="visible.length" class="mt-4 space-y-3">
      <NuxtLink
        v-for="o in visible"
        :key="o.id"
        :to="`/dashboard/orders/${o.id}`"
        class="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-m3-1 transition-shadow hover:shadow-m3-2"
      >
        <span class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
          <M3Icon name="shopping_bag" :size="24" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="m3-title-sm truncate">{{ o.orderNumber }}</p>
          <p class="m3-body-sm mt-0.5 truncate text-muted-foreground">
            {{ formatDate(o.createdAt) }} · {{ o.fulfillmentType === "delivery" ? "Delivery" : "Pickup" }} · ₦{{ Number(o.total).toLocaleString("en-NG") }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <OrderStatus :status="o.status" />
          <M3Icon name="chevron_right" :size="20" class="text-muted-foreground transition-transform group-hover:translate-x-1" />
        </div>
      </NuxtLink>
    </div>

    <!-- Empty states -->
    <div v-else-if="all.length" class="mt-4 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-m3-1">
      <span class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
        <M3Icon name="search_off" :size="32" />
      </span>
      <p class="m3-title-md mt-4">Nothing here</p>
      <p class="m3-body-md mt-1 text-muted-foreground">No {{ filters.find((f) => f.id === activeFilter)?.label.toLowerCase() }} orders to show.</p>
      <button
        type="button"
        class="mt-6 rounded-full border border-border px-8 py-3 text-xs font-medium uppercase tracking-widest transition-colors hover:bg-secondary-container/60"
        @click="activeFilter = 'all'"
      >
        Show everything
      </button>
    </div>
    <div v-else class="mt-6 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-m3-1">
      <span class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
        <M3Icon name="outdoor_grill" :size="32" />
      </span>
      <p class="m3-title-md mt-4">No orders yet</p>
      <p class="m3-body-md mt-1 text-muted-foreground">Your history will show up here.</p>
      <NuxtLink to="/menu" class="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-xs font-medium uppercase tracking-widest text-primary-foreground shadow-m3-1 transition-colors hover:bg-primary/90">
        <M3Icon name="restaurant_menu" :size="18" />
        Browse the menu
      </NuxtLink>
    </div>
  </div>
</template>
