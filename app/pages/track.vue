<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";
import OrderStatus from "@/components/custom/ecommerce/OrderStatus.vue";
import { guestTokenForOrder, savedGuestOrderIds } from "@/utils/guestOrderToken";
import { formatOrderDateTime } from "~~/shared/utils/orderDisplay";
import { formatNaira } from "~~/shared/utils/pricing";

/* "Track order" for everyone. Account holders go to their dashboard.
   Guests see the orders placed from this device (their order pass is
   saved here at checkout); other guest orders open from the link in the
   confirmation email. Nothing is looked up by email or order number, so
   strangers can't browse other people's orders. */

useSeoMeta({ title: "Track your order", robots: "noindex, nofollow" });

const { user, fetchSession } = useAuth();
const loading = ref(true);
const orders = ref<any[]>([]);

onMounted(async () => {
  const me = user.value ?? (await fetchSession());
  if (me) {
    await navigateTo("/dashboard/orders", { replace: true });
    return;
  }
  const ids = savedGuestOrderIds();
  const results = await Promise.all(
    ids.map((id) =>
      $fetch<{ order: any }>(`/api/orders/${id}`, { query: { token: guestTokenForOrder(id) } })
        .then((r) => r.order)
        .catch(() => null),
    ),
  );
  orders.value = results.filter(Boolean).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  loading.value = false;
});
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 pt-24 pb-20 sm:pt-28 md:px-6">
    <p class="text-xs font-medium uppercase tracking-[0.4em] text-primary">Track order</p>
    <h1 class="m3-display-sm mt-3">Where's my BBQ?</h1>

    <div v-if="loading" class="mt-8 space-y-3" aria-label="Loading orders">
      <div v-for="n in 2" :key="n" class="h-24 animate-pulse rounded-2xl bg-muted" />
    </div>

    <template v-else>
      <p class="m3-body-md mt-3 text-muted-foreground">
        {{ orders.length ? "Orders placed from this device:" : "No orders from this device yet." }}
      </p>

      <ul v-if="orders.length" class="mt-6 space-y-3">
        <li v-for="o in orders" :key="o.id">
          <NuxtLink
            :to="`/checkout/confirm?order=${o.id}`"
            class="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary"
          >
            <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <M3Icon name="receipt_long" :size="22" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block font-semibold">{{ o.orderNumber }}</span>
              <span class="block text-sm text-muted-foreground">{{ formatOrderDateTime(o.createdAt) }} · {{ formatNaira(Number(o.total)) }}</span>
              <span class="mt-1.5 flex flex-wrap gap-1.5">
                <OrderStatus :status="o.status" />
                <OrderStatus kind="payment" :status="o.paymentStatus" :order-status="o.status" />
              </span>
            </span>
            <M3Icon name="chevron_right" :size="22" class="shrink-0 text-muted-foreground" />
          </NuxtLink>
        </li>
      </ul>

      <div class="mt-8 grid gap-3 sm:grid-cols-2">
        <div class="rounded-2xl border border-border bg-card p-5">
          <M3Icon name="mail" :size="22" class="text-primary" />
          <p class="mt-2 font-semibold">Ordered on another device?</p>
          <p class="mt-1 text-sm text-muted-foreground">Open the link in your order confirmation email.</p>
        </div>
        <div class="rounded-2xl border border-border bg-card p-5">
          <M3Icon name="person" :size="22" class="text-primary" />
          <p class="mt-2 font-semibold">Have an account?</p>
          <p class="mt-1 text-sm text-muted-foreground">
            <NuxtLink to="/login?redirect=/dashboard/orders" class="font-medium text-primary hover:underline">Log in</NuxtLink>
            to see every order in one place.
          </p>
        </div>
      </div>
      <p class="mt-6 text-sm text-muted-foreground">
        Still stuck? <NuxtLink to="/contact" class="font-medium text-primary hover:underline">Contact us</NuxtLink> with your order number.
      </p>
    </template>
  </div>
</template>
