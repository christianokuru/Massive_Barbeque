<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";
import { guestTokenForOrder as guestTokenFor } from "@/utils/guestOrderToken";

useSeoMeta({ title: "Order confirmation", robots: "noindex, nofollow" });

const { isLoggedIn } = useAuth();
const route = useRoute();
const orderId = computed(() => route.query.order as string | undefined);
// Paystack returns `reference`; Flutterwave returns `tx_ref` + `transaction_id` + `status`.
const gatewayRef = computed(() => (route.query.reference ?? route.query.tx_ref) as string | undefined);
const flwTransactionId = computed(() => route.query.transaction_id as string | undefined);
const flwStatus = computed(() => route.query.status as string | undefined);

type State = "loading" | "verifying" | "paid" | "failed" | "received";
const state = ref<State>("loading");
const order = ref<any>(null);

// Guest proof for order reads: issued at order-create, kept in
// sessionStorage (survives the gateway round-trip in the same tab).
// Logged-in buyers don't need it — the session is their proof.
// (Shared helper — same-tab guest orders on the dashboard use it too.)

async function fetchOrder(id: string) {
  try {
    const token = guestTokenFor(id);
    const r = await $fetch<{ order: any }>(
      `/api/orders/${id}${token ? `?token=${encodeURIComponent(token)}` : ""}`,
    );
    order.value = r.order;
    return r.order;
  } catch {
    return null;
  }
}

/* Verify against the provider server-side. The response is bound to our
   order (reference + amount + currency + orderId checked server-side);
   the page additionally requires the verified orderId to match the
   order on screen — paying for a cheap order must never render an
   expensive one as "confirmed". */
async function verifyPayment(current: any) {
  const provider = current?.payment_method === "flutterwave" ? "flutterwave" : "paystack";
  try {
    if (provider === "flutterwave") {
      if (!flwTransactionId.value) return null;
      const r = await $fetch<{ paid: boolean; orderId: string; amount: number; currency: string }>(
        "/api/payments/flutterwave/verify",
        {
          method: "POST",
          body: {
            transaction_id: flwTransactionId.value,
            guestToken: guestTokenFor(orderId.value),
          },
        },
      );
      const bound = !current || r.orderId === current.id;
      return { paid: r.paid === true && bound, orderId: r.orderId };
    }
    if (!gatewayRef.value) return null;
    const r = await $fetch<{ paid: boolean; orderId: string; amount: number; currency: string }>(
      "/api/payments/paystack/verify",
      {
        method: "POST",
        body: { reference: gatewayRef.value, guestToken: guestTokenFor(orderId.value) },
      },
    );
    const bound = !current || r.orderId === current.id;
    return { paid: r.paid === true && bound, orderId: r.orderId };
  } catch {
    return { paid: false, orderId: current?.id };
  }
}

onMounted(async () => {
  // Explicit cancellation from the gateway — no need to verify.
  if (flwStatus.value === "cancelled") {
    state.value = "failed";
    if (orderId.value) await fetchOrder(orderId.value);
    return;
  }
  let current = orderId.value ? await fetchOrder(orderId.value) : null;
  if (gatewayRef.value || flwTransactionId.value) {
    state.value = "verifying";
    const result = await verifyPayment(current);
    if (result?.paid) {
      state.value = "paid";
      if (!current && result.orderId) current = await fetchOrder(String(result.orderId));
    } else {
      // Verify says not-paid (or errored): the order still exists and the
      // webhook may confirm late — show received, not a hard failure.
      state.value = current ? "received" : "failed";
    }
  } else {
    state.value = current ? "received" : "failed";
  }
});

