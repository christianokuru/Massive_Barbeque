<script setup lang="ts">
// Auth pages are functional, not content — keep them out of the index.
useSeoMeta({ robots: "noindex, nofollow" });
</script>

<template>
  <!-- Bare layout for auth pages: the split-screen shell owns the chrome. -->
  <slot />
</template>
