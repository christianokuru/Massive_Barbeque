<script setup>
const testimonials = [
  {
    quote:
      "Kylva didn't just build us a website—they captured the very essence of our brand and translated it into a digital experience that rivals our boutiques. Our customers feel the difference, and our conversion rates prove it.",
    author: "Sophie Laurent",
    position: "Creative Director",
    brand: "Maison Noir",
  },
  {
    quote:
      "Working with Kylva felt like collaborating with artists who truly understood luxury beauty. They built us a platform that's as sophisticated as our formulations, as personal as our customer service, and as elegant as our packaging.",
    author: "Isabella Chen",
    position: "Founder & CEO",
    brand: "Lumière Beauty",
  },
  {
    quote:
      "From our first conversation, Kylva understood that fragrance is not a product—it's an emotion, a memory, an identity. They created a digital world that honors this truth. The result exceeded every expectation.",
    author: "Alexandre Dubois",
    position: "Brand Director",
    brand: "Essence Parfums",
  },
];
</script>

<template>
  <section id="testimonials" class="py-32 px-6 lg:px-12 bg-white">
    <div class="max-w-7xl mx-auto">
      <div :class="['mb-24 text-center']" data-aos="fade-up">
        <p
          class="text-xs uppercase tracking-[0.4em] text-[#D4AF37] mb-4"
          style="font-family: &quot;Inter&quot;, sans-serif"
        >
          Our Clients
        </p>
        <h2
          class="text-6xl md:text-7xl lg:text-8xl tracking-tight"
          style="
            font-family: &quot;Cormorant Garamond&quot;, serif;
            font-weight: 300;
            line-height: 1.1;
          "
        >
          Partnerships Built on
          <br />
          <span class="italic" style="font-weight: 400">Excellence</span>
        </h2>
      </div>

      <div class="grid lg:grid-cols-3 gap-12">
        <div
          v-for="(testimonial, index) in testimonials"
          :key="testimonial.author"
          :class="['border-t border-gray-200 pt-8']"
          data-aos="fade-up"
          :data-aos-delay="index * 100"
        >
          <p
            class="text-2xl md:text-3xl mb-12 leading-relaxed"
            style="
              font-family: &quot;Cormorant Garamond&quot;, serif;
              font-weight: 300;
              font-style: italic;
            "
          >
            "{{ testimonial.quote }}"
          </p>

          <div>
            <p
              class="text-lg mb-1"
              style="
                font-family: &quot;Cormorant Garamond&quot;, serif;
                font-weight: 500;
              "
            >
              {{ testimonial.author }}
            </p>
            <p
              class="text-sm text-gray-500 mb-1"
              style="
                font-family: &quot;Inter&quot;, sans-serif;
                font-weight: 300;
              "
            >
              {{ testimonial.position }}
            </p>
            <p
              class="text-xs uppercase tracking-[0.2em] text-[#D4AF37]"
              style="
                font-family: &quot;Inter&quot;, sans-serif;
                font-weight: 500;
              "
            >
              {{ testimonial.brand }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
