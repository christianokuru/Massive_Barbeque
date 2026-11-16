<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";
import { assertGatewayUrl } from "~~/shared/utils/payments";
import { saveGuestToken } from "@/utils/guestOrderToken";
import { z } from "zod";

useSeoMeta({ title: "Checkout", robots: "noindex, nofollow" });

const { items, ready: cartReady, subtotal, clear, refresh } = useCart();
const { user, fetchSession } = useAuth();
// Signed-in buyers: the order always goes to their account email (the
// server forces it), so show it fixed instead of an editable field.
const accountEmail = ref("");
const cartNotice = ref("");

type Step = 1 | 2 | 3;
const step = ref<Step>(1);
const highestStep = ref<Step>(1);

const form = ref({
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  fulfillmentType: "delivery" as "delivery" | "pickup",
  paymentMethod: "paystack" as "paystack" | "flutterwave",
  notes: "",
  addressLine1: "",
  city: "Lagos",
  state: "Lagos",
  postalCode: "",
  // <input type="datetime-local"> value (buyer's local time), pickup only.
  pickupTime: "",
});
const error = ref("");
const placing = ref(false);

const deliveryFee = computed(() => form.value.fulfillmentType === "delivery" ? configuredFee.value : 0);
const total = computed(() => subtotal.value + deliveryFee.value);

const steps = [
  { n: 1 as Step, label: "Contact" },
  { n: 2 as Step, label: "Fulfillment" },
  { n: 3 as Step, label: "Payment" },
];

const contactSchema = z.object({
  customerName: z.string().min(1, "Enter your full name."),
  customerEmail: z.string().email("Enter a valid email."),
  customerPhone: z.string().min(7, "Enter a valid phone number."),
});

const methods = [
  {
    id: "paystack" as const,
    name: "Paystack",
    blurb: "Cards, bank transfers, USSD & more",
    note: "You'll be redirected to Paystack's secure checkout to pay.",
  },
  {
    id: "flutterwave" as const,
    name: "Flutterwave",
    blurb: "Cards, bank transfers & more",
    note: "You'll be redirected to Flutterwave's secure checkout to pay.",
  },
];

const activeMethod = computed(() => methods.find((m) => m.id === form.value.paymentMethod) ?? methods[0]);

function goTo(next: Step) {
  error.value = "";
  if (next <= highestStep.value) step.value = next;
}

function nextFromContact() {
  error.value = "";
  const parsed = contactSchema.safeParse(form.value);
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? "Check your contact details.";
    return;
  }
  step.value = 2;
  highestStep.value = 2;
}

function nextFromFulfillment() {
  error.value = "";
  if (form.value.fulfillmentType === "delivery" && !form.value.addressLine1.trim()) {
    error.value = "Enter a delivery address.";
    return;
  }
  if (form.value.fulfillmentType === "pickup") {
    const when = Date.parse(form.value.pickupTime);
    if (!Number.isFinite(when)) {
      error.value = "Choose a pickup time.";
      return;
    }
    if (when <= Date.now()) {
      error.value = "Pickup time must be in the future.";
      return;
    }
  }
  step.value = 3;
  highestStep.value = 3;
}

// Enter key / submit button runs the current step's action.
function onSubmit() {
  if (step.value === 1) nextFromContact();
  else if (step.value === 2) nextFromFulfillment();
  else placeOrder();
}

const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40";

const totalNaira = (n: number) => `₦${n.toLocaleString()}`;

// Earliest pickup the picker offers: now, in the buyer's local time
// (datetime-local wants "YYYY-MM-DDTHH:mm"). Set on mount to avoid an
// SSR/client time mismatch.
const minPickup = ref("");
function localInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Saved addresses: logged-in buyers get their default pre-filled into
// untouched fields (guests 401 here — silently skipped, manual entry).
// Runs once on mount; anything the buyer typed is never overwritten.
// Storefront fee: admin-set, falls back to the code constant on any
// failure (display only — the server reprices authoritatively).
const configuredFee = ref(DELIVERY_FEE_FLAT);

async function syncCart(force = false) {
  const r = await refresh(force);
  const note = cartChangeNotice(r);
  if (note) cartNotice.value = note;
  return r;
}

// Cart loads after hydration; sync it with the live menu once it has.
watch(cartReady, (r) => r && syncCart(true), { immediate: true });

