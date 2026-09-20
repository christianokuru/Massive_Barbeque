<script setup lang="ts">
import type { DashboardStats } from "@/components/custom/admin/dashboard/SectionCards.vue";
import type { OrderRow } from "@/components/custom/admin/dashboard/DataTable.vue";
import type { RevenuePoint } from "@/components/custom/admin/dashboard/ChartAreaInteractive.vue";
import { pctChange } from "~~/shared/utils/pricing";
import { ATTENTION_STATUSES } from "~~/shared/utils/orderStatus";
import { needsAttentionRows } from "~~/shared/utils/orderDisplay";
import SectionCards from "@/components/custom/admin/dashboard/SectionCards.vue";
// Heavy below-the-fold deps (@unovis charts, @tanstack/vue-table) load on
// demand so they don't bloat the initial client bundle (see manualChunks
// in nuxt.config.ts).
const ChartAreaInteractive = defineAsyncComponent(
  () => import("@/components/custom/admin/dashboard/ChartAreaInteractive.vue")
);
const DataTable = defineAsyncComponent(
  () => import("@/components/custom/admin/dashboard/DataTable.vue")
);

definePageMeta({ layout: "admin", middleware: "admin" });

const { user, fetchSession } = useAuth();
if (process.client) {
  await fetchSession();
  if (!user.value) await navigateTo("/login");
}

const requestHeaders = useRequestHeaders(["cookie"]);

const { data: ordersData, refresh: refreshOrders } = await useAsyncData("admin-dashboard-orders", () =>
  $fetch<{ orders: any[] }>("/api/admin/orders", { headers: requestHeaders }).then((r) => r.orders).catch(() => [])
);

const { data: productsData } = await useAsyncData("admin-dashboard-products", () =>
  // Admin catalog (unbounded, includes inactive) — the public endpoint is
  // paginated and active-only, so it undercounts past 50 products.
  $fetch<{ products: any[] }>("/api/admin/products", { headers: requestHeaders }).then((r) => r.products ?? []).catch(() => [])
);

const { data: customersData } = await useAsyncData("admin-dashboard-customers", () =>
  $fetch<{ totalCustomers: number }>("/api/admin/customers/count", { headers: requestHeaders }).then((r) => r.totalCustomers).catch(() => 0)
);

const orders = computed(() => ordersData.value ?? []);

const paidOrders = computed(() => orders.value.filter((o) => o.paymentStatus === "paid"));

const stats = computed<DashboardStats>(() => {
  const revenue = paidOrders.value.reduce((sum, o) => sum + Number(o.total || 0), 0);
  // Week-over-week paid revenue; null hides the badge (e.g. no prior week).
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const inWindow = (o: any, from: number, to: number) => {
    const t = new Date(o.createdAt).getTime();
    return Number.isFinite(t) && t >= from && t < to;
  };
  const paidSum = (from: number, to: number) =>
    paidOrders.value.filter((o) => inWindow(o, from, to)).reduce((sum, o) => sum + Number(o.total || 0), 0);
  return {
    revenue,
    revenueDeltaPct: pctChange(paidSum(now - week, now), paidSum(now - 2 * week, now - week)),
    totalOrders: orders.value.length,
    pendingOrders: orders.value.filter((o) => o.status === "pending").length,
    activeProducts: (productsData.value ?? []).filter((p) => p.isActive !== false).length,
    totalCustomers: customersData.value ?? 0,
  };
});

const revenueSeries = computed<RevenuePoint[]>(() => {
  const byDay = new Map<string, number>();
  for (const order of paidOrders.value) {
    const day = new Date(order.createdAt).toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + Number(order.total || 0));
  }
  return [...byDay.entries()]
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));
});

// Home is the action queue, not the archive: only orders still needing
// kitchen work, capped. The full table lives on /admin/orders.
const attentionRows = computed<OrderRow[]>(() =>
  needsAttentionRows(
    orders.value.map((o) => ({
    id: String(o.id),
    orderNumber: o.orderNumber || `#${String(o.id).slice(0, 8).toUpperCase()}`,
    customerName: o.customerName || "Guest",
    customerEmail: o.customerEmail || "",
    itemCount: Array.isArray(o.items) ? o.items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0) : 0,
    total: Number(o.total || 0),
    status: o.status || "pending",
    paymentStatus: o.paymentStatus || "pending",
    createdAt: o.createdAt,
    })),
    ATTENTION_STATUSES,
  )
);
</script>

<template>
  <div class="flex flex-col gap-4 md:gap-6">
    <SectionCards :stats="stats" />
    <div class="px-4 lg:px-6">
      <ChartAreaInteractive :data="revenueSeries" />
    </div>
    <DataTable
      :orders="attentionRows"
      title="Needs attention"
      :show-tabs="false"
      empty-text="All clear — nothing needs the kitchen right now."
      @orders-changed="refreshOrders"
    />
  </div>
</template>
