<script setup lang="ts">
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNaira } from "~~/shared/utils/pricing";

definePageMeta({ layout: "admin", middleware: "admin" });

// Session comes from the admin middleware (single-flight) — no fetch here.

const requestHeaders = useRequestHeaders(["cookie"]);
const fee = ref("");
const current = ref<number | null>(null);
const loading = ref(true);
const saving = ref(false);

async function load() {
  loading.value = true;
  try {
    const headers = process.server ? requestHeaders : undefined;
    const data = await $fetch<{ deliveryFee: number }>("/api/admin/settings", { headers });
    current.value = data.deliveryFee;
    fee.value = String(data.deliveryFee);
  } catch {
    toast.error("Could not load settings.");
  } finally {
    loading.value = false;
  }
}

await useAsyncData("admin-settings", load);

async function save() {
  const naira = Math.round(Number(fee.value));
  if (!Number.isFinite(naira) || naira < 0 || naira > 100000) {
    toast.error("Enter a fee between ₦0 and ₦100,000.");
    return;
  }
  saving.value = true;
  try {
    const data = await $fetch<{ deliveryFee: number }>("/api/admin/settings", {
      method: "PUT",
      body: { deliveryFee: naira },
    });
    current.value = data.deliveryFee;
    fee.value = String(data.deliveryFee);
    toast.success(`Delivery fee is now ${formatNaira(data.deliveryFee)}. Checkout and new orders use it immediately.`);
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || "Could not save settings.");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
    <div>
      <h1 class="text-3xl font-bold">Settings</h1>
      <p class="mt-1 text-sm text-muted-foreground">Store configuration. Changes apply to checkout and new orders immediately; existing orders keep their priced totals.</p>
    </div>

    <section class="max-w-xl rounded-2xl border border-border bg-card p-5">
      <h2 class="text-sm font-semibold">Delivery fee</h2>
      <p v-if="loading" class="mt-2 text-sm text-muted-foreground">Loading…</p>
      <div v-else class="mt-3 grid gap-3">
        <p class="text-sm text-muted-foreground">
          Current: <span class="font-semibold text-foreground">{{ current == null ? "—" : formatNaira(current) }}</span>
          · pickup stays free.
        </p>
        <div class="grid gap-1.5">
          <Label for="delivery-fee">Fee in Naira</Label>
          <Input id="delivery-fee" v-model="fee" inputmode="numeric" placeholder="2000" />
        </div>
        <div>
          <Button :disabled="saving" @click="save">{{ saving ? "Saving…" : "Save fee" }}</Button>
        </div>
      </div>
    </section>
  </div>
</template>
