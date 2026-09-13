<script setup lang="ts">
import { toast } from "vue-sonner";

definePageMeta({ layout: "admin", middleware: "admin" });

const { user, fetchSession, fetchIsOwner, isOwner } = useAuth();
if (process.client) {
  await fetchSession();
  if (!user.value) await navigateTo("/login");
  await fetchIsOwner();
}

interface AdminRow {
  id: string;
  email: string;
  lastSignIn: string | null;
  isOwner: boolean;
}
interface InviteRow {
  email: string;
  invited_by_email: string | null;
  created_at: string;
}

const admins = ref<AdminRow[]>([]);
const invites = ref<InviteRow[]>([]);
const loading = ref(true);
const forbidden = ref(false);
const email = ref("");
const busy = ref(false);
const confirmDemote = ref<string | null>(null);

const requestHeaders = useRequestHeaders(["cookie"]);

async function load() {
  loading.value = true;
  forbidden.value = false;
  try {
    const headers = process.server ? requestHeaders : undefined;
    const data = await $fetch<{ admins: AdminRow[]; invites: InviteRow[] }>("/api/admin/admins", { headers });
    admins.value = data.admins ?? [];
    invites.value = data.invites ?? [];
  } catch (e: any) {
    if (e?.statusCode === 403 || e?.data?.statusCode === 403) forbidden.value = true;
    else toast.error("Could not load admins.");
  } finally {
    loading.value = false;
  }
}

await useAsyncData("admin-roster", load);

const myEmail = computed(() => (user.value?.email || "").toLowerCase());

function demoteDisabled(a: AdminRow): string | null {
  if (a.email.toLowerCase() === myEmail.value) return "You cannot demote yourself.";
  if (a.isOwner) return "Owners are managed via env, not here.";
  return null;
}

async function promote() {
  const target = email.value.trim();
  if (!target) return;
  busy.value = true;
  try {
    const data = await $fetch<{ mode: string }>("/api/admin/admins", {
      method: "POST",
      body: { email: target },
    });
    toast.success(data.mode === "invited" ? `Invite created — ${target} becomes admin on signup.` : `${target} is now an admin.`);
    email.value = "";
    await load();
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || "Could not promote user.");
  } finally {
    busy.value = false;
  }
}

async function demote(target: string) {
  if (confirmDemote.value !== target) {
    confirmDemote.value = target;
    return;
  }
  confirmDemote.value = null;
  busy.value = true;
  try {
    await $fetch("/api/admin/admins", { method: "DELETE", body: { email: target } });
    toast.success(`${target} demoted. They lose access on next sign-in.`);
    await load();
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || "Could not demote user.");
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
    <div>
      <p class="text-xs font-medium uppercase tracking-[0.4em] text-primary">Owner only</p>
      <h1 class="mt-2 text-3xl font-bold">Admins</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Admins stay admins until you demote them here. Demoted accounts keep
        their current session until they sign out and back in.
      </p>
    </div>

    <div v-if="forbidden" class="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center">
      <p class="font-medium">Owner access required</p>
      <p class="mt-1 text-sm text-muted-foreground">Only the account owner manages admins.</p>
    </div>

    <template v-else>
      <form class="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row" @submit.prevent="promote">
        <label class="sr-only" for="promote-email">Email to promote</label>
        <input
          id="promote-email"
          v-model="email"
          type="email"
          required
          placeholder="person@example.com"
          class="w-full flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          :disabled="busy"
          class="rounded-full bg-primary px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {{ busy ? "Working…" : "Make admin" }}
        </button>
      </form>
      <p class="-mt-2 text-xs text-muted-foreground">New address? They become admin instantly if signed up, or get an invite that applies on signup.</p>

      <h2 class="m3-headline-md mt-2">Current admins ({{ admins.length }})</h2>
      <div v-if="loading" class="text-sm text-muted-foreground">Loading…</div>
      <ul v-else class="space-y-2">
        <li
          v-for="a in admins"
          :key="a.id"
          class="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold">
              {{ a.email }}
              <span v-if="a.email.toLowerCase() === myEmail" class="ml-1 text-xs font-normal text-muted-foreground">(you)</span>
              <span v-if="a.isOwner" class="ml-1 rounded-full bg-secondary-container px-2 py-0.5 text-[11px] font-medium text-on-secondary-container">owner</span>
            </p>
            <p class="mt-0.5 text-xs text-muted-foreground">
              Last sign-in: {{ a.lastSignIn ? new Date(a.lastSignIn).toLocaleString("en-NG") : "never" }}
            </p>
          </div>
          <button
            type="button"
            :disabled="!!demoteDisabled(a) || busy"
            :title="demoteDisabled(a) || (confirmDemote === a.email ? 'Click again to confirm' : 'Demote')"
            class="shrink-0 rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            :class="confirmDemote === a.email ? 'border-destructive bg-destructive text-white' : 'border-destructive/50 text-destructive hover:bg-destructive/10'"
            @click="demote(a.email)"
          >
            {{ confirmDemote === a.email ? "Confirm?" : "Demote" }}
          </button>
        </li>
      </ul>

      <h2 v-if="invites.length" class="m3-headline-md mt-4">Pending invites ({{ invites.length }})</h2>
      <ul v-if="invites.length" class="space-y-2">
        <li
          v-for="i in invites"
          :key="i.email"
          class="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-card p-4"
        >
          <p class="truncate text-sm">{{ i.email }}</p>
          <p class="shrink-0 text-xs text-muted-foreground">applies on signup</p>
        </li>
      </ul>
    </template>
  </div>
</template>
