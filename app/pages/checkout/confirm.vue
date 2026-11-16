<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";
import OrderStatus from "@/components/custom/ecommerce/OrderStatus.vue";
import { toast } from "vue-sonner";
import { guestTokenForOrder as guestTokenFor, saveGuestToken } from "@/utils/guestOrderToken";
import { canStartPayment, canUserCancelOrder } from "~~/shared/utils/orderStatus";
import { deliveryAddressLines, formatOrderDateTime } from "~~/shared/utils/orderDisplay";
import { formatNaira } from "~~/shared/utils/pricing";

/* Where buyers land after paying (gateway return) and where the email
   link sends guests. It doubles as the guest's order page: status,
   items, pay again, cancel. Webhooks are the only thing that marks an
   order paid; this page asks the provider for display and then watches
   the order until the webhook lands. */

useSeoMeta({ title: "Your order", robots: "noindex, nofollow" });

const { isLoggedIn } = useAuth();
const route = useRoute();
const router = useRouter();
const orderId = computed(() => (typeof route.query.order === "string" ? route.query.order : undefined));
// Paystack returns `reference`; Flutterwave returns `tx_ref` + `transaction_id` + `status`.
const gatewayRef = computed(() => (route.query.reference ?? route.query.tx_ref) as string | undefined);
const flwTransactionId = computed(() => route.query.transaction_id as string | undefined);
const flwStatus = computed(() => route.query.status as string | undefined);

type State = "loading" | "paid" | "waiting" | "unpaid" | "cancelled" | "missing";
const state = ref<State>("loading");
const order = ref<any>(null);
/** Provider confirmed the charge but our webhook hasn't recorded it yet. */
const providerSaysPaid = ref(false);

async function fetchOrder(id: string) {
  try {
    const token = guestTokenFor(id);
    const r = await $fetch<{ order: any }>(`/api/orders/${id}`, { query: token ? { token } : undefined });
    order.value = r.order;
    return r.order;
  } catch {
    return null;
  }
}

/* Ask the provider (display only). The answer must be about THIS order —
   paying for a cheap order must never show an expensive one as paid. */
async function providerPaid(current: any): Promise<boolean> {
  const provider = current?.paymentMethod ?? (flwTransactionId.value ? "flutterwave" : "paystack");
  try {
    if (provider === "flutterwave") {
      if (!flwTransactionId.value) return false;
      const r = await $fetch<{ paid: boolean; orderId: string }>("/api/payments/flutterwave/verify", {
        method: "POST",
        body: { transaction_id: flwTransactionId.value, guestToken: guestTokenFor(orderId.value) },
      });
      return r.paid === true && (!current || r.orderId === current.id);
    }
    if (!gatewayRef.value) return false;
    const r = await $fetch<{ paid: boolean; orderId: string }>("/api/payments/paystack/verify", {
      method: "POST",
      body: { reference: gatewayRef.value, guestToken: guestTokenFor(orderId.value) },
    });
    return r.paid === true && (!current || r.orderId === current.id);
  } catch {
    return false;
  }
}

function stateFor(o: any): State {
  if (!o) return "missing";
  if (o.paymentStatus === "paid" || o.paymentStatus === "refunded") return "paid";
  if (o.status === "cancelled") return "cancelled";
  return providerSaysPaid.value ? "waiting" : "unpaid";
}

/* After a successful charge the webhook usually lands within seconds.
   Re-read the order a few times so the page flips to "paid" by itself. */
let pollTimer: ReturnType<typeof setTimeout> | null = null;
function watchForWebhook(triesLeft = 10) {
  if (!orderId.value || triesLeft <= 0) return;
  pollTimer = setTimeout(async () => {
    const o = await fetchOrder(orderId.value!);
    if (o) state.value = stateFor(o);
    if (state.value === "waiting" || (state.value === "unpaid" && gatewayRef.value)) watchForWebhook(triesLeft - 1);
  }, 3000);
}
onBeforeUnmount(() => pollTimer && clearTimeout(pollTimer));

onMounted(async () => {
  // Email link carries the guest's order pass: save it, then drop it from
  // the address bar so it isn't left in history or shared by copy-paste.
  const linkToken = route.query.token;
  if (typeof linkToken === "string" && linkToken && orderId.value) {
    saveGuestToken(orderId.value, linkToken);
    const { token: _drop, ...rest } = route.query;
    router.replace({ query: rest });
  }
  if (!orderId.value) {
    state.value = "missing";
    return;
  }
  const current = await fetchOrder(orderId.value);
  if (current && current.paymentStatus !== "paid" && flwStatus.value !== "cancelled" && (gatewayRef.value || flwTransactionId.value)) {
    providerSaysPaid.value = await providerPaid(current);
  }
  state.value = stateFor(current);
  if (state.value === "waiting" || (state.value === "unpaid" && gatewayRef.value)) watchForWebhook();
});

