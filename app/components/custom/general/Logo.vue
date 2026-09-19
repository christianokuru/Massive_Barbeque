<script setup lang="ts">
// Brand mark, shared by the navbar, footer, auth shell and mobile nav.
// `variant="footer"` swaps in the dark-text lockup drawn for the footer's
// lighter background; everywhere else uses the primary logo (drawn for
// dark surfaces). Rendered height follows the caller's layout.
interface Props {
  variant?: "primary" | "footer";
}

const props = withDefaults(defineProps<Props>(), { variant: "primary" });

const src = computed(() =>
  props.variant === "footer"
    ? "/images/Food/Logos/footer-logo.png"
    : "/images/Food/Logos/Primary.png",
);
</script>

<template>
  <img
    :src="src"
    alt="Massive Barbeque"
    class="h-10 w-auto sm:h-11"
  />
</template>
