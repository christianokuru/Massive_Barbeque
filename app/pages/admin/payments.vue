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
  refundStatus?: string | null
  paidAt: string | null
  createdAt: string
}

const PAGE = 100;
const requestHeaders = useRequestHeaders(["cookie"]);
const rows = useState<PaymentRow[]>("admin-payments-rows", () => []);
const total = useState("admin-payments-total", () => 0);
const loadingMore = ref(false);

async function fetchPage(offset: number) {
  return $fetch<{ payments: PaymentRow[]; pagination: { total: number } }>("/api/admin/payments", {
    headers: import.meta.server ? requestHeaders : undefined,
    params: { limit: PAGE, offset },
  });
}

await useAsyncData("admin-payments", async () => {
  const r = await fetchPage(0).catch(() => ({ payments: [], pagination: { total: 0 } }));
  rows.value = r.payments ?? [];
  total.value = r.pagination?.total ?? rows.value.length;
  return true;
});

async function loadMore() {
  loadingMore.value = true;
  try {
    const r = await fetchPage(rows.value.length);
    rows.value = [...rows.value, ...(r.payments ?? [])];
    total.value = r.pagination?.total ?? total.value;
  } finally {
    loadingMore.value = false;
  }
}

const filters = ["all", "paid", "pending", "failed", "refunded"] as const;
const filter = ref<(typeof filters)[number]>("all");
const visible = computed(() =>
  filter.value === "all" ? rows.value : rows.value.filter((p) => p.status === filter.value),
);
const countOf = (s: string) => rows.value.filter((p) => p.status === s).length;
const sumOf = (s: string) => rows.value.filter((p) => p.status === s).reduce((n, p) => n + Number(p.amount || 0), 0);

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
</script>

<template>
  <div class="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
    <div>
      <h1 class="text-3xl font-bold">Payments</h1>
      <p class="mt-1 text-sm text-muted-foreground">Every payment attempt, newest first. Statuses change only through the payment provider or an owner refund.</p>
    </div>

    <!-- Money at a glance (loaded rows) -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div class="rounded-2xl border border-border bg-card p-4">
        <p class="text-xs text-muted-foreground">Received</p>
        <p class="mt-1 text-xl font-semibold tabular-nums">{{ formatNaira(sumOf("paid")) }}</p>
        <p class="text-xs text-muted-foreground">{{ countOf("paid") }} payments</p>
      </div>
      <div class="rounded-2xl border border-border bg-card p-4">
        <p class="text-xs text-muted-foreground">Started, not paid</p>
        <p class="mt-1 text-xl font-semibold tabular-nums">{{ countOf("pending") }}</p>
        <p class="text-xs text-muted-foreground">checkout attempts</p>
      </div>
      <div class="rounded-2xl border border-border bg-card p-4">
        <p class="text-xs text-muted-foreground">Failed</p>
        <p class="mt-1 text-xl font-semibold tabular-nums">{{ countOf("failed") }}</p>
        <p class="text-xs text-muted-foreground">declined or abandoned</p>
      </div>
      <div class="rounded-2xl border border-border bg-card p-4">
        <p class="text-xs text-muted-foreground">Refunded</p>
        <p class="mt-1 text-xl font-semibold tabular-nums">{{ formatNaira(sumOf("refunded")) }}</p>
        <p class="text-xs text-muted-foreground">{{ countOf("refunded") }} refunds</p>
      </div>
    </div>

    <div class="flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 sm:self-start" role="tablist" aria-label="Filter payments">
      <button
        v-for="f in filters"
        :key="f"
        type="button"
        role="tab"
        :aria-selected="filter === f"
        class="shrink-0 rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors"
        :class="filter === f ? 'bg-secondary-container text-on-secondary-container' : 'text-muted-foreground hover:text-foreground'"
        @click="filter = f"
      >
        {{ f }} <span class="tabular-nums opacity-70">{{ f === "all" ? rows.length : countOf(f) }}</span>
      </button>
    </div>

    <ul v-if="visible.length" class="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      <li v-for="p in visible" :key="p.id">
        <NuxtLink :to="`/admin/orders/${p.orderId}`" class="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/40">
          <div class="min-w-0">
            <p class="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span class="tabular-nums">{{ formatNaira(Number(p.amount || 0)) }}</span>
              <span class="text-muted-foreground">·</span>
              <span>{{ p.orderNumber ? `Order ${p.orderNumber}` : "Order" }}</span>
            </p>
            <p class="mt-0.5 truncate text-xs text-muted-foreground">
              <span class="capitalize">{{ p.provider }}</span> · {{ formatDateTime(p.paidAt ?? p.createdAt) }} ·
              <span class="font-mono">{{ p.reference }}</span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="p.refundStatus === 'pending' || p.refundStatus === 'requesting'" class="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">Refund in progress</span>
            <OrderStatus kind="payment" :status="p.status" />
          </div>
        </NuxtLink>
      </li>
    </ul>
    <div v-else class="rounded-2xl border border-dashed border-border p-12 text-center">
      <p class="font-medium">{{ rows.length ? `No ${filter} payments` : "No payments yet" }}</p>
      <p class="mt-1 text-sm text-muted-foreground">Attempts appear here the moment a buyer starts paying.</p>
    </div>

    <div v-if="rows.length < total" class="flex justify-center">
      <button type="button" :disabled="loadingMore" class="rounded-full border border-border px-5 py-2 text-sm hover:border-primary disabled:opacity-50" @click="loadMore">
        {{ loadingMore ? "Loading…" : `Load more (${total - rows.length} left)` }}
      </button>
    </div>
  </div>
</template>
