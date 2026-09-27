<script setup lang="ts">
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

const ACTION_LABEL: Record<string, string> = {
  promote: "Promoted admin",
  demote: "Demoted admin",
  invite: "Invited admin",
  invite_consumed: "Invite used",
  invite_revoked: "Invite revoked",
  status_change: "Order status",
  product_create: "Product created",
  product_update: "Product updated",
  product_delete: "Product deleted",
  refund: "Refund issued",
};

const requestHeaders = useRequestHeaders(["cookie"]);
const { data } = await useAsyncData("admin-audit", () =>
  $fetch<{ entries: AuditEntry[] }>("/api/admin/audit-log", { headers: requestHeaders })
    .then((r) => r.entries ?? [])
    .catch(() => [])
);
const entries = computed(() => data.value ?? []);

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
</script>

<template>
  <div class="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
    <div>
      <h1 class="text-3xl font-bold">Audit log</h1>
      <p class="mt-1 text-sm text-muted-foreground">Who did what, when — governance and money moves, newest first.</p>
    </div>

    <ul v-if="entries.length" class="space-y-2">
      <li
        v-for="e in entries"
        :key="e.id"
        class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold">{{ ACTION_LABEL[e.action] ?? e.action }}</p>
          <p class="mt-0.5 truncate text-xs text-muted-foreground">
            {{ e.actorEmail ?? "system" }} → {{ e.target }}
          </p>
          <p class="mt-0.5 text-xs text-muted-foreground">
            {{ formatDateTime(e.createdAt) }}<span v-if="e.actorIp"> · {{ e.actorIp }}</span>
          </p>
        </div>
      </li>
    </ul>
    <div v-else class="rounded-lg border border-dashed p-12 text-center">
      <p class="font-medium">No audit entries yet</p>
      <p class="mt-1 text-sm text-muted-foreground">Promotions, status changes, and refunds land here.</p>
    </div>
  </div>
</template>
