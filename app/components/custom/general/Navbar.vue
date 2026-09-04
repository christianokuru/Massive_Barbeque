<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Logo from "@/components/custom/general/Logo.vue";
import MobileMenu from "@/components/custom/general/MobileMenu.vue";

const scrolled = ref(false);
const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  if (isMobileMenuOpen.value) {
    history.back();
  } else {
    isMobileMenuOpen.value = true;
    history.pushState({ menu: "open" }, "");
  }
};

const handlePopState = (event) => {
  isMobileMenuOpen.value = !!(event.state && event.state.menu === "open");
};

const navItems = [
  { name: 'Menu', to: '/menu' },
  { name: 'Track order', to: '/dashboard/orders' },
  { name: 'Log in', to: '/login' },
];

const { count, refresh: refreshCart } = useCart();
const { isLoggedIn } = useAuth();

onMounted(() => {
  window.addEventListener("popstate", handlePopState);
  refreshCart();

  const handleScroll = () => {
    scrolled.value = window.scrollY > 50;
  };

  window.addEventListener("scroll", handleScroll);

  onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("popstate", handlePopState);
  });
});
</script>

<template>
  <nav
    :class="[
      'fixed top-0 left-0 right-0 z-50 transition-[background-color,backdrop-filter,shadow] duration-500',
      isMobileMenuOpen
        ? 'bg-transparent'
        : scrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-sm'
          : 'bg-black/20 backdrop-blur-sm',
    ]"
  >
    <div
      class="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex items-center justify-between"
    >
      <NuxtLink
        to="/"
        class="flex items-center transition-transform duration-200 hover:scale-105"
      >
        <Logo :variant="scrolled || isMobileMenuOpen ? 'black' : 'white'" />
      </NuxtLink>

      <MobileMenu
        :scrolled="scrolled"
        :is-open="isMobileMenuOpen"
        @toggle="toggleMobileMenu"
      />

      <div class="hidden md:flex items-center gap-12">
        <NuxtLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          :class="[
            'text-xs uppercase tracking-[0.2em] transition-all duration-200 hover:-translate-y-0.5',
            scrolled
              ? 'text-gray-800 hover:text-gray-600'
              : 'text-white hover:text-gray-300',
          ]"
          style="font-family: &quot;Inter&quot;, sans-serif; font-weight: 400"
        >
          {{ item.name }}
        </NuxtLink>
      </div>

      <NuxtLink
        to="/cart"
        :class="[
          'hidden lg:block px-8 py-3 text-xs uppercase tracking-[0.2em] transition-all duration-200 hover:scale-105 active:scale-95',
          scrolled
            ? 'bg-black text-white hover:bg-gray-900'
            : 'bg-white text-black hover:bg-gray-100',
        ]"
        style="font-family: &quot;Inter&quot;, sans-serif; font-weight: 500"
      >
        Cart{{ count > 0 ? ` (${count})` : "" }}
      </NuxtLink>
    </div>
  </nav>
</template>
