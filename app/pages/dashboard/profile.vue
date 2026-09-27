<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";
import { toast } from "vue-sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

definePageMeta({ layout: "dashboard", middleware: "auth" });
// Session comes from the auth middleware (single-flight) — no fetch here.
const { user, displayName, logout } = useAuth();

const initials = computed(() => {
  const name = displayName.value || "?";
  return (
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
});

const memberSince = computed(() => {
  const iso = user.value?.created_at;
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
});

const links = [
  { label: "Order history", text: "Track and reorder your feasts", to: "/dashboard/orders", icon: "receipt_long" },
  { label: "Browse the menu", text: "See what's fresh off the grill", to: "/menu", icon: "restaurant_menu" },
  { label: "Contact us", text: "Questions about an order?", to: "/contact", icon: "support_agent" },
];

// Saved delivery addresses: the default pre-fills checkout.
interface SavedAddress {
  id: number
  firstName: string
  lastName: string
  phone: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  postalCode?: string | null
  isDefault?: boolean
}

const addresses = ref<SavedAddress[]>([]);
const addressesLoading = ref(true);
const dialogOpen = ref(false);
const editingId = ref<number | null>(null);
const savingAddress = ref(false);
const confirmDeleteAddress = ref<number | null>(null);
const addressForm = ref({
  firstName: "",
  lastName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "Lagos",
  state: "Lagos",
  postalCode: "",
});

async function loadAddresses() {
  addressesLoading.value = true;
  try {
    const data = await $fetch<{ addresses: SavedAddress[] }>("/api/addresses");
    addresses.value = data.addresses ?? [];
  } catch {
    // Address book is a convenience — a failed load must not break profile.
  } finally {
    addressesLoading.value = false;
  }
}

onMounted(loadAddresses);

function openAddressCreate() {
  editingId.value = null;
  addressForm.value = {
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "Lagos",
    state: "Lagos",
    postalCode: "",
  };
  dialogOpen.value = true;
}

function openAddressEdit(a: SavedAddress) {
  editingId.value = a.id;
  addressForm.value = {
    firstName: a.firstName ?? "",
    lastName: a.lastName ?? "",
    phone: a.phone ?? "",
    addressLine1: a.addressLine1 ?? "",
    addressLine2: a.addressLine2 ?? "",
    city: a.city ?? "Lagos",
    state: a.state ?? "Lagos",
    postalCode: a.postalCode ?? "",
  };
  dialogOpen.value = true;
}

async function saveAddress() {
  savingAddress.value = true;
  try {
    const payload = {
      firstName: addressForm.value.firstName.trim(),
      lastName: addressForm.value.lastName.trim(),
      phone: addressForm.value.phone.trim(),
      addressLine1: addressForm.value.addressLine1.trim(),
      addressLine2: addressForm.value.addressLine2.trim() || undefined,
      city: addressForm.value.city.trim(),
      state: addressForm.value.state.trim(),
      postalCode: addressForm.value.postalCode.trim() || undefined,
    };
    if (editingId.value == null) {
      await $fetch("/api/addresses", { method: "POST", body: payload });
      toast.success("Address saved.");
    } else {
      await $fetch(`/api/addresses/${editingId.value}`, { method: "PUT", body: payload });
      toast.success("Address updated.");
    }
    dialogOpen.value = false;
    await loadAddresses();
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || "Could not save address.");
  } finally {
    savingAddress.value = false;
  }
}

async function deleteAddress(id: number) {
  if (confirmDeleteAddress.value !== id) {
    confirmDeleteAddress.value = id;
    return;
  }
  confirmDeleteAddress.value = null;
  try {
    await $fetch(`/api/addresses/${id}`, { method: "DELETE" });
    toast.success("Address deleted.");
    await loadAddresses();
  } catch {
    toast.error("Could not delete address.");
  }
}

async function makeDefault(id: number) {
  try {
    await $fetch(`/api/addresses/${id}/default`, { method: "POST" });
    await loadAddresses();
  } catch {
    toast.error("Could not set default address.");
  }
}
</script>

