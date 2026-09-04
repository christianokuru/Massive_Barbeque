<script setup lang="ts">
import { z } from "zod";

useSeoMeta({ title: "Checkout | Massive Barbeque" });

const { items, subtotal, refresh } = useCart();
await refresh();

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

const deliveryFee = computed(() => (form.value.fulfillmentType === "delivery" ? 2000 : 0));
const total = computed(() => subtotal.value + deliveryFee.value);

const schema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7),
});

async function placeOrder() {
  error.value = "";
  const parsed = schema.safeParse(form.value);
  if (!parsed.success) {
    error.value = "Please fill in name, a valid email, and phone.";
    return;
  }
  if (!items.value.length) {
    error.value = "Your cart is empty.";
    return;
  }
  placing.value = true;
  try {
    const order = await $fetch<{ order: any }>("/api/orders", {
      method: "POST",
      body: {
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

    const initPath =
      form.value.paymentMethod === "paystack"
        ? "/api/payments/paystack/initialize"
        : "/api/payments/flutterwave/initialize";
    const payment = await $fetch<{ authorization_url?: string; link?: string }>(initPath, {
      method: "POST",
      body: {
        email: form.value.customerEmail,
        amount: total.value,
        orderId: order.order.id,
      },
    });

    const url = (payment as any).authorization_url ?? (payment as any).link;
    if (url) {
      window.location.href = url;
    } else {
      await navigateTo(`/checkout/confirm?order=${order.order.id}`);
    }
  } catch (e: any) {
    error.value = e?.data?.message || e?.statusMessage || "Could not place order. Try again.";
  } finally {
    placing.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-24 md:px-6">
    <h1 class="text-3xl font-bold md:text-4xl">Checkout</h1>
    <div v-if="!items.length" class="mt-6 text-gray-500">
      Your cart is empty. <NuxtLink to="/menu" class="text-[#FF6B35] hover:underline">Browse the menu</NuxtLink>
    </div>
    <div v-else class="mt-6 grid gap-8 md:grid-cols-2">
      <form class="space-y-4" @submit.prevent="placeOrder">
        <div class="grid gap-4">
          <label class="block"><span class="mb-1 block text-sm font-medium">Full name *</span><input v-model="form.customerName" required class="w-full rounded border border-gray-300 px-3 py-2" /></label>
          <label class="block"><span class="mb-1 block text-sm font-medium">Email *</span><input v-model="form.customerEmail" type="email" required class="w-full rounded border border-gray-300 px-3 py-2" /></label>
          <label class="block"><span class="mb-1 block text-sm font-medium">Phone *</span><input v-model="form.customerPhone" required class="w-full rounded border border-gray-300 px-3 py-2" /></label>
        </div>
        <div>
          <p class="mb-1 text-sm font-medium">Fulfillment</p>
          <div class="flex gap-2">
            <button type="button" :class="form.fulfillmentType === 'delivery' ? 'bg-black text-white' : 'bg-white'" class="rounded border px-4 py-2 text-sm" @click="form.fulfillmentType = 'delivery'">Delivery (+₦2,000)</button>
            <button type="button" :class="form.fulfillmentType === 'pickup' ? 'bg-black text-white' : 'bg-white'" class="rounded border px-4 py-2 text-sm" @click="form.fulfillmentType = 'pickup'">Pickup (free)</button>
          </div>
        </div>
        <div v-if="form.fulfillmentType === 'delivery'" class="grid gap-4">
          <label class="block"><span class="mb-1 block text-sm font-medium">Delivery address *</span><input v-model="form.addressLine1" :required="form.fulfillmentType === 'delivery'" class="w-full rounded border border-gray-300 px-3 py-2" /></label>
          <div class="grid grid-cols-2 gap-4">
            <label class="block"><span class="mb-1 block text-sm font-medium">City</span><input v-model="form.city" class="w-full rounded border border-gray-300 px-3 py-2" /></label>
            <label class="block"><span class="mb-1 block text-sm font-medium">State</span><input v-model="form.state" class="w-full rounded border border-gray-300 px-3 py-2" /></label>
          </div>
        </div>
        <div>
          <p class="mb-1 text-sm font-medium">Pay with</p>
          <div class="flex gap-2">
            <button type="button" :class="form.paymentMethod === 'paystack' ? 'bg-black text-white' : 'bg-white'" class="rounded border px-4 py-2 text-sm" @click="form.paymentMethod = 'paystack'">Paystack</button>
            <button type="button" :class="form.paymentMethod === 'flutterwave' ? 'bg-black text-white' : 'bg-white'" class="rounded border px-4 py-2 text-sm" @click="form.paymentMethod = 'flutterwave'">Flutterwave</button>
          </div>
        </div>
        <label class="block"><span class="mb-1 block text-sm font-medium">Notes (optional)</span><textarea v-model="form.notes" rows="2" class="w-full rounded border border-gray-300 px-3 py-2" /></label>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button :disabled="placing" class="w-full rounded bg-[#FF6B35] px-6 py-3 font-medium text-white disabled:opacity-50">
          {{ placing ? "Placing order…" : "Place order & pay" }}
        </button>
      </form>
      <div class="h-fit rounded-lg bg-gray-50 p-5">
        <h2 class="font-semibold">Order summary</h2>
        <ul class="mt-3 space-y-2 text-sm">
          <li v-for="i in items" :key="i.id" class="flex justify-between"><span>{{ i.variant?.product?.name }} ({{ i.variant?.name }}) × {{ i.quantity }}</span><span>₦{{ (Number(i.variant?.price) * i.quantity).toLocaleString() }}</span></li>
        </ul>
        <div class="mt-4 space-y-1 border-t pt-3 text-sm">
          <p class="flex justify-between"><span>Subtotal</span><span>₦{{ subtotal.toLocaleString() }}</span></p>
          <p class="flex justify-between"><span>Delivery</span><span>₦{{ deliveryFee.toLocaleString() }}</span></p>
          <p class="flex justify-between font-bold"><span>Total</span><span>₦{{ total.toLocaleString() }}</span></p>
        </div>
      </div>
    </div>
  </div>
</template>
