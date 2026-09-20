<script setup lang="ts">
import type { OrderRow } from "@/components/custom/admin/dashboard/DataTable.vue";

// Async like the dashboard home: keeps the heavy table deps (@tanstack)
// out of the initial bundle.
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
// Full archive: tabs, search, and bulk actions live here.
// The dashboard home shows only the action queue.
const { data: ordersData, refresh: refreshOrders } = await useAsyncData("admin-orders", () =>
  $fetch<{ orders: any[] }>("/api/admin/orders", { headers: requestHeaders }).then((r) => r.orders).catch(() => [])
);

const orderRows = computed<OrderRow[]>(() =>
  (ordersData.value ?? []).map((o) => ({
    id: String(o.id),
    orderNumber: o.orderNumber || `#${String(o.id).slice(0, 8).toUpperCase()}`,
    customerName: o.customerName || "Guest",
    customerEmail: o.customerEmail || "",
    itemCount: Array.isArray(o.items) ? o.items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0) : 0,
    total: Number(o.total || 0),
    status: o.status || "pending",
    paymentStatus: o.paymentStatus || "pending",
    createdAt: o.createdAt,
  }))
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
