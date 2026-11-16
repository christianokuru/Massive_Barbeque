<script setup lang="ts">
// One chip for both order states and payment states. Pass kind="payment"
// for payment states so "pending" reads "Unpaid" instead of a second,
// ambiguous "Pending" next to the order's own status.
const props = defineProps({
  status: { type: String, required: true },
  kind: { type: String as () => "order" | "payment", default: "order" },
  // For payment chips: the order's own status. A cancelled order that was
  // never paid owes nothing — it reads "Not charged", not "Unpaid".
  orderStatus: { type: String, default: "" },
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

const PAYMENT_LABEL: Record<string, string> = {
  pending: "Unpaid",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
};

const notCharged = computed(
  () => props.kind === "payment" && props.status !== "paid" && props.status !== "refunded" && props.orderStatus === "cancelled",
);
const label = computed(() => {
  if (notCharged.value) return "Not charged";
  return props.kind === "payment" ? PAYMENT_LABEL[props.status] ?? props.status : props.status;
});
</script>

<template>
  <span
    class="inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium capitalize"
    :class="notCharged ? 'bg-muted text-muted-foreground' : styles[status] ?? 'bg-muted text-muted-foreground'"
  >
    {{ label }}
  </span>
</template>