onMounted(async () => {
  minPickup.value = localInputValue(new Date());
  const me = user.value ?? (await fetchSession());
  if (me?.email) {
    accountEmail.value = me.email;
    form.value.customerEmail = me.email;
    if (!form.value.customerName.trim() && me.user_metadata?.name) form.value.customerName = me.user_metadata.name;
  }
  try {
    const settings = await $fetch<{ deliveryFee: number }>("/api/settings/public");
    if (Number.isFinite(settings.deliveryFee) && settings.deliveryFee >= 0) {
      configuredFee.value = settings.deliveryFee;
    }
  } catch {
    // Constant stands in — checkout still works.
  }
  if (!me) return; // guests type their address
  try {
    const data = await $fetch<{ addresses: any[] }>("/api/addresses");
    const list = data.addresses ?? [];
    const primary = list.find((a) => a.isDefault) ?? list[0];
    if (!primary) return;
    if (!form.value.customerName.trim()) {
      form.value.customerName = [primary.firstName, primary.lastName].filter(Boolean).join(" ");
    }
    if (!form.value.customerPhone.trim() && primary.phone) form.value.customerPhone = primary.phone;
    if (!form.value.addressLine1.trim() && primary.addressLine1) {
      form.value.addressLine1 = primary.addressLine1;
    }
    if (primary.city) form.value.city = primary.city;
    if (primary.state) form.value.state = primary.state;
    if (!form.value.postalCode.trim() && primary.postalCode) {
      form.value.postalCode = primary.postalCode;
    }
  } catch {
    // Failed load — manual entry.
  }
});

// The order created by this checkout. If starting payment fails, "try
// again" reuses it (only retrying the payment) instead of creating a
// duplicate order. Any change to the cart or form starts a fresh order.
const placedOrder = ref<{ order: any; guestToken?: string; key: string } | null>(null);

function pickupIso(): string | undefined {
  if (form.value.fulfillmentType !== "pickup") return undefined;
  const when = Date.parse(form.value.pickupTime);
  return Number.isFinite(when) ? new Date(when).toISOString() : undefined;
}

