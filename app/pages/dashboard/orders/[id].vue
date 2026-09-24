<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";
import OrderStatus from "@/components/custom/ecommerce/OrderStatus.vue";
import { toast } from "vue-sonner";
import { deliveryAddressLines } from "~~/shared/utils/orderDisplay";
import { canUserCancelOrder, isTerminalOrderStatus } from "~~/shared/utils/orderStatus";
import { assertGatewayUrl } from "~~/shared/utils/payments";
import { guestTokenForOrder } from "@/utils/guestOrderToken";

definePageMeta({ layout: "dashboard", middleware: "auth" });
// Guarded by middleware (server-safe via /api/auth/session) — no in-page
// session guard: $supabase is client-only (undefined on SSR).
const route = useRoute();

const { data: order, refresh } = await useAsyncData(`order-${route.params.id}`, () =>
  $fetch<{ order: any }>(`/api/orders/${route.params.id}`, { headers: useRequestHeaders(["cookie"]) }).then((r) => r.order).catch(() => null)
);

// Resume payment: unpaid + not terminal. Cancelling: same rule the server
// enforces (pending + unpaid), previewed here so dead buttons never show.
const canResumePay = computed(
  () =>
    ["pending", "failed"].includes(order.value?.paymentStatus) &&
    !isTerminalOrderStatus(order.value?.status)
);
const cancelCheck = computed(() =>
  canUserCancelOrder(order.value?.status, order.value?.paymentStatus)
);

const paying = ref(false);
const cancelling = ref(false);
const confirmCancel = ref(false);
watch(
  () => order.value?.id,
  () => {
    confirmCancel.value = false;
  }
);

async function resumePay() {
  const o = order.value;
  if (!o || paying.value) return;
  paying.value = true;
  try {
    const initPath =
      o.paymentMethod === "flutterwave"
        ? "/api/payments/flutterwave/initialize"
        : "/api/payments/paystack/initialize";
    const payment = await $fetch<{ authorization_url?: string; link?: string }>(initPath, {
      method: "POST",
      // No amount: the server prices from the order. Guest token only
      // exists same-tab (sessionStorage); logged-in buyers use session.
      body: {
        email: o.customerEmail,
        orderId: o.id,
        guestToken: guestTokenForOrder(o.id),
        customerName: o.customerName,
        customerPhone: o.customerPhone,
      },
    });
    const url = payment.authorization_url ?? payment.link;
    if (!url) throw new Error("Payment could not be started.");
    window.location.href = assertGatewayUrl(url);
  } catch (e: any) {
    if (e?.message === "bad-gateway-url") {
      toast.error("Payment could not be started. Try again.");
    } else {
      toast.error(e?.data?.statusMessage || e?.message || "Could not start payment.");
    }
  } finally {
    paying.value = false;
  }
}

async function cancelOrder() {
  const o = order.value;
  if (!o || cancelling.value) return;
  if (!confirmCancel.value) {
    confirmCancel.value = true;
    toast.info("Click again to confirm cancellation. This can't be undone.");
    return;
  }
  cancelling.value = true;
  try {
    await $fetch(`/api/orders/${o.id}/cancel`, {
      method: "POST",
      body: { guestToken: guestTokenForOrder(o.id) },
    });
    toast.success("Order cancelled.");
    confirmCancel.value = false;
    await refresh();
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || e?.message || "Could not cancel order.");
  } finally {
    cancelling.value = false;
  }
}

// Kitchen pipeline (mirrors shared/utils/orderStatus.ts). `cancelled` is a
// terminal branch rendered separately, never part of the timeline.
const PIPELINE = [
  { id: "pending", label: "Order received", text: "We've got your order.", icon: "receipt_long" },
  { id: "confirmed", label: "Confirmed", text: "Payment confirmed, grill warming up.", icon: "check_circle" },
  { id: "preparing", label: "On the fire", text: "Your BBQ is being grilled fresh.", icon: "cooking" },
  { id: "ready", label: "Ready", text: "Packed and ready for you.", icon: "takeout_dining" },
  { id: "completed", label: "Completed", text: "Enjoy every bite.", icon: "celebration" },
];

