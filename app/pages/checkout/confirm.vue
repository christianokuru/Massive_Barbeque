<script setup lang="ts">
const route = useRoute();
const orderId = computed(() => route.query.order as string | undefined);
const reference = computed(() => (route.query.reference ?? route.query.tx_ref) as string | undefined);

const { data: order } = await useAsyncData(
  `confirm-${orderId.value ?? reference.value}`,
  async () => {
    if (!orderId.value) return null;
    try {
      return await $fetch<{ order: any }>(`/api/orders/${orderId.value}`).then((r) => r.order);
    } catch {
      return null;
    }
  },
  { watch: [orderId] }
);
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-24 text-center md:px-6">
    <h1 class="text-3xl font-bold">Thank you! 🔥</h1>
    <p class="mt-3 text-gray-600">
      Your order <span v-if="orderId" class="font-medium">{{ order?.orderNumber ?? orderId }}</span>
      has been received.
      <span v-if="reference">Payment reference: {{ reference }}.</span>
      We will confirm shortly by email/SMS.
    </p>
    <div class="mt-8 flex justify-center gap-3">
      <NuxtLink to="/menu" class="rounded bg-black px-6 py-3 text-white">Order more</NuxtLink>
      <NuxtLink to="/dashboard/orders" class="rounded border border-gray-300 px-6 py-3">Track order</NuxtLink>
    </div>
  </div>
</template>
