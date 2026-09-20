<script setup lang="ts">
import type { OrderRow } from "@/components/custom/admin/dashboard/DataTable.vue";
import { toOrderRow } from "~~/shared/utils/orderDisplay";

// Async like the dashboard home: keeps the heavy table deps (@tanstack)
// out of the initial bundle.
const DataTable = defineAsyncComponent(
  () => import("@/components/custom/admin/dashboard/DataTable.vue")
);

definePageMeta({ layout: "admin", middleware: "admin" });

// Session comes from the admin middleware (single-flight) — no fetch here.
const requestHeaders = useRequestHeaders(["cookie"]);
// Full archive: tabs, search, and bulk actions live here.
// The dashboard home shows only the action queue.
const { data: ordersData, refresh: refreshOrders } = await useAsyncData("admin-orders", () =>
  $fetch<{ orders: any[] }>("/api/admin/orders", { headers: requestHeaders }).then((r) => r.orders).catch(() => [])
);

const orderRows = computed<OrderRow[]>(() =>
  (ordersData.value ?? []).map(toOrderRow)
);
</script>

<template>
  <div class="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
    <div>
      <h1 class="text-3xl font-bold">Orders</h1>
      <p class="mt-1 text-sm text-muted-foreground">Every order, searchable — select rows to move them together.</p>
    </div>
    <DataTable :orders="orderRows" :show-view-all="false" @orders-changed="refreshOrders" />
  </div>
</template>
