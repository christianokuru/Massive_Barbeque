<script setup>
// const { targetRef, isInView } = useInView({ threshold: 0.1 });
const { getFeaturedProjects } = useProjects();

const projects = getFeaturedProjects();
</script>

<template>
  <section
    id="work"
    ref="targetRef"
    class="py-32 px-6 lg:px-12 bg-black text-white"
  >
    <div class="max-w-7xl mx-auto">
      <div :class="['mb-24']" data-aos="fade-up">
        <p
          class="text-xs uppercase tracking-[0.4em] text-[#D4AF37] mb-4 font-sans"
        >
          Selected Work
        </p>
        <h2
          class="text-6xl md:text-7xl lg:text-8xl tracking-tight mb-8 font-serif font-light leading-[1.1]"
        >
          Creating Digital
          <span class="italic" style="font-weight: 400">Legacies</span>
        </h2>
        <p
          class="text-xs md:text-xl text-gray-400 leading-relaxed max-w-3xl font-sans font-light"
        >
          Each collaboration is a partnership in excellence. These projects
          represent more than beautiful websites—they are digital expressions of
          brands who demand nothing less than perfection.
        </p>
      </div>

      <div class="space-y-32">
        <div
          v-for="(project, index) in projects"
          :key="project.title"
          :class="['group cursor-pointer']"
          data-aos="fade-up"
          :data-aos-delay="index * 100"
        >
          <div
            class="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden mb-8"
          >
            <img
              :src="project.image"
              :alt="project.title"
              class="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
            />

            <div
              class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500"
            />
          </div>

          <div class="grid md:grid-cols-12 gap-6">
            <div class="md:col-span-8">
              <h3
                class="text-4xl md:text-5xl lg:text-6xl mb-4 tracking-tight group-hover:text-[#D4AF37] transition-colors duration-300 font-serif font-normal"
              >
                {{ project.title }}
              </h3>
              <p
                class="text-gray-400 text-base leading-relaxed font-sans font-light text-xs md:text-base"
              >
                {{ project.description }}
              </p>
            </div>

            <div class="md:col-span-4 flex items-start justify-end">
              <span
                class="text-sm uppercase tracking-[0.2em] text-gray-500 font-sans font-normal"
              >
                {{ project.category }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-32 text-center" data-aos="fade-up">
        <NuxtLink
          to="/projects"
          class="inline-block px-12 py-5 border border-white text-white text-sm uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 active:scale-95 font-sans font-medium"
        >
          View Case Studies
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
