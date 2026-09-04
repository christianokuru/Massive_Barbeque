<script setup>
const scrollToSection = (sectionId) => {
  const element = document.querySelector(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};
</script>

<template>
  <section id="about" class="py-24 md:py-32 bg-neutral-50">
    <div class="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
      <div class="grid md:grid-cols-2 gap-12 items-center">
        <div data-aos="fade-up">
          <p class="text-sm tracking-widest uppercase text-neutral-500 mb-4">
            About Kylva
          </p>
          <h2
            class="text-3xl md:text-5xl font-light tracking-tight text-neutral-900 mb-8"
            style="
              font-family: 'Cormorant Garamond', serif;
              font-weight: 300;
              line-height: 1.1;
            "
          >
            Where Luxury Finds Its Digital Voice
          </h2>

          <div
            class="space-y-6 text-neutral-600 leading-relaxed text-xs md:text-base"
            style="font-family: 'Inter', sans-serif; font-weight: 300"
          >
            <p>
              Kylva was founded on a singular conviction: that extraordinary
              brands deserve extraordinary digital experiences. Too many luxury
              houses settle for online presence that fails to match the artistry
              of their products. We exist to change that.
            </p>

            <p>
              We understand luxury is not about excess—it's about restraint,
              intention, and the confidence that comes from mastering every
              detail. It's the space between elements. The typography chosen
              with care. The animation that delights without demanding
              attention. The navigation so intuitive it becomes invisible.
            </p>

            <p>
              Our work combines the aesthetic sensibility of the world's finest
              ateliers with technology that performs flawlessly across every
              device, every connection, every moment. Because true luxury never
              makes excuses.
            </p>

            <p>
              We serve discerning brands across North America and Europe who
              recognize that their digital presence is not separate from their
              brand—it is their brand, experienced by thousands before a single
              product is ever touched.
            </p>
          </div>

          <button
            @click="scrollToSection('#contact')"
            class="mt-8 px-8 py-4 border border-neutral-900 text-neutral-900 text-sm tracking-widest uppercase hover:bg-neutral-900 hover:text-white transition-colors duration-300"
          >
            Discover Our Approach
          </button>
        </div>

        <div
          class="relative h-96 md:h-full min-h-[400px] bg-neutral-200"
          data-aos="fade-in"
          data-aos-delay="300"
        >
          <!-- Placeholder for imagery - replace with actual image -->
          <div
            class="absolute inset-0 flex items-center justify-center text-neutral-400"
          >
            <span class="text-sm tracking-widest uppercase"
              >Image Placeholder</span
            >
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