async function placeOrder() {
  error.value = "";
  if (!items.value.length) {
    error.value = "Your cart is empty.";
    return;
  }
  if (form.value.fulfillmentType === "pickup") {
    const when = Date.parse(form.value.pickupTime);
    if (!Number.isFinite(when) || when <= Date.now()) {
      error.value = "Choose a pickup time in the future.";
      step.value = 2;
      return;
    }
  }
  placing.value = true;
  try {
    const orderKey = JSON.stringify({
      items: items.value.map((i) => [i.variantId, i.quantity]),
      form: form.value,
    });
    const reuse = placedOrder.value?.key === orderKey ? placedOrder.value : null;
    const order = reuse ?? await $fetch<{ order: any; guestToken?: string }>("/api/orders", {
      method: "POST",
      body: {
        // Ids + quantities only — the server prices from the database.
        items: items.value.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        fulfillmentType: form.value.fulfillmentType,
        customerEmail: form.value.customerEmail,
        customerName: form.value.customerName,
        customerPhone: form.value.customerPhone,
        deliveryAddress:
          form.value.fulfillmentType === "delivery"
            ? {
                firstName: form.value.customerName.split(" ")[0] ?? "",
                lastName: form.value.customerName.split(" ").slice(1).join(" ") || "-",
                phone: form.value.customerPhone,
                addressLine1: form.value.addressLine1,
                city: form.value.city,
                state: form.value.state,
                postalCode: form.value.postalCode || undefined,
              }
            : undefined,
        pickupTime: pickupIso(),
        notes: form.value.notes || undefined,
        paymentMethod: form.value.paymentMethod,
      },
    });
    placedOrder.value = { order: order.order, guestToken: order.guestToken, key: orderKey };
    // The server priced the order from the live menu. If that differs from
    // what the buyer saw, stop and show the real total before charging.
    const serverTotal = Number(order.order.total);
    if (!reuse && Number.isFinite(serverTotal) && Math.abs(serverTotal - total.value) > 0.005) {
      await syncCart(true);
      error.value = `Prices changed — your total is now ${totalNaira(serverTotal)}. Check your order, then tap Pay again.`;
      return;
    }
    // Don't clear the cart until payment init succeeds — if it fails,
    // the flow UI (and the error below) must stay visible.

    const isPaystack = form.value.paymentMethod === "paystack";
    // Guest orders need this token for every later step (order reads,
    // pay init/verify). Logged-in buyers don't get one — the session
    // is their proof. Kept in localStorage for the token's 30 days so it
    // survives the gateway round-trip in any tab.
    if (order.guestToken) saveGuestToken(order.order.id, order.guestToken);
    const payment = await $fetch<{ authorization_url?: string; link?: string }>(
      isPaystack ? "/api/payments/paystack/initialize" : "/api/payments/flutterwave/initialize",
      {
        method: "POST",
        // No `amount`: the server prices from the order (client money is
        // never trusted — sending it only invites future misuse).
        body: {
          email: form.value.customerEmail,
          orderId: order.order.id,
          guestToken: order.guestToken,
          customerName: form.value.customerName,
          customerPhone: form.value.customerPhone,
        },
      },
    );

    const url = (payment as any).authorization_url ?? (payment as any).link;
    if (!url) {
      // No gateway URL and no throw: order exists, cart stays for retry.
      error.value = "Payment could not be started. Your order is saved — try again.";
      return;
    }
    // Order is server-confirmed and the gateway URL is in hand —
    // the local cart has served its purpose.
    clear();
    window.location.href = assertGatewayUrl(url);
  } catch (e: any) {
    if (e?.message === "bad-gateway-url") {
      error.value = "Payment could not be started. Your order is saved — try again.";
    } else {
      error.value = e?.data?.statusMessage || e?.data?.message || e?.statusMessage || "Could not place order. Try again.";
      // A size was removed from the menu while it sat in the cart: drop it
      // and say which, so the buyer can review and retry.
      if (e?.statusCode === 400 && /no longer available/i.test(error.value)) await syncCart(true);
    }
  } finally {
    placing.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 pt-24 pb-20 sm:pt-28 md:px-6">
    <p class="text-xs font-medium uppercase tracking-[0.4em] text-primary">Checkout</p>
    <h1 class="m3-display-sm mt-3 md:m3-display-md">Almost there</h1>

    <!-- Cart is read after the page loads: hold its place until then -->
    <div v-if="!cartReady" class="mt-8 grid gap-8 md:grid-cols-[1fr_340px]" aria-label="Loading checkout">
      <div class="space-y-4">
        <div v-for="n in 3" :key="n" class="h-12 animate-pulse rounded-xl bg-muted" />
      </div>
      <div class="h-56 animate-pulse rounded-2xl bg-muted" />
    </div>

    <div v-else-if="!items.length" class="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <span class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
        <M3Icon name="shopping_cart" :size="24" />
      </span>
      <p class="mt-4 font-medium">Your cart is empty</p>
      <p v-if="cartNotice" class="mt-1 max-w-md text-sm text-muted-foreground">{{ cartNotice }}</p>
      <p v-else class="mt-1 text-sm text-muted-foreground">Pick something hot off the grill first.</p>
      <NuxtLink to="/menu" class="mt-5 rounded-full bg-primary px-6 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-primary-foreground transition-colors hover:bg-primary/90">
        Browse the menu
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Stepper -->
      <ol class="mt-8 flex items-center gap-1 sm:gap-2" aria-label="Checkout steps">
        <li v-for="(s, i) in steps" :key="s.n" class="flex flex-1 items-center gap-1 sm:gap-2">
          <button
            type="button"
            :disabled="s.n > highestStep"
            :aria-current="step === s.n ? 'step' : undefined"
            class="flex min-h-10 flex-1 items-center gap-2 rounded-full px-2 py-1.5 text-left transition-colors disabled:cursor-default sm:px-3"
            :class="step === s.n ? 'bg-secondary-container/60' : ''"
            @click="goTo(s.n)"
          >
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              :class="s.n < step ? 'bg-primary text-primary-foreground' : s.n === step ? 'bg-primary text-primary-foreground' : s.n <= highestStep ? 'border border-primary text-primary' : 'border border-border text-muted-foreground'"
            >
              <M3Icon v-if="s.n < step" name="check" :size="16" />
              <template v-else>{{ s.n }}</template>
            </span>
            <span class="text-[11px] font-medium tracking-[0.1em] uppercase sm:text-xs" :class="[step === s.n ? 'text-foreground' : 'text-muted-foreground', step === s.n ? 'inline' : 'hidden sm:inline']">
              {{ s.label }}
            </span>
          </button>
          <span v-if="i < steps.length - 1" class="h-px flex-1 bg-border" aria-hidden="true" />
        </li>
      </ol>

      <p v-if="cartNotice" role="status" class="mt-6 rounded-xl bg-secondary-container/60 px-4 py-3 text-sm text-on-secondary-container">{{ cartNotice }}</p>

      <div class="mt-6 grid items-start gap-8 md:grid-cols-[1fr_340px]">
        <form novalidate @submit.prevent="onSubmit">
          <!-- Step 1: Contact -->
          <section v-if="step === 1" aria-label="Contact details" class="space-y-4">
            <label class="block">
              <span class="mb-1.5 block text-sm font-medium">Full name</span>
              <input v-model="form.customerName" required autocomplete="name" placeholder="Adaeze Okafor" :class="inputClass" />
            </label>
            <div v-if="accountEmail" class="rounded-xl border border-border bg-muted/40 px-4 py-3">
              <span class="block text-sm font-medium">Email</span>
              <span class="mt-0.5 block text-sm text-muted-foreground">{{ accountEmail }} · your account email</span>
            </div>
            <label v-else class="block">
              <span class="mb-1.5 block text-sm font-medium">Email</span>
              <input v-model="form.customerEmail" type="email" required autocomplete="email" inputmode="email" placeholder="you@example.com" :class="inputClass" />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-sm font-medium">Phone</span>
              <input v-model="form.customerPhone" type="tel" required autocomplete="tel" inputmode="tel" placeholder="0803 000 0000" :class="inputClass" />
            </label>
            <p class="text-xs text-muted-foreground">
              Your receipt and order updates go here.
              <template v-if="!accountEmail">
                Have an account? <NuxtLink to="/login?redirect=/checkout" class="font-medium text-primary hover:underline">Log in</NuxtLink> to save your details.
              </template>
            </p>
          </section>

          <!-- Step 2: Fulfillment -->
          <section v-if="step === 2" aria-label="Fulfillment" class="space-y-4">
            <div class="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Delivery or pickup">
              <button
                v-for="opt in [
                  { id: 'delivery', icon: 'delivery_dining', title: 'Delivery', text: `+₦${configuredFee.toLocaleString()} · across Lagos` },
                  { id: 'pickup', icon: 'storefront', title: 'Pickup', text: 'Free · ready fresh' },
                ]"
                :key="opt.id"
                type="button"
                role="radio"
                :aria-checked="form.fulfillmentType === opt.id"
                class="rounded-2xl border p-4 text-left transition-colors"
                :class="form.fulfillmentType === opt.id ? 'border-primary bg-secondary-container/60' : 'border-border bg-card hover:border-primary/50'"
                @click="form.fulfillmentType = opt.id as 'delivery' | 'pickup'"
              >
                <M3Icon :name="opt.icon" :size="22" class="text-primary" />
                <span class="mt-2 block font-semibold">{{ opt.title }}</span>
                <span class="mt-0.5 block text-xs text-muted-foreground sm:text-sm">{{ opt.text }}</span>
              </button>
            </div>
            <label v-if="form.fulfillmentType === 'pickup'" class="block">
              <span class="mb-1.5 block text-sm font-medium">Pickup time</span>
              <input v-model="form.pickupTime" type="datetime-local" required :min="minPickup" :class="inputClass" />
              <span class="mt-1 block text-xs text-muted-foreground">When you'll collect your order.</span>
            </label>
            <div v-if="form.fulfillmentType === 'delivery'" class="grid gap-4">
              <label class="block">
                <span class="mb-1.5 block text-sm font-medium">Delivery address</span>
                <input v-model="form.addressLine1" required autocomplete="street-address" placeholder="House number, street, area" :class="inputClass" />
              </label>
              <div class="grid grid-cols-2 gap-4">
                <label class="block">
                  <span class="mb-1.5 block text-sm font-medium">City</span>
                  <input v-model="form.city" autocomplete="address-level2" :class="inputClass" />
                </label>
                <label class="block">
                  <span class="mb-1.5 block text-sm font-medium">State</span>
                  <input v-model="form.state" autocomplete="address-level1" :class="inputClass" />
                </label>
              </div>
            </div>
          </section>

          <!-- Step 3: Payment -->
          <section v-if="step === 3" aria-label="Payment" class="space-y-4">
            <div class="grid gap-3" role="radiogroup" aria-label="Payment method">
              <button
                v-for="m in methods"
                :key="m.id"
                type="button"
                role="radio"
                :aria-checked="form.paymentMethod === m.id"
                class="rounded-2xl border p-4 text-left transition-colors"
                :class="form.paymentMethod === m.id ? 'border-primary bg-secondary-container/60' : 'border-border bg-card hover:border-primary/50'"
                @click="form.paymentMethod = m.id"
              >
                <span class="flex items-center justify-between gap-2">
                  <span class="font-serif text-lg font-semibold">{{ m.name }}</span>
                  <span
                    class="flex h-5 w-5 items-center justify-center rounded-full border"
                    :class="form.paymentMethod === m.id ? 'border-primary' : 'border-border'"
                    aria-hidden="true"
                  >
                    <span v-if="form.paymentMethod === m.id" class="h-2.5 w-2.5 rounded-full bg-primary" />
                  </span>
                </span>
                <span class="mt-1 block text-sm text-muted-foreground">{{ m.blurb }}</span>
              </button>
            </div>
            <p class="flex items-start gap-2 rounded-xl bg-muted px-4 py-3 text-xs text-muted-foreground">
              <M3Icon name="lock" :size="16" class="mt-px shrink-0" />
              {{ activeMethod.note }}
            </p>
            <label class="block">
              <span class="mb-1.5 block text-sm font-medium">Notes <span class="font-normal text-muted-foreground">(optional)</span></span>
              <textarea v-model="form.notes" rows="2" maxlength="2000" placeholder="Gate directions, spice level…" :class="inputClass" />
            </label>
          </section>

          <p v-if="error" role="alert" class="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{{ error }}</p>

          <div class="mt-6 flex gap-3">
            <button
              v-if="step > 1"
              type="button"
              class="rounded-full border border-border px-6 py-3 text-xs font-medium uppercase tracking-widest transition-colors hover:bg-secondary-container/60"
              @click="goTo((step - 1) as 1 | 2)"
            >
              Back
            </button>
            <button
              type="submit"
              :disabled="placing"
              class="flex-1 rounded-full bg-primary px-6 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <template v-if="step < 3">Continue</template>
              <template v-else>{{ placing ? "Starting payment…" : `Pay ${totalNaira(total)}` }}</template>
            </button>
          </div>
        </form>

        <!-- Summary -->
        <aside class="rounded-2xl border border-border bg-card p-5 md:sticky md:top-24" aria-label="Order summary">
          <div class="flex items-center justify-between">
            <h2 class="font-serif text-lg font-semibold">Order summary</h2>
            <NuxtLink to="/menu" class="text-xs font-medium text-primary hover:underline">Add more</NuxtLink>
          </div>
          <ul class="mt-4 space-y-3 text-sm">
            <li v-for="i in items" :key="i.id" class="flex items-center gap-3">
              <span class="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                <img v-if="i.imageUrl" :src="i.imageUrl" :alt="i.name" class="h-full w-full object-cover" />
                <M3Icon v-else name="restaurant" :size="18" class="text-muted-foreground" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate font-medium">{{ i.name }}</span>
                <span class="block text-xs text-muted-foreground">{{ i.variantName }} × {{ i.quantity }}</span>
              </span>
              <span class="shrink-0 tabular-nums">{{ totalNaira(Number(i.price) * i.quantity) }}</span>
            </li>
          </ul>
          <div class="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
            <p class="flex justify-between"><span class="text-muted-foreground">Subtotal</span><span class="tabular-nums">{{ totalNaira(subtotal) }}</span></p>
            <p class="flex justify-between">
              <span class="text-muted-foreground">{{ form.fulfillmentType === "pickup" ? "Pickup" : "Delivery" }}</span>
              <span class="tabular-nums">{{ deliveryFee ? totalNaira(deliveryFee) : "Free" }}</span>
            </p>
            <p class="flex justify-between pt-1 text-base font-bold"><span>Total</span><span class="tabular-nums">{{ totalNaira(total) }}</span></p>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
