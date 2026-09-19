<script setup lang="ts">
useSeoMeta({
  title: "Contact",
  description: "Reach Massive Barbeque in Lagos — bulk and party orders, catering enquiries and support. Call, WhatsApp or send a message.",
});

const channels = [
  { label: "Email", value: "info@massivebarbeque.com", href: "mailto:info@massivebarbeque.com" },
  { label: "Find us", value: "Lagos, Nigeria", href: undefined },
  { label: "Hours", value: "Open daily · delivery across Lagos", href: undefined },
];
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-20 sm:py-24 md:px-6">
    <p class="text-xs font-medium uppercase tracking-[0.2em] text-primary">Contact</p>
    <h1 class="mt-2 text-2xl font-bold sm:text-3xl md:text-4xl">Talk to us</h1>
    <p class="mt-4 max-w-2xl text-muted-foreground">
      Bulk and party orders, feedback, or anything else — reach out and we'll
      get back to you. For food right now, the menu is the fastest route.
    </p>

    <ul class="mt-8 grid gap-3 sm:grid-cols-3">
      <li
        v-for="item in channels"
        :key="item.label"
        class="rounded-2xl border border-border bg-card p-4"
      >
        <p class="text-sm font-medium text-muted-foreground">{{ item.label }}</p>
        <component
          :is="item.href ? 'a' : 'p'"
          :href="item.href"
          class="mt-1 font-semibold"
          :class="item.href ? 'text-primary hover:underline' : ''"
        >
          {{ item.value }}
        </component>
      </li>
    </ul>

    <div class="mt-10 flex flex-col gap-3 sm:flex-row">
      <a
        href="mailto:info@massivebarbeque.com"
        class="rounded-full bg-primary px-8 py-3 text-center text-sm font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Email us
      </a>
      <NuxtLink
        to="/menu"
        class="rounded-full border border-border px-8 py-3 text-center text-sm font-medium uppercase tracking-widest transition-colors hover:bg-secondary-container/60"
      >
        Order now
      </NuxtLink>
    </div>
  </div>
</template>
