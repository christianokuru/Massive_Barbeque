<script setup lang="ts">
/* Single responsibility: full-viewport media hero.
   All copy arrives via props — this component owns layout only. */

export interface HeroCta {
  label: string;
  to: string;
}

interface Props {
  eyebrow: string;
  titleTop: string;
  titleAccent: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
}

defineProps<Props>();
</script>

<template>
  <section class="relative flex min-h-svh items-center overflow-hidden bg-scrim">
    <!-- Backdrop photo + M3 scrim gradient (keeps on-image text legible) -->
    <NuxtImg
      :src="imageSrc"
      :alt="imageAlt"
      width="1920"
      height="1080"
      sizes="sm:100vw md:100vw lg:100vw xl:100vw 2xl:100vw"
      format="webp"
      quality="80"
      preload
      fetchpriority="high"
      class="absolute inset-0 h-full w-full object-cover"
    />
    <div
      aria-hidden="true"
      class="absolute inset-0 bg-gradient-to-r from-scrim/85 via-scrim/55 to-scrim/15"
    />
    <div
      aria-hidden="true"
      class="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-scrim/70 to-transparent"
    />

    <!-- Left-aligned content column -->
    <div class="relative z-10 mx-auto w-full max-w-7xl px-6 pt-32 pb-20 lg:px-12">
      <div class="max-w-2xl text-left">
        <p class="text-xs font-medium uppercase tracking-[0.3em] text-tertiary">
          {{ eyebrow }}
        </p>
        <h1 class="m3-display-sm mt-6 text-white sm:m3-display-md lg:m3-display-xl">
          {{ titleTop }}<br />
          <span class="text-tertiary">{{ titleAccent }}</span>
        </h1>
        <p class="m3-body-md mt-6 max-w-xl text-white/80">
          {{ description }}
        </p>
        <div class="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <NuxtLink
            :to="primaryCta.to"
            class="rounded-full bg-primary px-8 py-4 text-center text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {{ primaryCta.label }}
          </NuxtLink>
          <NuxtLink
            :to="secondaryCta.to"
            class="rounded-full px-8 py-4 text-center text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-white/10"
          >
            {{ secondaryCta.label }} →
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
