<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";
import OrderStatus from "@/components/custom/ecommerce/OrderStatus.vue";

definePageMeta({ layout: "dashboard", middleware: "auth" });
// Guarded by middleware (server-safe via /api/auth/session). Session refresh
// is client-only: $supabase comes from a .client.ts plugin (undefined on SSR).
const { displayName, fetchSession } = useAuth();
if (process.client) await fetchSession();

const { data: orders } = await useAsyncData("dashboard-orders", () =>
  $fetch<{ orders: any[] }>("/api/orders", { headers: useRequestHeaders(["cookie"]) }).then((r) => r.orders).catch(() => [])
);
const all = computed(() => orders.value ?? []);
const recent = computed(() => all.value.slice(0, 5));

const firstName = computed(() => (displayName.value || "").split(" ")[0] || "foodie");

// Time-aware greeting is client-only (avoids SSR hydration mismatch).
const greeting = ref("Welcome back");
onMounted(() => {
  const h = new Date().getHours();
  greeting.value = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
});

const TERMINAL = ["completed", "cancelled"];
const activeOrders = computed(() => all.value.filter((o) => !TERMINAL.includes(o.status)));
const spotlight = computed(() => activeOrders.value[0] ?? null);
const totalSpent = computed(() =>
  all.value
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + Number(o.total || 0), 0)
);

const stats = computed(() => [
  { label: "Total orders", value: String(all.value.length), icon: "receipt_long" },
  { label: "In progress", value: String(activeOrders.value.length), icon: "schedule" },
  { label: "Total spent", value: `₦${totalSpent.value.toLocaleString("en-NG")}`, icon: "payments" },
]);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden rounded-m3-xl bg-primary-container text-on-primary-container">
      <M3Icon
        name="outdoor_grill"
        :size="220"
        class="pointer-events-none absolute -right-8 -bottom-10 opacity-10"
      />
      <div class="relative p-6 sm:p-10">
        <p class="m3-label-lg uppercase tracking-[0.2em] opacity-80">Your account</p>
        <h1 class="m3-display-sm mt-2 sm:m3-display-md">{{ greeting }}, {{ firstName }}</h1>
        <p class="m3-body-md mt-2 max-w-md opacity-80">
          {{ spotlight ? "Your grill is already fired up — track your order below." : "Craving something smoky? Your feast is one tap away." }}
        </p>
        <div class="mt-6 flex flex-col gap-3 sm:flex-row">
          <NuxtLink
            to="/menu"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <M3Icon name="restaurant_menu" :size="18" />
            Order now
          </NuxtLink>
          <NuxtLink
            to="/dashboard/orders"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-on-primary-container/30 px-8 py-3.5 text-xs font-medium uppercase tracking-widest transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            All orders
            <M3Icon name="arrow_forward" :size="18" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section aria-label="Order stats" class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      <div
        v-for="s in stats"
        :key="s.label"
        class="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
      >
        <span class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
          <M3Icon :name="s.icon" :size="24" />
        </span>
        <div class="min-w-0">
          <p class="truncate font-serif text-2xl font-semibold sm:text-3xl">{{ s.value }}</p>
          <p class="m3-label-md uppercase tracking-[0.1em] text-muted-foreground">{{ s.label }}</p>
        </div>
      </div>
    </section>

    <!-- Active order spotlight -->
    <section v-if="spotlight" aria-label="Active order" class="mt-4">
      <NuxtLink
        :to="`/dashboard/orders/${spotlight.id}`"
        class="group flex items-center gap-4 rounded-2xl bg-tertiary-container p-4 text-on-tertiary-container transition-shadow sm:p-5"
      >
        <span class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tertiary text-on-tertiary">
          <M3Icon name="local_fire_department" :size="24" filled />
        </span>
        <div class="min-w-0 flex-1">
          <p class="m3-label-md uppercase tracking-[0.1em] opacity-80">Fired up right now</p>
          <p class="m3-title-md truncate">{{ spotlight.orderNumber }} · ₦{{ Number(spotlight.total).toLocaleString("en-NG") }}</p>
        </div>
        <OrderStatus :status="spotlight.status" />
        <M3Icon name="chevron_right" :size="24" class="shrink-0 transition-transform group-hover:translate-x-1" />
      </NuxtLink>
    </section>

    <!-- Recent orders -->
    <section aria-label="Recent orders" class="mt-10">
      <div class="flex items-end justify-between gap-3">
        <h2 class="m3-headline-sm sm:m3-headline-md">Recent orders</h2>
        <NuxtLink v-if="recent.length" to="/dashboard/orders" class="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
          View all <M3Icon name="arrow_forward" :size="18" />
        </NuxtLink>
      </div>
      <div v-if="recent.length" class="mt-4 space-y-3">
        <NuxtLink
          v-for="o in recent"
          :key="o.id"
          :to="`/dashboard/orders/${o.id}`"
          class="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-shadow"
        >
          <span class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
            <M3Icon name="shopping_bag" :size="24" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="m3-title-sm truncate">{{ o.orderNumber }}</p>
            <p class="m3-body-sm mt-0.5 truncate text-muted-foreground">
              {{ formatDate(o.createdAt) }} · ₦{{ Number(o.total).toLocaleString("en-NG") }}
            </p>
          </div>
          <OrderStatus :status="o.status" />
          <M3Icon name="chevron_right" :size="20" class="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </NuxtLink>
      </div>
      <div v-else class="mt-4 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
        <span class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
          <M3Icon name="outdoor_grill" :size="32" />
        </span>
        <p class="m3-title-md mt-4">No orders yet</p>
        <p class="m3-body-md mt-1 text-muted-foreground">Hungry? Your feast is one tap away.</p>
        <NuxtLink to="/menu" class="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90">
          <M3Icon name="restaurant_menu" :size="18" />
          Browse the menu
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
