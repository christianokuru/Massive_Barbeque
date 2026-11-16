<script setup lang="ts">
import { describeAudit, type AuditGroup } from "~~/shared/utils/auditDisplay";

definePageMeta({ layout: "admin", middleware: "admin" });

// Session comes from the admin middleware (single-flight) — no fetch here.

interface AuditEntry {
  id: number
  actorEmail: string | null
  action: string
  target: string
  actorIp: string | null
  createdAt: string
}

const requestHeaders = useRequestHeaders(["cookie"]);
const { data } = await useAsyncData("admin-audit", () =>
  $fetch<{ entries: AuditEntry[] }>("/api/admin/audit-log", {
    headers: requestHeaders,
    params: { limit: 500 },
  })
    .then((r) => r.entries ?? [])
    .catch(() => [])
);

const lines = computed(() =>
  (data.value ?? []).map((e) => ({ ...e, ...describeAudit(e.action, e.target) })),
);

const groups: Array<{ value: "all" | AuditGroup; label: string }> = [
  { value: "all", label: "All" },
  { value: "orders", label: "Orders" },
  { value: "catalog", label: "Menu" },
  { value: "money", label: "Money" },
  { value: "admins", label: "Admins" },
  { value: "settings", label: "Settings" },
];
const group = ref<"all" | AuditGroup>("all");
const visible = computed(() =>
  group.value === "all" ? lines.value : lines.value.filter((l) => l.group === group.value),
);
const countOf = (g: string) => (g === "all" ? lines.value.length : lines.value.filter((l) => l.group === g).length);

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}
</script>

<template>
  <div class="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
    <div>
      <h1 class="text-3xl font-bold">Audit log</h1>
      <p class="mt-1 text-sm text-muted-foreground">Every staff change — orders, menu, money, admins and settings. Newest first.</p>
    </div>

    <div class="flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 sm:self-start" role="tablist" aria-label="Filter audit log">
      <button
        v-for="g in groups"
        :key="g.value"
        type="button"
        role="tab"
        :aria-selected="group === g.value"
        class="shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
        :class="group === g.value ? 'bg-secondary-container text-on-secondary-container' : 'text-muted-foreground hover:text-foreground'"
        @click="group = g.value"
      >
        {{ g.label }} <span class="tabular-nums opacity-70">{{ countOf(g.value) }}</span>
      </button>
    </div>

    <ol v-if="visible.length" class="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      <li v-for="e in visible" :key="e.id" class="grid gap-1 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
        <div class="min-w-0">
          <p class="text-sm font-semibold">
            {{ e.title }}
            <NuxtLink v-if="e.href" :to="e.href" class="ml-1 text-xs font-medium text-primary hover:underline">View</NuxtLink>
          </p>
          <p class="mt-0.5 break-words text-sm text-muted-foreground">{{ e.detail }}</p>
        </div>
        <p class="text-xs text-muted-foreground sm:text-right">
          <span class="block truncate">{{ e.actorEmail ?? "System" }}</span>
          <span class="tabular-nums">{{ formatDateTime(e.createdAt) }}</span>
          <span v-if="e.actorIp" class="tabular-nums"> · {{ e.actorIp }}</span>
        </p>
      </li>
    </ol>
    <div v-else class="rounded-2xl border border-dashed border-border p-12 text-center">
      <p class="font-medium">Nothing here yet</p>
      <p class="mt-1 text-sm text-muted-foreground">Order updates, menu edits, refunds and admin changes are recorded here.</p>
    </div>
  </div>
</template>
