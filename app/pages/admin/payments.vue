<script setup lang="ts">
import OrderStatus from "@/components/custom/ecommerce/OrderStatus.vue";
import { formatNaira } from "~~/shared/utils/pricing";

definePageMeta({ layout: "admin", middleware: "admin" });

// Session comes from the admin middleware (single-flight) — no fetch here.

interface PaymentRow {
  id: number
  orderId: string
  orderNumber: string | null
  provider: string
  reference: string
  amount: string
  currency: string
  status: string
  paidAt: string | null
  createdAt: string
}

const requestHeaders = useRequestHeaders(["cookie"]);
const { data } = await useAsyncData("admin-payments", () =>
  $fetch<{ payments: PaymentRow[] }>("/api/admin/payments", { headers: requestHeaders })
    .then((r) => r.payments ?? [])
    .catch(() => [])
);
const payments = computed(() => data.value ?? []);

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
</script>

<template>
  <div class="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
    <div>
      <h1 class="text-3xl font-bold">Payments</h1>
      <p class="mt-1 text-sm text-muted-foreground">Every payment attempt, newest first — states change only via webhooks, verify-settling, or owner refunds.</p>
    </div>

    <ul v-if="payments.length" class="space-y-2">
      <li
        v-for="p in payments"
        :key="p.id"
        class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
      >
        <div class="min-w-0">
          <p class="truncate font-mono text-sm font-medium">{{ p.reference }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">
            {{ p.provider }} · {{ formatNaira(Number(p.amount || 0)) }} {{ p.currency || "NGN" }}
            <span v-if="p.orderNumber"> · order {{ p.orderNumber }}</span>
          </p>
          <p class="mt-0.5 text-xs text-muted-foreground">
            {{ formatDateTime(p.paidAt ?? p.createdAt) }}
          </p>
        </div>
        <OrderStatus :status="p.status" />
      </li>
    </ul>
    <div v-else class="rounded-lg border border-dashed p-12 text-center">
      <p class="font-medium">No payments yet</p>
      <p class="mt-1 text-sm text-muted-foreground">Attempts appear here the moment a buyer starts checkout.</p>
    </div>
  </div>
</template>