<template>
  <div>
    <p class="m3-label-lg uppercase tracking-[0.2em] text-primary">Account</p>
    <h1 class="m3-display-sm mt-2 sm:m3-display-md">Profile</h1>

    <!-- Identity card -->
    <section class="relative mt-6 overflow-hidden rounded-3xl bg-primary-container text-on-primary-container">
      <M3Icon
        name="person"
        :size="200"
        class="pointer-events-none absolute -right-6 -bottom-8 opacity-10"
      />
      <div class="relative flex items-center gap-5 p-6 sm:p-8">
        <Avatar class="h-20 w-20 shrink-0 ring-4 ring-primary/20">
          <AvatarFallback class="bg-primary text-2xl font-semibold text-primary-foreground">
            {{ initials }}
          </AvatarFallback>
        </Avatar>
        <div class="min-w-0">
          <p class="m3-headline-sm truncate">{{ displayName || "Foodie" }}</p>
          <p class="m3-body-md mt-0.5 truncate opacity-80">{{ user?.email }}</p>
          <p v-if="memberSince" class="m3-label-md mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-primary-foreground">
            <M3Icon name="celebration" :size="16" />
            Member since {{ memberSince }}
          </p>
        </div>
      </div>
    </section>

    <!-- Details -->
    <section aria-label="Account details" class="mt-4 rounded-3xl border border-border bg-card">
      <dl class="divide-y divide-border px-6">
        <div class="flex items-center gap-4 py-4">
          <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <M3Icon name="badge" :size="20" />
          </span>
          <div class="min-w-0 flex-1">
            <dt class="m3-label-md uppercase tracking-[0.1em] text-muted-foreground">Name</dt>
            <dd class="m3-title-sm mt-0.5 truncate">{{ displayName || "—" }}</dd>
          </div>
        </div>
        <div class="flex items-center gap-4 py-4">
          <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <M3Icon name="mail" :size="20" />
          </span>
          <div class="min-w-0 flex-1">
            <dt class="m3-label-md uppercase tracking-[0.1em] text-muted-foreground">Email</dt>
            <dd class="m3-title-sm mt-0.5 truncate">{{ user?.email || "—" }}</dd>
          </div>
        </div>
      </dl>
    </section>

    <!-- Saved addresses -->
    <section aria-label="Saved addresses" class="mt-4 rounded-3xl border border-border bg-card p-6">
      <div class="flex items-center justify-between gap-3">
        <h2 class="m3-title-md flex items-center gap-2">
          <M3Icon name="local_shipping" :size="22" class="text-primary" />
          Saved addresses
        </h2>
        <button
          type="button"
          class="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          @click="openAddressCreate"
        >
          <M3Icon name="add" :size="18" /> Add
        </button>
      </div>
      <div v-if="addressesLoading" class="mt-4 text-sm text-muted-foreground">Loading…</div>
      <ul v-else-if="addresses.length" class="mt-4 space-y-3">
        <li
          v-for="a in addresses"
          :key="a.id"
          class="rounded-2xl border border-border p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 text-sm">
              <p class="font-semibold">
                {{ a.firstName }} {{ a.lastName }}
                <span v-if="a.isDefault" class="ml-1 rounded-full bg-secondary-container px-2 py-0.5 text-[11px] font-medium text-on-secondary-container">default</span>
              </p>
              <p class="mt-1 text-muted-foreground">{{ a.addressLine1 }}</p>
              <p v-if="a.addressLine2" class="text-muted-foreground">{{ a.addressLine2 }}</p>
              <p class="text-muted-foreground">{{ a.city }}, {{ a.state }}</p>
              <p class="mt-1 text-muted-foreground">{{ a.phone }}</p>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-full border border-border px-4 py-1.5 text-xs font-medium uppercase tracking-widest transition-colors hover:bg-secondary-container/60"
              @click="openAddressEdit(a)"
            >
              Edit
            </button>
            <button
              v-if="!a.isDefault"
              type="button"
              class="rounded-full border border-border px-4 py-1.5 text-xs font-medium uppercase tracking-widest transition-colors hover:bg-secondary-container/60"
              @click="makeDefault(a.id)"
            >
              Set default
            </button>
            <button
              type="button"
              class="rounded-full border border-error/50 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-error transition-colors hover:bg-error-container hover:text-on-error-container"
              @click="deleteAddress(a.id)"
            >
              {{ confirmDeleteAddress === a.id ? "Confirm?" : "Delete" }}
            </button>
          </div>
        </li>
      </ul>
      <p v-else class="m3-body-md mt-4 text-muted-foreground">No saved addresses yet — add one and checkout pre-fills it.</p>
    </section>

    <!-- Quick links -->
    <section aria-label="Quick links" class="mt-4 space-y-3">
      <NuxtLink
        v-for="l in links"
        :key="l.to + l.label"
        :to="l.to"
        class="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-shadow"
      >
        <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
          <M3Icon :name="l.icon" :size="22" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="m3-title-sm">{{ l.label }}</p>
          <p class="m3-body-sm mt-0.5 truncate text-muted-foreground">{{ l.text }}</p>
        </div>
        <M3Icon name="chevron_right" :size="20" class="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </NuxtLink>
    </section>

    <button
      type="button"
      class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-error/50 px-8 py-3.5 text-xs font-medium uppercase tracking-widest text-error transition-colors hover:bg-error-container hover:text-on-error-container sm:w-auto"
      @click="logout"
    >
      <M3Icon name="logout" :size="18" />
      Log out
    </button>

    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ editingId == null ? "Add address" : "Edit address" }}</DialogTitle>
        </DialogHeader>
        <div class="grid gap-3 py-2 sm:grid-cols-2">
          <div class="grid gap-1.5">
            <Label for="addr-first">First name *</Label>
            <Input id="addr-first" v-model="addressForm.firstName" autocomplete="given-name" />
          </div>
          <div class="grid gap-1.5">
            <Label for="addr-last">Last name *</Label>
            <Input id="addr-last" v-model="addressForm.lastName" autocomplete="family-name" />
          </div>
          <div class="grid gap-1.5 sm:col-span-2">
            <Label for="addr-phone">Phone *</Label>
            <Input id="addr-phone" v-model="addressForm.phone" inputmode="tel" autocomplete="tel" />
          </div>
          <div class="grid gap-1.5 sm:col-span-2">
            <Label for="addr-line1">Address *</Label>
            <Input id="addr-line1" v-model="addressForm.addressLine1" autocomplete="street-address" />
          </div>
          <div class="grid gap-1.5 sm:col-span-2">
            <Label for="addr-line2">Apartment, suite, landmark (optional)</Label>
            <Input id="addr-line2" v-model="addressForm.addressLine2" />
          </div>
          <div class="grid gap-1.5">
            <Label for="addr-city">City *</Label>
            <Input id="addr-city" v-model="addressForm.city" />
          </div>
          <div class="grid gap-1.5">
            <Label for="addr-state">State *</Label>
            <Input id="addr-state" v-model="addressForm.state" />
          </div>
          <div class="grid gap-1.5 sm:col-span-2">
            <Label for="addr-postal">Postal code (optional)</Label>
            <Input id="addr-postal" v-model="addressForm.postalCode" inputmode="numeric" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" :disabled="savingAddress" @click="dialogOpen = false">Cancel</Button>
          <Button :disabled="savingAddress" @click="saveAddress">{{ savingAddress ? "Saving…" : editingId == null ? "Save address" : "Save changes" }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
