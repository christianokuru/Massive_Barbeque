<!-- Path: /app/layouts/default.vue -->

<script setup>
import Navbar from "../components/custom/general/Navbar.vue";
import Footer from "../components/custom/general/Footer.vue";
</script>

<template>
  <div>
    <Navbar />
    <main>
      <slot />
    </main>
    <Footer />
  </div>
</template>
