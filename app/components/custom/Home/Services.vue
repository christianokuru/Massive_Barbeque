<script setup>
const services = [
  {
    number: "01",
    title: "Fashion E-Commerce",
    description:
      "Your garments tell stories. Your online store should do the same. We design bespoke digital experiences where every interaction mirrors the care and precision woven into your collections. From the first click to the final purchase, your customers encounter nothing less than perfection.",
    features: [
      "Custom design systems that embody your brand's essence",
      "Product presentations worthy of your craftsmanship",
      "Checkout experiences that honor the luxury purchase journey",
    ],
  },
  {
    number: "02",
    title: "Beauty Platforms",
    description:
      "Beauty is intimate, transformative, personal. Your digital presence should reflect this truth. We create elegant platforms where customers discover, explore, and fall in love with your products through experiences as sophisticated as the formulations themselves.",
    features: [
      "Immersive product storytelling that captivates",
      "Intelligent tools that guide personal discovery",
      "Seamless subscription journeys for lasting relationships",
    ],
  },
  {
    number: "03",
    title: "Brand Experience",
    description:
      "Beyond transactions lies identity. We craft complete digital worlds where your heritage, values, and vision come alive. Every page becomes a chapter in your brand's story, every interaction a moment of connection with those who truly understand.",
    features: [
      "Narratives that evoke emotion and belonging",
      "Editorial design that rivals luxury publications",
      "Experiences that transform browsers into devotees",
    ],
  },
];
</script>

<template>
  <section id="services" class="py-32 px-6 lg:px-12 bg-white">
    <div class="max-w-7xl mx-auto">
      <div :class="['mb-24']" data-aos="fade-up">
        <p
          class="text-xs uppercase tracking-[0.4em] text-[#D4AF37] mb-4"
          style="font-family: &quot;Inter&quot;, sans-serif"
        >
          What We Do
        </p>
        <h2
          class="text-6xl md:text-7xl lg:text-8xl tracking-tight"
          style="
            font-family: &quot;Cormorant Garamond&quot;, serif;
            font-weight: 300;
            line-height: 1.1;
          "
        >
          Devoted Exclusively to
          <br />
          <span class="italic" style="font-weight: 400">Luxury</span>
        </h2>
      </div>

      <div class="space-y-24">
        <div
          v-for="(service, index) in services"
          :key="service.number"
          :class="[
            'grid md:grid-cols-12 gap-8 md:gap-12 border-t border-gray-200 pt-12',
          ]"
        >
          <div class="md:col-span-2" data-aos="fade-up">
            <span
              class="text-6xl text-gray-200"
              style="
                font-family: &quot;Cormorant Garamond&quot;, serif;
                font-weight: 300;
              "
            >
              {{ service.number }}
            </span>
          </div>

          <div class="md:col-span-6" data-aos="fade-up" data-aos-delay="100">
            <h3
              class="text-4xl md:text-5xl mb-6 tracking-tight"
              style="
                font-family: &quot;Cormorant Garamond&quot;, serif;
                font-weight: 400;
              "
            >
              {{ service.title }}
            </h3>
            <p
              class="text-gray-600 leading-relaxed text-xs md:text-base"
              style="
                font-family: &quot;Inter&quot;, sans-serif;
                font-weight: 300;
              "
            >
              {{ service.description }}
            </p>
          </div>

          <div class="md:col-span-4" data-aos="fade-up" data-aos-delay="200">
            <ul class="space-y-4">
              <li
                v-for="feature in service.features"
                :key="feature"
                class="flex items-center gap-3 text-xs uppercase tracking-[0.2em]"
                style="
                  font-family: &quot;Inter&quot;, sans-serif;
                  font-weight: 400;
                "
              >
                <span class="w-8 h-px bg-[#D4AF37]" />
                {{ feature }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