const orderLabel = computed(() => order.value?.orderNumber ?? orderId.value ?? "");
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-20 sm:py-24 md:px-6">
    <!-- Verifying -->
    <div v-if="state === 'loading' || state === 'verifying'" class="text-center" aria-live="polite">
      <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
        <M3Icon name="hourglass_top" :size="28" class="animate-pulse" />
      </span>
      <h1 class="m3-headline-md mt-6">Confirming your payment…</h1>
      <p class="m3-body-md mt-2 text-muted-foreground">Checking with the payment provider. Don't close this page.</p>
    </div>

    <!-- Paid -->
    <div v-else-if="state === 'paid'" class="text-center">
      <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <M3Icon name="check" :size="30" />
      </span>
      <p class="mt-6 text-xs font-medium uppercase tracking-[0.4em] text-primary">Payment confirmed</p>
      <h1 class="m3-headline-md mt-2">Thank you! Your feast is on.</h1>
      <p class="m3-body-md mt-3 text-muted-foreground">
        <span v-if="orderLabel">Order <span class="font-semibold text-foreground">{{ orderLabel }}</span> is confirmed.</span>
        We'll confirm shortly by email/SMS.
      </p>
      <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <NuxtLink to="/menu" class="rounded-full bg-primary px-8 py-3 text-center text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90">Order more</NuxtLink>
        <NuxtLink to="/dashboard/orders" class="rounded-full border border-border px-8 py-3 text-center text-xs font-medium uppercase tracking-widest transition-colors hover:bg-secondary-container/60">Track order</NuxtLink>
      </div>
      <p v-if="!isLoggedIn && order?.customerEmail" class="m3-body-sm mt-4 text-muted-foreground">
        Want this in your account?
        <NuxtLink
          :to="`/register?email=${encodeURIComponent(order.customerEmail)}&redirect=/dashboard/orders`"
          class="font-medium text-primary hover:underline"
          >Create account with {{ order.customerEmail }}</NuxtLink
        >
        — it will appear automatically.
      </p>
    </div>

    <!-- Failed -->
    <div v-else-if="state === 'failed'" class="text-center">
      <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <M3Icon name="close" :size="30" />
      </span>
      <p class="mt-6 text-xs font-medium uppercase tracking-[0.4em] text-destructive">Payment not completed</p>
      <h1 class="m3-headline-md mt-2">No charge was made</h1>
      <p class="m3-body-md mt-3 text-muted-foreground">
        <span v-if="orderLabel">Order <span class="font-semibold text-foreground">{{ orderLabel }}</span> is still reserved.</span>
        Try payment again or pick a different method.
      </p>
      <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <NuxtLink to="/checkout" class="rounded-full bg-primary px-8 py-3 text-center text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90">Try again</NuxtLink>
        <NuxtLink to="/menu" class="rounded-full border border-border px-8 py-3 text-center text-xs font-medium uppercase tracking-widest transition-colors hover:bg-secondary-container/60">Back to menu</NuxtLink>
      </div>
    </div>

    <!-- Received (order exists, payment unverified) -->
    <div v-else class="text-center">
      <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
        <M3Icon name="receipt_long" :size="28" />
      </span>
      <p class="mt-6 text-xs font-medium uppercase tracking-[0.4em] text-primary">Order received</p>
      <h1 class="m3-headline-md mt-2">Thank you!</h1>
      <p class="m3-body-md mt-3 text-muted-foreground">
        <span v-if="orderLabel">Order <span class="font-semibold text-foreground">{{ orderLabel }}</span> is in.</span>
        <span v-if="gatewayRef">Payment reference: {{ gatewayRef }}.</span>
        If you completed payment, confirmation follows by email/SMS.
      </p>
      <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <NuxtLink to="/menu" class="rounded-full bg-primary px-8 py-3 text-center text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90">Order more</NuxtLink>
        <NuxtLink to="/dashboard/orders" class="rounded-full border border-border px-8 py-3 text-center text-xs font-medium uppercase tracking-widest transition-colors hover:bg-secondary-container/60">Track order</NuxtLink>
      </div>
      <p v-if="!isLoggedIn && order?.customerEmail" class="m3-body-sm mt-4 text-muted-foreground">
        Want this in your account?
        <NuxtLink
          :to="`/register?email=${encodeURIComponent(order.customerEmail)}&redirect=/dashboard/orders`"
          class="font-medium text-primary hover:underline"
          >Create account with {{ order.customerEmail }}</NuxtLink
        >
        — it will appear automatically.
      </p>
    </div>
  </div>
</template>
