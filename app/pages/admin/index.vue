<script setup lang="ts">
import type { DashboardStats } from "@/components/custom/admin/dashboard/SectionCards.vue";
import type { OrderRow } from "@/components/custom/admin/dashboard/DataTable.vue";
import type { RevenuePoint } from "@/components/custom/admin/dashboard/ChartAreaInteractive.vue";
import { toOrderRow } from "~~/shared/utils/orderDisplay";
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

// Single request for the whole home page: aggregates + the 20-row action
// queue, computed server-side (see server/api/admin/overview.get.ts).
// Session comes from the admin middleware (single-flight) — no fetch here.
const requestHeaders = useRequestHeaders(["cookie"]);

interface Overview {
  stats: DashboardStats
  revenueSeries: RevenuePoint[]
  attention: any[]
}

const emptyStats: DashboardStats = {
  revenue: 0,
  revenueDeltaPct: null,
  totalOrders: 0,
  pendingOrders: 0,
  activeProducts: 0,
  totalCustomers: 0,
};

const { data: overview, refresh: refreshOverview } = await useAsyncData("admin-overview", () =>
  $fetch<Overview>("/api/admin/overview", { headers: requestHeaders }).catch(() => null)
);

const stats = computed<DashboardStats>(() => overview.value?.stats ?? emptyStats);
const revenueSeries = computed<RevenuePoint[]>(() => overview.value?.revenueSeries ?? []);
const attentionRows = computed<OrderRow[]>(() => (overview.value?.attention ?? []).map(toOrderRow));
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
      @orders-changed="refreshOverview"
    />
  </div>
</template>
