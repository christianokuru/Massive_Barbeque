<script setup lang="ts">
import OrderStatus from "@/components/custom/ecommerce/OrderStatus.vue";

defineProps({
  orders: { type: Array, default: () => [] },
  detailBase: { type: String, default: "/admin/orders" },
});

const formatNaira = (n: number | string) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(n));
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-gray-200">
    <table class="w-full text-left text-sm">
      <thead class="bg-gray-50 text-xs uppercase text-gray-500">
        <tr>
          <th class="px-4 py-3">Order</th>
          <th class="px-4 py-3">Customer</th>
          <th class="px-4 py-3">Total</th>
          <th class="px-4 py-3">Status</th>
          <th class="px-4 py-3">Payment</th>
          <th class="px-4 py-3">Date</th>
          <th class="px-4 py-3" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="o in (orders as any[])" :key="o.id" class="border-t">
          <td class="px-4 py-3 font-medium">{{ o.orderNumber }}</td>
          <td class="px-4 py-3">{{ o.customerName }}<br /><span class="text-gray-500">{{ o.customerPhone }}</span></td>
          <td class="px-4 py-3">{{ formatNaira(o.total) }}</td>
          <td class="px-4 py-3"><OrderStatus :status="o.status" /></td>
          <td class="px-4 py-3"><OrderStatus :status="o.paymentStatus" /> <span class="text-gray-500">· {{ o.paymentMethod }}</span></td>
          <td class="px-4 py-3">{{ new Date(o.createdAt).toLocaleDateString() }}</td>
          <td class="px-4 py-3"><NuxtLink :to="`${detailBase}/${o.id}`" class="text-blue-600 hover:underline">View</NuxtLink></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
