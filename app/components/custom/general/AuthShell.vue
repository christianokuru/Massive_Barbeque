<script setup lang="ts">
import Logo from "@/components/custom/general/Logo.vue";

/* Single responsibility: login-02 style split screen for auth pages.
   Brand + form own the left column (provided via slot); one barbeque
   image owns the right rail on desktop. */

const BBQ_IMAGE =
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1600&auto=format&fit=crop";
</script>

<template>
  <div class="grid min-h-svh lg:grid-cols-2">
    <div class="flex flex-col gap-4 p-6 md:p-10">
      <div class="flex justify-center gap-2 md:justify-start">
        <NuxtLink to="/" aria-label="Massive Barbeque home">
          <Logo />
        </NuxtLink>
      </div>
      <div class="flex flex-1 items-center justify-center">
        <div class="w-full max-w-xs">
          <slot />
        </div>
      </div>
    </div>
    <div class="relative hidden bg-muted lg:block">
      <img
        :src="BBQ_IMAGE"
        alt="Fire-grilled barbeque"
        class="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        fetchpriority="high"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
      <p class="absolute inset-x-0 bottom-0 p-10 font-serif text-2xl font-medium text-white">
        Fire-grilled BBQ, delivered hot.
      </p>
    </div>
  </div>
</template>
