<script setup lang="ts">
import { z } from "zod";

useSeoMeta({ title: "Checkout", robots: "noindex, nofollow" });

const { items, subtotal, clear } = useCart();

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
});
const error = ref("");
const placing = ref(false);

const deliveryFee = computed(() => deliveryFeeFor(form.value.fulfillmentType));
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
  step.value = 3;
  highestStep.value = 3;
}

const totalNaira = (n: number) => `₦${n.toLocaleString()}`;

// Gateway hosts we will redirect to — anything else is rejected
// (a compromised/malicious init response can't bounce the buyer away).
const GATEWAY_HOSTS = new Set([
  "checkout.paystack.com",
  "paystack.com",
  "checkout.flutterwave.com",
  "flutterwave.com",
]);

function assertGatewayUrl(url: string): string {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    throw new Error("bad-gateway-url");
  }
  if (!GATEWAY_HOSTS.has(host)) throw new Error("bad-gateway-url");
  return url;
}

async function placeOrder() {
  error.value = "";
  if (!items.value.length) {
    error.value = "Your cart is empty.";
    return;
  }
  placing.value = true;
  try {
    const order = await $fetch<{ order: any; guestToken?: string }>("/api/orders", {
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
        notes: form.value.notes || undefined,
        paymentMethod: form.value.paymentMethod,
      },
    });
    // Don't clear the cart until payment init succeeds — if it fails,
    // the flow UI (and the error below) must stay visible.

    const isPaystack = form.value.paymentMethod === "paystack";
    // Guest orders need this token for every later step (order reads,
    // pay init/verify). Logged-in buyers don't get one — the session
    // is their proof. sessionStorage survives the gateway round-trip
    // in the same tab.
    if (order.guestToken) {
      try {
        sessionStorage.setItem(`mb:guest:${order.order.id}`, order.guestToken);
      } catch {
        // Private-mode storage failure: the confirm page will show the
        // order as not found for guests — acceptable, no crash.
      }
    }
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
    }
  } finally {
    placing.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-20 sm:py-24 md:px-6">
    <p class="text-xs font-medium uppercase tracking-[0.4em] text-primary">Checkout</p>
    <h1 class="m3-display-sm mt-3 md:m3-display-md">Almost there</h1>

    <div v-if="!items.length" class="mt-6 text-muted-foreground">
      Your cart is empty. <NuxtLink to="/menu" class="text-primary hover:underline">Browse the menu</NuxtLink>
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
              :class="s.n <= step ? 'bg-primary text-primary-foreground' : s.n <= highestStep ? 'border border-primary text-primary' : 'border border-border text-muted-foreground'"
            >
              {{ s.n }}
            </span>
            <span class="hidden text-xs font-medium tracking-[0.1em] uppercase sm:inline" :class="step === s.n ? 'text-foreground' : 'text-muted-foreground'">
              {{ s.label }}
            </span>
          </button>
          <span v-if="i < steps.length - 1" class="h-px flex-1 bg-border" aria-hidden="true" />
        </li>
      </ol>

      <div class="mt-6 grid items-start gap-8 md:grid-cols-[1fr_320px]">
        <div>
          <!-- Step 1: Contact -->
          <section v-if="step === 1" aria-label="Contact details" class="space-y-4">
            <label class="block">
              <span class="mb-1 block text-sm font-medium">Full name *</span>
              <input v-model="form.customerName" required autocomplete="name" class="w-full rounded-xl border border-border bg-card px-4 py-2.5 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
            </label>
            <label class="block">
              <span class="mb-1 block text-sm font-medium">Email *</span>
              <input v-model="form.customerEmail" type="email" required autocomplete="email" placeholder="you@example.com" class="w-full rounded-xl border border-border bg-card px-4 py-2.5 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
            </label>
            <label class="block">
              <span class="mb-1 block text-sm font-medium">Phone *</span>
              <input v-model="form.customerPhone" type="tel" required autocomplete="tel" placeholder="0803 000 0000" class="w-full rounded-xl border border-border bg-card px-4 py-2.5 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
            </label>
            <p class="text-xs text-muted-foreground">Order updates and receipt go here.</p>
          </section>

          <!-- Step 2: Fulfillment -->
          <section v-if="step === 2" aria-label="Fulfillment" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                :aria-pressed="form.fulfillmentType === 'delivery'"
                class="rounded-2xl border p-4 text-left transition-colors"
                :class="form.fulfillmentType === 'delivery' ? 'border-primary bg-secondary-container/60' : 'border-border bg-card hover:border-primary/50'"
                @click="form.fulfillmentType = 'delivery'"
              >
                <span class="block font-semibold">Delivery</span>
                <span class="mt-0.5 block text-sm text-muted-foreground">+₦2,000 · hot across Lagos</span>
              </button>
              <button
                type="button"
                :aria-pressed="form.fulfillmentType === 'pickup'"
                class="rounded-2xl border p-4 text-left transition-colors"
                :class="form.fulfillmentType === 'pickup' ? 'border-primary bg-secondary-container/60' : 'border-border bg-card hover:border-primary/50'"
                @click="form.fulfillmentType = 'pickup'"
              >
                <span class="block font-semibold">Pickup</span>
                <span class="mt-0.5 block text-sm text-muted-foreground">Free · ready fresh</span>
              </button>
            </div>
            <div v-if="form.fulfillmentType === 'delivery'" class="grid gap-4">
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Delivery address *</span>
                <input v-model="form.addressLine1" required autocomplete="street-address" placeholder="Street, area" class="w-full rounded-xl border border-border bg-card px-4 py-2.5 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
              </label>
              <div class="grid grid-cols-2 gap-4">
                <label class="block">
                  <span class="mb-1 block text-sm font-medium">City</span>
                  <input v-model="form.city" autocomplete="address-level2" class="w-full rounded-xl border border-border bg-card px-4 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium">State</span>
                  <input v-model="form.state" autocomplete="address-level1" class="w-full rounded-xl border border-border bg-card px-4 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
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
            <p class="rounded-xl bg-muted px-4 py-3 text-xs text-muted-foreground">{{ activeMethod.note }}</p>
            <label class="block">
              <span class="mb-1 block text-sm font-medium">Notes (optional)</span>
              <textarea v-model="form.notes" rows="2" placeholder="Gate directions, spice level…" class="w-full rounded-xl border border-border bg-card px-4 py-2.5 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
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
              v-if="step === 1"
              type="button"
              class="flex-1 rounded-full bg-primary px-6 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
              @click="nextFromContact"
            >
              Continue
            </button>
            <button
              v-if="step === 2"
              type="button"
              class="flex-1 rounded-full bg-primary px-6 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
              @click="nextFromFulfillment"
            >
              Continue
            </button>
            <button
              v-if="step === 3"
              type="button"
              :disabled="placing"
              class="flex-1 rounded-full bg-primary px-6 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              @click="placeOrder"
            >
              {{ placing ? "Placing order…" : `Pay ${totalNaira(total)}` }}
            </button>
          </div>
        </div>

        <!-- Summary -->
        <aside class="rounded-2xl border border-border bg-card p-5 md:sticky md:top-24" aria-label="Order summary">
          <h2 class="font-serif text-lg font-semibold">Order summary</h2>
          <ul class="mt-3 space-y-2 text-sm">
            <li v-for="i in items" :key="i.id" class="flex justify-between gap-2">
              <span class="text-muted-foreground">{{ i.name }} ({{ i.variantName }}) × {{ i.quantity }}</span>
              <span class="shrink-0">₦{{ (Number(i.price) * i.quantity).toLocaleString() }}</span>
            </li>
          </ul>
          <div class="mt-4 space-y-1 border-t border-border pt-3 text-sm">
            <p class="flex justify-between"><span class="text-muted-foreground">Subtotal</span><span>₦{{ subtotal.toLocaleString() }}</span></p>
            <p class="flex justify-between"><span class="text-muted-foreground">Delivery</span><span>₦{{ deliveryFee.toLocaleString() }}</span></p>
            <p class="flex justify-between font-bold"><span>Total</span><span>₦{{ total.toLocaleString() }}</span></p>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
