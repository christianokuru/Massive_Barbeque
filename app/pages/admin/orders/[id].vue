<script setup lang="ts">
import OrderStatus from "@/components/custom/ecommerce/OrderStatus.vue";
definePageMeta({ layout: "admin" });
const route = useRoute();
const { user, fetchSession } = useAuth();
await fetchSession();
if (!user.value) await navigateTo("/login");
const { data: order, refresh } = await useAsyncData(`admin-order-${route.params.id}`, () =>
  $fetch<{ order: any }>(`/api/orders/${route.params.id}`).then((r) => r.order).catch(() => null)
);
const status = ref("confirmed");
const paymentStatus = ref("paid");
const saving = ref(false);
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
    await refresh();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <NuxtLink to="/admin/orders" class="text-sm text-gray-500 hover:underline">← All orders</NuxtLink>
    <div v-if="order" class="mt-4">
      <h1 class="text-3xl font-bold">{{ order.orderNumber }}</h1>
      <div class="mt-2 flex gap-2"><OrderStatus :status="order.status" /><OrderStatus :status="order.paymentStatus" /></div>
      <p class="mt-4 text-sm text-gray-600">{{ order.customerName }} · {{ order.customerEmail }} · {{ order.customerPhone }}</p>
      <ul class="mt-4 space-y-2">
        <li v-for="i in (order.items ?? [])" :key="i.id" class="flex justify-between rounded border p-3 text-sm">
          <span>{{ i.productName }} ({{ i.variantName }}) × {{ i.quantity }}</span>
          <span>₦{{ Number(i.totalPrice).toLocaleString() }}</span>
        </li>
      </ul>
      <div class="mt-6 flex flex-wrap gap-3">
        <select v-model="status" class="rounded border px-3 py-2 text-sm">
          <option value="pending">pending</option><option value="confirmed">confirmed</option><option value="preparing">preparing</option><option value="ready">ready</option><option value="completed">completed</option><option value="cancelled">cancelled</option>
        </select>
        <select v-model="paymentStatus" class="rounded border px-3 py-2 text-sm">
          <option value="pending">pending</option><option value="paid">paid</option><option value="failed">failed</option><option value="refunded">refunded</option>
        </select>
        <button :disabled="saving" class="rounded bg-black px-5 py-2 text-sm text-white disabled:opacity-50" @click="save">{{ saving ? "Saving…" : "Update status" }}</button>
      </div>
    </div>
    <p v-else class="mt-6 text-gray-500">Order not found.</p>
  </div>
</template>
