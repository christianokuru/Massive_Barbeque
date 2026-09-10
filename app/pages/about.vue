<script setup lang="ts">
useSeoMeta({ title: "About Us | Massive Barbeque" });

const specialties = [
  { name: "Barbeque Catfish", text: "Smoky, peppery, grilled to order — our signature." },
  { name: "Grilled Chicken", text: "Juicy all the way through, never dry." },
  { name: "Grilled Turkey", text: "Asun-style heat with deep smoke." },
  { name: "Croaker & Sides", text: "Full fish, sharable sides, party platters." },
];

const promises = [
  { title: "Grilled to order", text: "Nothing sits around. Your BBQ hits the grill when you order." },
  { title: "Delivered hot", text: "Across Lagos, beating our own estimates — or ready at pickup." },
  { title: "Secure checkout", text: "Pay with Paystack or Flutterwave. Cards, transfers, and more." },
];
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-20 sm:py-24 md:px-6">
    <p class="text-xs font-medium uppercase tracking-[0.2em] text-primary">About us</p>
    <h1 class="mt-2 text-2xl font-bold sm:text-3xl md:text-4xl">Fire-grilled BBQ, made for Lagos</h1>
    <p class="mt-4 max-w-2xl text-muted-foreground">
      Massive Barbeque started with one grill and one obsession: real fire flavour.
      Today we serve barbeque catfish, chicken, turkey, croaker and sides —
      grilled to order for delivery across Lagos and quick pickup.
    </p>

    <h2 class="mt-10 text-lg font-semibold sm:text-xl">What we grill</h2>
    <ul class="mt-4 grid gap-3 sm:grid-cols-2">
      <li
        v-for="item in specialties"
        :key="item.name"
        class="rounded-2xl border border-border bg-card p-4"
      >
        <p class="font-semibold">{{ item.name }}</p>
        <p class="mt-1 text-sm text-muted-foreground">{{ item.text }}</p>
      </li>
    </ul>

    <h2 class="mt-10 text-lg font-semibold sm:text-xl">Our promise</h2>
    <ol class="mt-4 grid gap-3 sm:grid-cols-3">
      <li
        v-for="(item, i) in promises"
        :key="item.title"
        class="rounded-2xl bg-muted p-4"
      >
        <p class="text-sm font-bold text-primary">0{{ i + 1 }}</p>
        <p class="mt-1 font-semibold">{{ item.title }}</p>
        <p class="mt-1 text-sm text-muted-foreground">{{ item.text }}</p>
      </li>
    </ol>

    <div class="mt-10 flex flex-col gap-3 sm:flex-row">
      <NuxtLink
        to="/menu"
        class="rounded-full bg-primary px-8 py-3 text-center text-sm font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Order now
      </NuxtLink>
      <NuxtLink
        to="/contact"
        class="rounded-full border border-border px-8 py-3 text-center text-sm font-medium uppercase tracking-widest transition-colors hover:bg-secondary-container/60"
      >
        Contact us
      </NuxtLink>
    </div>
  </div>
</template>
