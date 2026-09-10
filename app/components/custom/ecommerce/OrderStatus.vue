<script setup lang="ts">
const props = defineProps({
  status: { type: String, required: true },
});

const styles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  preparing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  ready: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  refunded: "bg-muted text-muted-foreground",
};
</script>

<template>
  <span
    class="inline-block rounded-full px-3 py-1 text-xs font-medium capitalize"
    :class="styles[status] ?? 'bg-muted text-muted-foreground'"
  >
    {{ status }}
  </span>
</template>
