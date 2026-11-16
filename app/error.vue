<script setup lang="ts">
import type { NuxtError } from "#app";
import M3Icon from "@/components/M3Icon.vue";
import Navbar from "@/components/custom/general/Navbar.vue";

/* Branded error screen for 404s and crashes (replaces Nuxt's default).
   Never shows technical details to visitors. */
const props = defineProps<{ error: NuxtError }>();
const notFound = computed(() => props.error?.statusCode === 404);

useSeoMeta({ title: () => (notFound.value ? "Page not found" : "Something went wrong"), robots: "noindex" });

function goHome() {
  clearError({ redirect: "/" });
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <Navbar />
    <main class="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <span class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
        <M3Icon :name="notFound ? 'search_off' : 'local_fire_department'" :size="30" />
      </span>
      <p class="mt-6 text-xs font-medium uppercase tracking-[0.4em] text-primary">{{ error?.statusCode || 500 }}</p>
      <h1 class="m3-display-sm mt-3">{{ notFound ? "This page isn't on the menu" : "Something went wrong" }}</h1>
      <p class="m3-body-md mt-3 text-muted-foreground">
        {{ notFound ? "The link may be old or mistyped." : "Please try again in a moment. If it keeps happening, let us know." }}
      </p>
      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <NuxtLink to="/menu" class="rounded-full bg-primary px-8 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90" @click.prevent="clearError({ redirect: '/menu' })">
          See the menu
        </NuxtLink>
        <button type="button" class="rounded-full border border-border px-8 py-3 text-xs font-medium uppercase tracking-widest transition-colors hover:bg-secondary-container/60" @click="goHome">
          Go home
        </button>
      </div>
    </main>
  </div>
</template>
