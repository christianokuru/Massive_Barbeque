<script setup lang="ts">
const props = defineProps({
  status: { type: String, required: true },
});

const styles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  ready: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-200 text-gray-700",
};
</script>

<template>
  <span
    class="inline-block rounded-full px-3 py-1 text-xs font-medium capitalize"
    :class="styles[status] ?? 'bg-gray-100 text-gray-700'"
  >
    {{ status }}
  </span>
</template>
