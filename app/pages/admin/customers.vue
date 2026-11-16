<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { formatNaira } from "~~/shared/utils/pricing";

definePageMeta({ layout: "admin", middleware: "admin" });

// Session comes from the admin middleware (single-flight) — no fetch here.

interface CustomerRow {
  id: string
  email: string | null
  name: string | null
  emailConfirmed?: boolean
  lastSignIn: string | null
  createdAt: string
  orderCount: number
  totalSpent?: number
  lastOrderAt?: string | null
}

const requestHeaders = useRequestHeaders(["cookie"]);
const page = ref(1);
const { data, refresh, status } = await useAsyncData("admin-customers", () =>
  $fetch<{ customers: CustomerRow[]; pagination: { hasMore: boolean } }>("/api/admin/customers", {
    headers: requestHeaders,
    params: { page: page.value },
  }).catch(() => ({ customers: [], pagination: { hasMore: false } }))
);
const customers = computed(() => data.value?.customers ?? []);
const hasMore = computed(() => data.value?.pagination.hasMore ?? false);
const loading = computed(() => status.value === "pending");

async function go(delta: number) {
  page.value = Math.max(1, page.value + delta);
  await refresh();
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
function initials(c: CustomerRow) {
  const src = (c.name || c.email || "?").trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}
</script>

<template>
  <div class="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
    <div>
      <h1 class="text-3xl font-bold">Customers</h1>
      <p class="mt-1 text-sm text-muted-foreground">Registered accounts, with orders and paid spend. Guest checkouts don't appear here.</p>
    </div>

    <ul v-if="customers.length" class="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card" :class="loading ? 'opacity-60' : ''">
      <li v-for="c in customers" :key="c.id" class="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div class="flex min-w-0 items-center gap-3">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-xs font-semibold text-on-secondary-container" aria-hidden="true">
            {{ initials(c) }}
          </span>
          <div class="min-w-0">
            <p class="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span class="truncate">{{ c.name || c.email || "Customer" }}</span>
              <span v-if="c.emailConfirmed === false" class="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Email not confirmed</span>
            </p>
            <p class="truncate text-xs text-muted-foreground">{{ c.email }}</p>
          </div>
        </div>
        <dl class="grid grid-cols-3 gap-4 text-xs sm:flex sm:gap-6 sm:text-right">
          <div>
            <dt class="text-muted-foreground">Orders</dt>
            <dd class="mt-0.5 text-sm font-semibold tabular-nums">{{ c.orderCount }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground">Spent</dt>
            <dd class="mt-0.5 text-sm font-semibold tabular-nums">{{ formatNaira(c.totalSpent ?? 0) }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground">Last order</dt>
            <dd class="mt-0.5 text-sm tabular-nums">{{ formatDate(c.lastOrderAt) }}</dd>
          </div>
          <div class="hidden sm:block">
            <dt class="text-muted-foreground">Joined</dt>
            <dd class="mt-0.5 text-sm tabular-nums">{{ formatDate(c.createdAt) }}</dd>
          </div>
        </dl>
      </li>
    </ul>
    <div v-else class="rounded-2xl border border-dashed border-border p-12 text-center">
      <p class="font-medium">{{ page > 1 ? "No more customers" : "No customers yet" }}</p>
      <p class="mt-1 text-sm text-muted-foreground">Accounts appear here after they sign up.</p>
    </div>

    <div v-if="customers.length || page > 1" class="flex items-center justify-between">
      <Button variant="outline" size="sm" :disabled="page <= 1 || loading" @click="go(-1)">
        <ChevronLeft /> Previous
      </Button>
      <span class="text-sm text-muted-foreground">Page {{ page }}</span>
      <Button variant="outline" size="sm" :disabled="!hasMore || loading" @click="go(1)">
        Next <ChevronRight />
      </Button>
    </div>
  </div>
</template>
