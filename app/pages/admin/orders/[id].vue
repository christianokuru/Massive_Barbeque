<script setup lang="ts">
import { toast } from "vue-sonner";
import OrderStatus from "@/components/custom/ecommerce/OrderStatus.vue";
import { ADMIN_EDITABLE_PAYMENT_STATUSES, legalNextStatuses } from "~~/shared/utils/orderStatus";
import { deliveryAddressLines, formatOrderDateTime } from "~~/shared/utils/orderDisplay";
import { formatNaira } from "~~/shared/utils/pricing";
definePageMeta({ layout: "admin", middleware: "admin" });
const route = useRoute();
// Session comes from the admin middleware (single-flight) — no fetch here.
const requestHeaders = useRequestHeaders(["cookie"]);
const { data: order, refresh } = await useAsyncData(`admin-order-${route.params.id}`, () =>
  $fetch<{ order: any }>(`/api/orders/${route.params.id}`, { headers: requestHeaders }).then((r) => r.order).catch(() => null)
);
const status = ref("confirmed");
const paymentStatus = ref("paid");
const saving = ref(false);

// Dropdowns derive from the shared pipeline truth — the server enforces
// the same lists, so an option shown here can never 400 there. Falls back
// to the current state if the pipeline ever gains a state this build
// doesn't know (the select must never render empty).
const availableStatuses = computed(() => {
  if (!order.value) return [];
  const legal = [...legalNextStatuses(order.value.status)];
  return legal.length ? legal : [order.value.status];
});
// `paid` is webhook-only: shown as a locked badge, never an option.
const paymentLocked = computed(() => order.value?.paymentStatus === "paid");
const paymentOptions = computed(() =>
  paymentLocked.value ? ["paid"] : [...ADMIN_EDITABLE_PAYMENT_STATUSES]
);
// Read-only display derivations (never sent back to the API).
const isDelivery = computed(() => order.value?.fulfillmentType === "delivery");
const placedAt = computed(() => formatOrderDateTime(order.value?.createdAt));
const addressLines = computed(() => deliveryAddressLines(order.value?.deliveryAddress));
const payments = computed(() => order.value?.payments ?? []);
watchEffect(() => {
  if (order.value) {
    status.value = order.value.status;
    paymentStatus.value = order.value.paymentStatus;
  }
});
async function save() {
  saving.value = true;
  try {
    await $fetch(`/api/admin/orders/${route.params.id}/status`, {
      method: "PUT",
      body: { status: status.value, paymentStatus: paymentStatus.value },
    });
    toast.success(`Order moved to ${status.value}.`);
    await refresh();
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || e?.message || "Could not update order.");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
    <NuxtLink to="/admin/orders" class="text-sm text-muted-foreground hover:underline">← All orders</NuxtLink>
    <div v-if="order" class="flex flex-col gap-4">
      <!-- Header: identity + state at a glance -->
      <section class="rounded-xl border border-border bg-card p-5 sm:p-6">
        <p class="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Order</p>
        <h1 class="mt-1 break-all text-2xl font-bold sm:text-3xl">{{ order.orderNumber }}</h1>
        <p class="mt-1 text-sm text-muted-foreground">Placed {{ placedAt }} · {{ isDelivery ? "Delivery" : "Pickup" }}</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <OrderStatus :status="order.status" />
          <OrderStatus :status="order.paymentStatus" />
        </div>
        <dl class="mt-4 grid gap-2 border-t border-border pt-4 text-sm sm:grid-cols-3">
          <div>
            <dt class="text-xs uppercase tracking-wider text-muted-foreground">Customer</dt>
            <dd class="mt-0.5 font-medium">{{ order.customerName || "—" }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wider text-muted-foreground">Email</dt>
            <dd class="mt-0.5 break-all">{{ order.customerEmail || "—" }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wider text-muted-foreground">Phone</dt>
            <dd class="mt-0.5">{{ order.customerPhone || "—" }}</dd>
          </div>
        </dl>
      </section>

      <div class="grid gap-4 lg:grid-cols-2">
        <!-- Fulfillment: where the food goes -->
        <section class="rounded-xl border border-border bg-card p-5">
          <h2 class="text-sm font-semibold">{{ isDelivery ? "Delivery address" : "Pickup" }}</h2>
          <ul v-if="isDelivery && addressLines.length" class="mt-3 space-y-1 text-sm text-muted-foreground">
            <li v-for="line in addressLines" :key="line">{{ line }}</li>
          </ul>
          <p v-else-if="isDelivery" class="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            No delivery address on this delivery order — contact the customer before dispatch.
          </p>
          <p v-else-if="order.pickupTime" class="mt-3 text-sm text-muted-foreground">
            Scheduled pickup: {{ formatOrderDateTime(order.pickupTime) }}.
          </p>
          <p v-else class="mt-3 text-sm text-muted-foreground">Pickup from the kitchen (no time scheduled).</p>
          <div v-if="order.notes" class="mt-4 border-t border-border pt-3">
            <h3 class="text-xs uppercase tracking-wider text-muted-foreground">Customer notes</h3>
            <p class="mt-1 text-sm">{{ order.notes }}</p>
          </div>
        </section>

        <!-- Payment: what money did -->
        <section class="rounded-xl border border-border bg-card p-5">
          <h2 class="text-sm font-semibold">Payment</h2>
          <div class="mt-3 flex items-center justify-between gap-3 text-sm">
            <span class="capitalize text-muted-foreground">{{ order.paymentMethod ?? "—" }}</span>
            <OrderStatus :status="order.paymentStatus" />
          </div>
          <div v-if="payments.length" class="mt-3 space-y-2 border-t border-border pt-3">
            <div v-for="p in payments" :key="p.id" class="rounded-lg bg-muted/60 px-3 py-2 text-xs">
              <p class="flex items-center justify-between gap-2">
                <span class="min-w-0 flex-1 break-all font-mono">{{ p.reference }}</span>
                <OrderStatus :status="p.status" />
              </p>
              <p class="mt-1 text-muted-foreground">
                {{ p.provider }} · {{ formatNaira(Number(p.amount || 0)) }} {{ p.currency || "NGN" }}
                <span v-if="p.paidAt"> · paid {{ formatOrderDateTime(p.paidAt) }}</span>
              </p>
            </div>
          </div>
          <p v-else class="mt-3 text-sm text-muted-foreground">No payment attempts recorded yet.</p>
        </section>
      </div>

      <!-- Items + money -->
      <section class="overflow-hidden rounded-xl border border-border bg-card">
        <h2 class="p-5 pb-2 text-sm font-semibold">Items ({{ (order.items ?? []).length }})</h2>
        <ul class="divide-y divide-border px-5">
          <li v-for="i in (order.items ?? [])" :key="i.id" class="flex items-center justify-between gap-3 py-3 text-sm">
            <div class="min-w-0">
              <p class="truncate font-medium">{{ i.productName }}</p>
              <p class="mt-0.5 truncate text-xs text-muted-foreground">{{ i.variantName }} × {{ i.quantity }}</p>
            </div>
            <span class="shrink-0 font-semibold tabular-nums">{{ formatNaira(Number(i.totalPrice || 0)) }}</span>
          </li>
        </ul>
        <div class="space-y-1.5 border-t border-border bg-muted/50 p-5 text-sm">
          <p class="flex justify-between"><span class="text-muted-foreground">Subtotal</span><span class="tabular-nums">{{ formatNaira(Number(order.subtotal ?? order.total)) }}</span></p>
          <p class="flex justify-between"><span class="text-muted-foreground">Delivery fee</span><span class="tabular-nums">{{ formatNaira(Number(order.deliveryFee ?? 0)) }}</span></p>
          <p class="flex justify-between pt-1 text-base font-semibold"><span>Total</span><span class="tabular-nums">{{ formatNaira(Number(order.total)) }}</span></p>
        </div>
      </section>

      <!-- Actions: move the order down the pipeline -->
      <section class="rounded-xl border border-border bg-card p-5">
        <h2 class="text-sm font-semibold">Update status</h2>
        <p class="mt-1 text-xs text-muted-foreground">Orders move forward only — confirmed → preparing → ready → completed. Only the steps allowed from “{{ order.status }}” are listed.</p>
        <div class="mt-4 flex flex-wrap items-end gap-3">
          <div class="grid gap-1.5">
            <label for="admin-order-status" class="text-xs font-medium text-muted-foreground">Order status</label>
            <select id="admin-order-status" v-model="status" class="rounded border border-border bg-background px-3 py-2 text-sm">
              <option v-for="s in availableStatuses" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="grid gap-1.5">
            <label for="admin-order-payment" class="text-xs font-medium text-muted-foreground">Payment status</label>
            <select id="admin-order-payment" v-model="paymentStatus" :disabled="paymentLocked" class="rounded border border-border bg-background px-3 py-2 text-sm disabled:opacity-60" :title="paymentLocked ? 'Paid is set by payment webhooks only' : undefined">
              <option v-for="p in paymentOptions" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <button :disabled="saving" class="rounded bg-primary px-5 py-2 text-sm text-primary-foreground disabled:opacity-50" @click="save">{{ saving ? "Saving…" : "Update status" }}</button>
        </div>
        <p v-if="paymentLocked" class="mt-2 text-xs text-muted-foreground">Paid is set by payment webhooks only — recording a refund happens with your payment provider, not here.</p>
      </section>
    </div>
    <p v-else class="text-muted-foreground">Order not found.</p>
  </div>
</template>