// ---- actions
const { paying, payNow } = usePayOrder();
const canPay = computed(() => !!order.value && canStartPayment(order.value.status, order.value.paymentStatus).ok);
const canCancel = computed(() => !!order.value && canUserCancelOrder(order.value.status, order.value.paymentStatus).ok);
const confirmCancel = ref(false);
const cancelling = ref(false);

async function cancelOrder() {
  if (!order.value || cancelling.value) return;
  if (!confirmCancel.value) {
    confirmCancel.value = true;
    return;
  }
  cancelling.value = true;
  try {
    await $fetch(`/api/orders/${order.value.id}/cancel`, {
      method: "POST",
      body: { guestToken: guestTokenFor(order.value.id) },
    });
    toast.success("Order cancelled.");
    const o = await fetchOrder(order.value.id);
    state.value = stateFor(o);
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || "Could not cancel the order.");
  } finally {
    cancelling.value = false;
    confirmCancel.value = false;
  }
}

const addressLines = computed(() => deliveryAddressLines(order.value?.deliveryAddress));
const trackLink = computed(() => (isLoggedIn.value && order.value ? `/dashboard/orders/${order.value.id}` : null));

const hero = computed(() => {
  switch (state.value) {
    case "paid":
      return { icon: "check", tone: "bg-primary text-primary-foreground", kicker: "Payment confirmed", title: "Thank you! Your feast is on.", text: "We've got your order and the grill is warming up. A receipt is on its way to your email." };
    case "waiting":
      return { icon: "hourglass_top", tone: "bg-secondary-container text-on-secondary-container", kicker: "Payment received", title: "Confirming your order…", text: "Your payment went through. We're recording it now — this page updates by itself." };
    case "cancelled":
      return { icon: "cancel", tone: "bg-destructive/15 text-destructive", kicker: "Order cancelled", title: "This order was cancelled", text: "Nothing more to pay. You can start a new order any time." };
    case "missing":
      return { icon: "search_off", tone: "bg-secondary-container text-on-secondary-container", kicker: "Order", title: "We couldn't open this order", text: "Open it from the link in your confirmation email, or log in to the account you ordered with." };
    default:
      return flwStatus.value === "cancelled" || gatewayRef.value || flwTransactionId.value
        ? { icon: "credit_card_off", tone: "bg-destructive/15 text-destructive", kicker: "Payment not completed", title: "Your order is saved", text: "The payment didn't go through, so you weren't charged. You can pay now — no need to order again." }
        : { icon: "receipt_long", tone: "bg-secondary-container text-on-secondary-container", kicker: "Awaiting payment", title: "Your order is saved", text: "Pay to send it to the grill." };
  }
});
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 pt-24 pb-20 sm:pt-28 md:px-6">
    <div v-if="state === 'loading'" class="text-center" aria-live="polite">
      <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
        <M3Icon name="hourglass_top" :size="28" class="animate-pulse" />
      </span>
      <h1 class="m3-headline-md mt-6">Checking your order…</h1>
      <p class="m3-body-md mt-2 text-muted-foreground">This takes a moment. Don't close this page.</p>
    </div>

    <template v-else>
      <!-- Status hero -->
      <section class="text-center" aria-live="polite">
        <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full" :class="hero.tone">
          <M3Icon :name="hero.icon" :size="30" :class="state === 'waiting' ? 'animate-pulse' : ''" />
        </span>
        <p class="mt-6 text-xs font-medium uppercase tracking-[0.4em]" :class="hero.tone.includes('destructive') ? 'text-destructive' : 'text-primary'">{{ hero.kicker }}</p>
        <h1 class="m3-headline-md mt-2">{{ hero.title }}</h1>
        <p class="m3-body-md mx-auto mt-3 max-w-md text-muted-foreground">{{ hero.text }}</p>

        <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            v-if="canPay && state === 'unpaid'"
            type="button"
            :disabled="paying"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            @click="payNow(order)"
          >
            <M3Icon name="lock" :size="16" />
            {{ paying ? "Starting payment…" : `Pay ${formatNaira(Number(order.total))}` }}
          </button>
          <NuxtLink
            v-else
            to="/menu"
            class="rounded-full bg-primary px-8 py-3 text-center text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {{ state === "missing" ? "Browse the menu" : "Order more" }}
          </NuxtLink>
          <NuxtLink
            v-if="trackLink"
            :to="trackLink"
            class="rounded-full border border-border px-8 py-3 text-center text-xs font-medium uppercase tracking-widest transition-colors hover:bg-secondary-container/60"
          >
            Track in my account
          </NuxtLink>
          <NuxtLink
            v-else-if="state === 'missing'"
            :to="`/login?redirect=${encodeURIComponent('/dashboard/orders')}`"
            class="rounded-full border border-border px-8 py-3 text-center text-xs font-medium uppercase tracking-widest transition-colors hover:bg-secondary-container/60"
          >
            Log in
          </NuxtLink>
        </div>
      </section>

      <!-- Order card -->
      <section v-if="order" class="mt-10 overflow-hidden rounded-3xl border border-border bg-card" aria-label="Order details">
        <div class="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5 sm:p-6">
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Order</p>
            <p class="m3-title-lg mt-0.5 break-all">{{ order.orderNumber }}</p>
            <p class="m3-body-sm mt-0.5 text-muted-foreground">Placed {{ formatOrderDateTime(order.createdAt) }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <OrderStatus :status="order.status" />
            <OrderStatus kind="payment" :status="order.paymentStatus" :order-status="order.status" />
          </div>
        </div>

        <ul class="divide-y divide-border px-5 sm:px-6">
          <li v-for="i in order.items ?? []" :key="i.id" class="flex items-center justify-between gap-3 py-3 text-sm">
            <div class="min-w-0">
              <p class="truncate font-medium">{{ i.productName }}</p>
              <p class="text-muted-foreground">{{ i.variantName }} × {{ i.quantity }}</p>
            </div>
            <span class="shrink-0 tabular-nums">{{ formatNaira(Number(i.totalPrice)) }}</span>
          </li>
        </ul>

        <div class="space-y-1.5 border-t border-border bg-muted/40 p-5 text-sm sm:p-6">
          <p class="flex justify-between"><span class="text-muted-foreground">Subtotal</span><span class="tabular-nums">{{ formatNaira(Number(order.subtotal)) }}</span></p>
          <p class="flex justify-between">
            <span class="text-muted-foreground">{{ order.fulfillmentType === "pickup" ? "Pickup" : "Delivery" }}</span>
            <span class="tabular-nums">{{ Number(order.deliveryFee) ? formatNaira(Number(order.deliveryFee)) : "Free" }}</span>
          </p>
          <p class="flex justify-between pt-1 text-base font-bold"><span>Total</span><span class="tabular-nums">{{ formatNaira(Number(order.total)) }}</span></p>
        </div>

        <div class="grid gap-4 border-t border-border p-5 text-sm sm:grid-cols-2 sm:p-6">
          <div>
            <p class="flex items-center gap-1.5 font-medium">
              <M3Icon :name="order.fulfillmentType === 'pickup' ? 'storefront' : 'delivery_dining'" :size="18" class="text-primary" />
              {{ order.fulfillmentType === "pickup" ? "Pickup" : "Delivery to" }}
            </p>
            <p v-if="order.fulfillmentType === 'pickup'" class="mt-1 text-muted-foreground">{{ order.pickupTime ? formatOrderDateTime(order.pickupTime) : "Time to be confirmed" }}</p>
            <p v-for="line in addressLines" v-else :key="line" class="mt-1 text-muted-foreground">{{ line }}</p>
          </div>
          <div>
            <p class="flex items-center gap-1.5 font-medium"><M3Icon name="mail" :size="18" class="text-primary" /> Contact</p>
            <p class="mt-1 break-all text-muted-foreground">{{ order.customerEmail }}</p>
            <p class="text-muted-foreground">{{ order.customerPhone }}</p>
          </div>
        </div>

        <div v-if="canCancel" class="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5 sm:p-6">
          <p class="text-sm text-muted-foreground">{{ confirmCancel ? "Cancel this order? This can't be undone." : "Changed your mind?" }}</p>
          <div class="flex gap-2">
            <button v-if="confirmCancel" type="button" class="rounded-full border border-border px-5 py-2 text-xs font-medium uppercase tracking-widest" @click="confirmCancel = false">Keep it</button>
            <button
              type="button"
              :disabled="cancelling"
              class="rounded-full border border-destructive/50 px-5 py-2 text-xs font-medium uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              @click="cancelOrder"
            >
              {{ cancelling ? "Cancelling…" : confirmCancel ? "Yes, cancel" : "Cancel order" }}
            </button>
          </div>
        </div>
      </section>

      <p v-if="order && !isLoggedIn" class="m3-body-sm mt-6 text-center text-muted-foreground">
        Want your orders in one place?
        <NuxtLink
          :to="`/register?email=${encodeURIComponent(order.customerEmail)}&redirect=/dashboard/orders`"
          class="font-medium text-primary hover:underline"
        >Create an account with {{ order.customerEmail }}</NuxtLink>
        — this order moves in once you confirm your email.
      </p>
    </template>
  </div>
</template>
