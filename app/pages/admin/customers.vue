<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

definePageMeta({ layout: "admin", middleware: "admin" });

// Session comes from the admin middleware (single-flight) — no fetch here.

interface CustomerRow {
  id: string
  email: string | null
  name: string | null
  lastSignIn: string | null
  createdAt: string
  orderCount: number
}

const requestHeaders = useRequestHeaders(["cookie"]);
const page = ref(1);
const { data, refresh } = await useAsyncData("admin-customers", () =>
  $fetch<{ customers: CustomerRow[]; pagination: { hasMore: boolean } }>("/api/admin/customers", {
    headers: requestHeaders,
    params: { page: page.value },
  }).catch(() => ({ customers: [], pagination: { hasMore: false } }))
);
const customers = computed(() => data.value?.customers ?? []);
const hasMore = computed(() => data.value?.pagination.hasMore ?? false);

async function go(delta: number) {
  page.value = Math.max(1, page.value + delta);
  await refresh();
}

function formatDate(iso: string | null) {
  if (!iso) return "never";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
</script>

<template>
  <div class="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
    <div>
      <h1 class="text-3xl font-bold">Customers</h1>
      <p class="mt-1 text-sm text-muted-foreground">Registered accounts with placed-order counts. Guests never appear here by design.</p>
    </div>

    <ul v-if="customers.length" class="space-y-2">
      <li
        v-for="c in customers"
        :key="c.id"
        class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold">{{ c.name || c.email || "Customer" }}</p>
          <p class="mt-0.5 truncate text-xs text-muted-foreground">{{ c.email }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">Last sign-in: {{ formatDate(c.lastSignIn) }}</p>
        </div>
        <span class="shrink-0 rounded-full bg-secondary-container px-3 py-1 text-xs font-medium text-on-secondary-container">
          {{ c.orderCount }} order{{ c.orderCount === 1 ? "" : "s" }}
        </span>
      </li>
    </ul>
    <div v-else class="rounded-lg border border-dashed p-12 text-center">
      <p class="font-medium">No customers yet</p>
      <p class="mt-1 text-sm text-muted-foreground">Accounts appear here after their first sign-up.</p>
    </div>

    <div v-if="customers.length || page > 1" class="flex items-center justify-between">
      <Button variant="outline" size="sm" :disabled="page <= 1" @click="go(-1)">
        <ChevronLeft /> Previous
      </Button>
      <span class="text-sm text-muted-foreground">Page {{ page }}</span>
      <Button variant="outline" size="sm" :disabled="!hasMore" @click="go(1)">
        Next <ChevronRight />
      </Button>
    </div>
  </div>
</template>