const stepIndex = computed(() => PIPELINE.findIndex((s) => s.id === order.value?.status));
const isCancelled = computed(() => order.value?.status === "cancelled");

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// delivery_address is stored raw (snake_case) — parsed in one place,
// see shared/utils/orderDisplay.ts.
const addressLines = computed(() => deliveryAddressLines(order.value?.deliveryAddress));
</script>

<template>
  <div>
    <NuxtLink to="/dashboard/orders" class="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline">
      <M3Icon name="arrow_back" :size="18" /> All orders
    </NuxtLink>

    <div v-if="order" class="mt-4">
      <!-- Header card -->
      <section class="overflow-hidden rounded-3xl border border-border bg-card">
        <div class="bg-primary-container p-6 text-on-primary-container sm:p-8">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="m3-label-lg uppercase tracking-[0.2em] opacity-80">Order</p>
              <h1 class="m3-headline-sm mt-1 break-all sm:m3-headline-md">{{ order.orderNumber }}</h1>
              <p class="m3-body-md mt-1 opacity-80">Placed {{ formatDateTime(order.createdAt) }}</p>
            </div>
            <div class="flex shrink-0 flex-wrap gap-2">
              <OrderStatus :status="order.status" />
              <OrderStatus :status="order.paymentStatus" />
            </div>
          </div>
        </div>

        <!-- Tracker timeline -->
        <div class="p-6 sm:p-8">
          <div v-if="isCancelled" class="flex items-center gap-4 rounded-2xl bg-error-container p-4 text-on-error-container">
            <span class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-error text-on-error">
              <M3Icon name="cancel" :size="24" />
            </span>
            <div>
              <p class="m3-title-sm">This order was cancelled</p>
              <p class="m3-body-sm mt-0.5 opacity-80">No charge was kept — reach out if you need help reordering.</p>
            </div>
          </div>
          <ol v-else class="space-y-0">
            <li v-for="(step, i) in PIPELINE" :key="step.id" class="relative flex gap-4 pb-7 last:pb-0">
              <span
                v-if="i < PIPELINE.length - 1"
                aria-hidden="true"
                class="absolute top-11 left-[22px] h-[calc(100%-2.75rem)] w-0.5 rounded-full"
                :class="i < stepIndex ? 'bg-primary' : 'bg-border'"
              />
              <span
                class="z-10 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                :class="i < stepIndex
                  ? 'bg-primary text-primary-foreground'
                  : i === stepIndex
                    ? 'bg-primary-container text-on-primary-container ring-2 ring-primary ring-offset-2 ring-offset-card'
                    : 'bg-muted text-muted-foreground'"
              >
                <M3Icon v-if="i < stepIndex" name="check" :size="22" />
                <M3Icon v-else :name="step.icon" :size="22" :filled="i === stepIndex" />
              </span>
              <div class="min-w-0 pt-1">
                <p class="m3-title-sm" :class="i <= stepIndex ? '' : 'text-muted-foreground'">{{ step.label }}</p>
                <p class="m3-body-sm mt-0.5 text-muted-foreground">{{ step.text }}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <div class="mt-4 grid gap-4 lg:grid-cols-2">
        <!-- Fulfillment -->
        <section class="rounded-3xl border border-border bg-card p-6">
          <h2 class="m3-title-md flex items-center gap-2">
            <M3Icon :name="order.fulfillmentType === 'delivery' ? 'local_shipping' : 'storefront'" :size="22" class="text-primary" />
            {{ order.fulfillmentType === "delivery" ? "Delivery details" : "Pickup details" }}
          </h2>
          <ul v-if="addressLines.length" class="m3-body-md mt-4 space-y-1 text-muted-foreground">
            <li v-for="line in addressLines" :key="line">{{ line }}</li>
          </ul>
          <p v-else-if="order.pickupTime" class="m3-body-md mt-4 text-muted-foreground">
            Pickup scheduled for {{ formatDateTime(order.pickupTime) }}.
          </p>
          <p v-else class="m3-body-md mt-4 text-muted-foreground">
            {{ order.fulfillmentType === "delivery" ? "Delivering to your address." : "Pickup from our kitchen." }}
          </p>
        </section>

        <!-- Payment -->
        <section class="rounded-3xl border border-border bg-card p-6">
          <h2 class="m3-title-md flex items-center gap-2">
            <M3Icon name="credit_card" :size="22" class="text-primary" />
            Payment
          </h2>
          <div class="mt-4 flex items-center justify-between gap-3">
            <p class="m3-body-md capitalize text-muted-foreground">{{ order.paymentMethod ?? "—" }}</p>
            <OrderStatus :status="order.paymentStatus" />
          </div>
          <button
            v-if="canResumePay"
            type="button"
            :disabled="paying"
            class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            @click="resumePay"
          >
            <M3Icon name="credit_card" :size="18" />
            {{ paying ? "Starting payment…" : "Complete payment" }}
          </button>
        </section>
      </div>

      <!-- Items -->
      <section class="mt-4 overflow-hidden rounded-3xl border border-border bg-card">
        <h2 class="m3-title-md flex items-center gap-2 p-6 pb-2">
          <M3Icon name="shopping_bag" :size="22" class="text-primary" />
          {{ (order.items ?? []).length }} item{{ (order.items ?? []).length === 1 ? "" : "s" }}
        </h2>
        <ul class="divide-y divide-border px-6">
          <li v-for="i in (order.items ?? [])" :key="i.id" class="flex items-center justify-between gap-3 py-4 text-sm">
            <div class="min-w-0">
              <p class="m3-title-sm truncate">{{ i.productName }}</p>
              <p class="m3-body-sm mt-0.5 truncate text-muted-foreground">{{ i.variantName }} × {{ i.quantity }}</p>
            </div>
            <span class="shrink-0 font-semibold">₦{{ Number(i.totalPrice).toLocaleString("en-NG") }}</span>
          </li>
        </ul>
        <div class="space-y-1.5 border-t border-border bg-muted/50 p-6 text-sm">
          <p class="flex justify-between"><span class="text-muted-foreground">Subtotal</span><span>₦{{ Number(order.subtotal ?? order.total).toLocaleString("en-NG") }}</span></p>
          <p class="flex justify-between"><span class="text-muted-foreground">Delivery</span><span>₦{{ Number(order.deliveryFee ?? 0).toLocaleString("en-NG") }}</span></p>
          <p class="m3-title-md flex justify-between pt-1"><span>Total</span><span>₦{{ Number(order.total).toLocaleString("en-NG") }}</span></p>
        </div>
      </section>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row">
        <NuxtLink to="/menu" class="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90">
          <M3Icon name="restaurant_menu" :size="18" />
          Order again
        </NuxtLink>
        <NuxtLink to="/contact" class="inline-flex items-center justify-center gap-2 rounded-full border border-border px-8 py-3.5 text-xs font-medium uppercase tracking-widest transition-colors hover:bg-secondary-container/60">
          Need help?
        </NuxtLink>
        <button
          v-if="cancelCheck.ok"
          type="button"
          :disabled="cancelling"
          class="inline-flex items-center justify-center gap-2 rounded-full border border-error/50 px-8 py-3.5 text-xs font-medium uppercase tracking-widest text-error transition-colors hover:bg-error-container hover:text-on-error-container disabled:opacity-50"
          @click="cancelOrder"
        >
          <M3Icon name="cancel" :size="18" />
          {{ cancelling ? "Cancelling…" : confirmCancel ? "Confirm cancel" : "Cancel order" }}
        </button>
      </div>
    </div>

    <div v-else class="mt-6 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <span class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
        <M3Icon name="search_off" :size="32" />
      </span>
      <p class="m3-title-md mt-4">Order not found</p>
      <p class="m3-body-md mt-1 text-muted-foreground">It may have been removed.</p>
      <NuxtLink to="/dashboard/orders" class="mt-6 inline-block rounded-full bg-primary px-8 py-3.5 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90">
        Back to orders
      </NuxtLink>
    </div>
  </div>
</template>
