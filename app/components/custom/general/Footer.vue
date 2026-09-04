<script setup lang="ts">
import Logo from "@/components/custom/general/Logo.vue";

const currentYear = new Date().getFullYear();

const links = [
  { name: "Menu", to: "/menu" },
  { name: "Cart", to: "/cart" },
  { name: "Track order", to: "/dashboard/orders" },
  { name: "Log in", to: "/login" },
];
</script>

<template>
  <footer class="bg-black px-6 py-16 text-white lg:px-12">
    <div class="mx-auto max-w-7xl">
      <div class="mb-16 grid gap-12 md:grid-cols-3">
        <div>
          <Logo variant="white" class="mb-6" />
          <p class="text-sm leading-relaxed text-gray-400">
            Premium BBQ in Lagos — catfish, chicken, turkey, croaker and sides.
            Delivery and pickup available.
          </p>
        </div>

        <div>
          <h3 class="mb-6 text-xs uppercase tracking-[0.3em]">Order</h3>
          <ul class="space-y-3">
            <li v-for="link in links" :key="link.name">
              <NuxtLink :to="link.to" class="text-sm text-gray-400 hover:text-white">
                {{ link.name }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="mb-6 text-xs uppercase tracking-[0.3em]">Contact</h3>
          <ul class="space-y-3">
            <li>
              <a href="mailto:info@massivebarbeque.com" class="text-sm text-gray-400 hover:text-white">
                info@massivebarbeque.com
              </a>
            </li>
            <li class="text-sm text-gray-400">Lagos, Nigeria</li>
          </ul>
        </div>
      </div>

      <div class="flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 md:flex-row">
        <p class="text-xs text-gray-500">© {{ currentYear }} Massive Barbeque. All rights reserved.</p>
        <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Paystack · Flutterwave secured</p>
      </div>
    </div>
  </footer>
</template>
