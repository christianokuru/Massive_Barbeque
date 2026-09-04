<script setup>
const scrollToSection = (id) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};
</script>

<template>
  <section
    id="hero"
    class="relative h-screen max-sm:h-auto max-sm:min-h-screen flex items-center justify-center overflow-hidden max-sm:overflow-visible bg-[#fafaf9] max-sm:pt-24 max-sm:pb-12"
  >
    <div class="absolute inset-0 opacity-15">
      <img
        src="https://images.unsplash.com/photo-1745284504942-2eb53650360a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwbHV4dXJ5JTIwZmFzaGlvbnxlbnwxfHx8fDE3Njc3MjU5NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
        alt=""
        class="w-full h-full object-cover"
      />
    </div>

    <div class="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 text-center">
      <div class="mt-4">
        <h1
          data-aos="fade-up"
          data-aos-delay="200"
          class="text-6xl md:text-8xl lg:text-8xl mb-8 tracking-tight font-serif font-light leading-[1.1]"
        >
          Where Digital Elegance Meets
          <br />
          <span class="italic" style="font-weight: 400">Commerce</span>
        </h1>
      </div>

      <p
        data-aos="fade-up"
        data-aos-delay="400"
        class="text-xs md:text-base text-gray-600 mb-12 max-w-2xl mx-auto tracking-wide font-sans font-light"
      >
        We craft bespoke e-commerce experiences for fashion and beauty brands
        who demand excellence. Each project transforms your vision into a
        refined digital presence.
      </p>

      <div
        class="flex flex-col sm:flex-row items-center justify-center gap-6"
        data-aos="fade-up"
        data-aos-delay="600"
      >
        <button
          @click="scrollToSection('contact')"
          class="px-12 py-5 bg-black text-white text-xs uppercase tracking-[0.3em] transition-all duration-200 hover:scale-105 active:scale-95 font-sans font-medium"
        >
          Begin Your Journey
        </button>

        <button
          @click="scrollToSection('work')"
          class="text-xs px-12 py-5 border uppercase tracking-[0.3em] text-gray-700 flex items-center gap-3 group transition-transform duration-200 hover:translate-x-1 font-sans font-normal"
        >
          Explore Our Work
          <span class="transform group-hover:translate-x-1 transition-transform"
            >→</span
          >
        </button>
      </div>
    </div>

    <!-- <div class="absolute top-72 left-1/2 transform -translate-x-1/2 animate-fade-in animate-delay-1200 opacity-0">
      <div class="flex flex-col items-center gap-2 animate-bounce">
        <span class="text-xs uppercase tracking-[0.3em] text-gray-400" style="font-family: 'Inter', sans-serif">
          Scroll Down
        </span>
        <div class="w-px h-16 bg-linear-to-b from-gray-400 to-transparent" />
      </div>
    </div> -->
  </section>
</template>
