<script setup>
import { watch } from "vue";
import { Menu, X } from "lucide-vue-next";

const props = defineProps({
  scrolled: {
    type: Boolean,
    default: false,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["toggle"]);

watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  },
);

const toggleMenu = () => {
  emit("toggle");
};

const scrollToSection = (id) => {
  emit("toggle");
  setTimeout(() => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, 100);
};
</script>

<template>
  <div class="md:hidden">
    <!-- Hamburger Button -->
    <button
      @click="toggleMenu"
      :class="[
        'p-2 transition-colors duration-200 focus:outline-none z-100 relative',
        isOpen ? 'text-gray-900' : scrolled ? 'text-gray-800' : 'text-white',
      ]"
      aria-label="Toggle Menu"
    >
      <Transition mode="out-in">
        <Menu v-if="!isOpen" class="w-6 h-6" />
        <X v-else class="w-6 h-6" />
      </Transition>
    </button>

    <!-- Overlay/Menu -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-500 ease-in-out"
        enter-from-class="opacity-0 translate-y-[-20px]"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-400 ease-in-out"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-[-20px]"
      >
        <div
          v-if="isOpen"
          class="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center p-8 text-center"
        >
          <!-- Nav Links -->
          <div class="flex flex-col items-center gap-8">
            <button
              v-for="(item, index) in [
                'services',
                'about',
                'work',
                'testimonials',
                'contact',
              ]"
              :key="item"
              @click="scrollToSection(item)"
              class="text-2xl uppercase tracking-[0.4em] text-gray-800 hover:text-black transition-all duration-300 transform"
              :style="{
                fontFamily: 'Inter, sans-serif',
                fontWeight: '400',
                animationDelay: `${index * 100}ms`,
              }"
            >
              {{ item }}
            </button>
          </div>

          <!-- CTA -->
          <button
            @click="scrollToSection('contact')"
            class="mt-16 px-12 py-5 bg-black text-white text-[10px] uppercase tracking-[0.3em] hover:bg-gray-800 transition-all duration-300 active:scale-95 shadow-2xl"
            style="font-family: 'Inter', sans-serif; font-weight: 500;">
            Start Project
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
