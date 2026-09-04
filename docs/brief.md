# Kylva - Project Brief

**Domain:** kylva.com

---

## Non-Technical Description

### Overview
Kylva is a luxury web development agency that specializes in creating exceptional e-commerce experiences exclusively for high-end fashion and beauty brands. The agency serves discerning clients across the United States and European markets, bringing together sophisticated design sensibilities with cutting-edge technical expertise.

### Brand Positioning
Kylva occupies a unique space at the intersection of luxury aesthetics and digital commerce. The brand was founded on the principle that luxury fashion and beauty brands deserve online experiences that match the quality, sophistication, and attention to detail that goes into their physical products. Unlike generalist web agencies, Kylva has deliberately chosen to focus exclusively on the fashion and beauty sectors, allowing them to develop unparalleled expertise and understanding of these industries' unique needs and expectations.

### Target Audience
Kylva's ideal clients are established and emerging luxury fashion houses, haute couture brands, contemporary fashion labels, premium beauty brands, artisanal cosmetics companies, and niche fragrance houses. These clients typically have a strong appreciation for aesthetics, brand storytelling, and customer experience. They understand that their digital presence is an extension of their brand identity and demand nothing less than perfection.

### Service Offerings
The agency offers three core service areas:

1. **Fashion E-Commerce:** Creation of bespoke online stores for fashion brands ranging from haute couture to contemporary labels. Each project receives a custom design system that reflects the brand's unique identity, product showcases that present garments and accessories in their best light, and seamless checkout experiences that respect the luxury customer's expectations.

2. **Beauty Platforms:** Development of elegant e-commerce solutions for beauty and cosmetics brands. These platforms feature interactive product views that allow customers to explore products in detail, sophisticated shade matching tools for cosmetics, and subscription systems for recurring beauty regimens.

3. **Brand Experience:** Beyond transactional e-commerce, Kylva crafts complete digital identities that tell a brand's story across every touchpoint. This includes editorial-style layouts that mirror the aesthetic of luxury fashion publications, brand storytelling elements that create emotional connections with customers, and luxury UI/UX design that elevates every interaction.

### Design Philosophy
Kylva's design philosophy is rooted in minimalism and restraint. The agency believes that true luxury is communicated through what is omitted as much as what is included. Clean lines, generous white space, sophisticated typography, and carefully curated imagery create experiences that feel both timeless and contemporary. The design approach emphasizes the products while providing an elegant, unobtrusive framework that enhances rather than competes.

### Technical Approach
While the front-end experience is one of refined elegance, Kylva employs modern, performant technology to ensure that beauty doesn't come at the cost of functionality. The agency builds on cutting-edge web frameworks, implements smooth animations and micro-interactions that delight without distracting, and ensures that every site performs flawlessly across all devices and connection speeds.

### Geographic Focus
Kylva is positioned to serve clients primarily in the United States, Canada and Europe, with the ability to work remotely with brands anywhere in the world. The agency's understanding of international luxury markets, combined with seamless remote collaboration capabilities, allows them to partner with the world's most prestigious fashion and beauty brands regardless of location.

### Brand Values
- **Excellence:** Unwavering commitment to quality in every aspect of every project
- **Sophistication:** Understanding that luxury communicates through subtlety and restraint
- **Partnership:** Viewing client relationships as long-term collaborations rather than transactions
- **Innovation:** Continually exploring new ways to elevate the digital luxury experience
- **Discretion:** Respecting the confidentiality and privacy that luxury brands require

### Contact Information
- Email: hello@kylva.studio
- Phone: +1 (234) 567-890
- Website: kylva.com

---

## Pages and Components Structure

### Pages

| Page | Path | Description |
|------|------|-------------|
| Home | `/app/pages/index.vue` | Main landing page containing all sections |
| Thank You | `/app/pages/thank-you.vue` | Confirmation page after form submission |

### Components

| Component | Path | Type | Description |
|-----------|------|------|-------------|
| Hero | `/app/components/custom/Home/Hero.vue` | Section | Full-screen hero with headline, subtext, and CTAs |
| Services | `/app/components/custom/Home/Services.vue` | Section | Three-service offering display |
| About | `/app/components/custom/Home/About.vue` | Section | Agency introduction with imagery |
| Work | `/app/components/custom/Home/Work.vue` | Section | Portfolio/project showcase |
| Testimonials | `/app/components/custom/Home/Testimonials.vue` | Section | Client testimonials grid |
| Contact | `/app/components/custom/Home/Contact.vue` | Section | Contact form and information |
| Navbar | `/app/components/custom/general/Navbar.vue` | Layout | Fixed navigation with scroll effects |
| Footer | `/app/components/custom/general/Footer.vue` | Layout | Footer with links and contact info |
| Logo | `/app/components/custom/general/Logo.vue` | Element | Kylva logo component |

---

## Component Codes and Usage

### Home Page (`/app/pages/index.vue`)
```vue
<script setup>
import Hero from '@/components/custom/Home/Hero.vue'
import Services from '@/components/custom/Home/Services.vue'
import About from '@/components/custom/Home/About.vue'
import Work from '@/components/custom/Home/Work.vue'
import Testimonials from '@/components/custom/Home/Testimonials.vue'
import Contact from '@/components/custom/Home/Contact.vue'

useSeoMeta({
  title: 'Kylva - Luxury E-Commerce Web Development Agency',
  description: 'Crafting exceptional e-commerce experiences exclusively for luxury fashion and beauty brands.',
  ogTitle: 'Kylva - Luxury E-Commerce Web Development Agency',
  ogDescription: 'Crafting exceptional e-commerce experiences exclusively for luxury fashion and beauty brands.',
  ogImage: '/logo.svg',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="size-full">
    <Hero />
    <Services />
    <About />
    <Work />
    <Testimonials />
    <Contact />
  </div>
</template>
```

### Hero Section (`/app/components/custom/Home/Hero.vue`)
**Used in:** Home Page (`index.vue`)

**Section ID:** `#hero`

```vue
<script setup>
const scrollToSection = (id) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <section id="hero" class="relative h-screen flex items-center justify-center overflow-hidden bg-[#fafaf9]">
    <div class="absolute inset-0 animate-scale-in">
      <img
        src="https://images.unsplash.com/photo-1745284504942-2eb53650360a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwbHV4dXJ5JTIwZmFzaGlvbnxlbnwxfHx8fDE3Njc3MjU5NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
        alt=""
        class="w-full h-full object-cover"
      />
    </div>

    <div class="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 text-center">
      <div class="animate-fade-in-up animate-delay-300 opacity-0 mt-11">
        <h1
          class="text-7xl md:text-8xl lg:text-9xl mb-8 tracking-tight"
          style="font-family: 'Cormorant Garamond', serif; font-weight: 300; line-height: 1.1"
        >
          Crafting Digital
          <br />
          <span class="italic" style="font-weight: 400">Elegance</span>
        </h1>
      </div>

      <p
        class="text-base md:text-lg text-gray-600 mb-12 max-w-2xl mx-auto tracking-wide animate-fade-in-up animate-delay-500 opacity-0"
        style="font-family: 'Inter', sans-serif; font-weight: 300"
      >
        We build exceptional e-commerce experiences exclusively for luxury fashion and beauty brands
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up animate-delay-700 opacity-0">
        <button
          @click="scrollToSection('contact')"
          class="px-12 py-5 bg-black text-white text-sm uppercase tracking-[0.3em] transition-all duration-200 hover:scale-105 active:scale-95"
          style="font-family: 'Inter', sans-serif; font-weight: 500"
        >
          Begin Your Journey
        </button>

        <button
          @click="scrollToSection('work')"
          class="text-sm uppercase tracking-[0.3em] text-gray-700 flex items-center gap-3 group transition-transform duration-200 hover:translate-x-1"
          style="font-family: 'Inter', sans-serif; font-weight: 400"
        >
          View Our Work
          <span class="transform group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>
    </div>

    <div class="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-fade-in animate-delay-1200 opacity-0">
      <div class="flex flex-col items-center gap-2 animate-bounce">
        <span class="text-xs uppercase tracking-[0.3em] text-gray-400" style="font-family: 'Inter', sans-serif">
          Scroll
        </span>
        <div class="w-px h-16 bg-linear-to-b from-gray-400 to-transparent" />
      </div>
    </div>
  </section>
</template>
```

---

### Services Section (`/app/components/custom/Home/Services.vue`)
**Used in:** Home Page (`index.vue`)

**Section ID:** `#services`

```vue
<script setup>
const { targetRef, isInView } = useInView({ threshold: 0.2 })

const services = [
  {
    number: "01",
    title: "Fashion E-Commerce",
    description: "Bespoke online stores that embody the essence of luxury fashion. From haute couture to contemporary brands, we create digital experiences that mirror the sophistication of your collections.",
    features: ["Custom Design Systems", "Product Showcases", "Seamless Checkout"],
  },
  {
    number: "02",
    title: "Beauty Platforms",
    description: "Elegant e-commerce solutions for beauty and cosmetics brands. We craft immersive experiences that highlight your products' luxury and effectiveness with refined detail.",
    features: ["Interactive Product Views", "Shade Matching", "Subscription Systems"],
  },
  {
    number: "03",
    title: "Brand Experience",
    description: "More than just a store—a complete digital identity. We develop cohesive experiences that tell your brand's story and connect with discerning customers on a deeper level.",
    features: ["Brand Storytelling", "Editorial Layouts", "Luxury UI/UX"],
  },
]
</script>

<template>
  <section id="services" ref="targetRef" class="py-32 px-6 lg:px-12 bg-white">
    <div class="max-w-7xl mx-auto">
      <div :class="['mb-24 scroll-reveal', { 'revealed': isInView }]">
        <p class="text-xs uppercase tracking-[0.4em] text-[#D4AF37] mb-4" style="font-family: 'Inter', sans-serif">
          What We Do
        </p>
        <h2
          class="text-6xl md:text-7xl lg:text-8xl tracking-tight"
          style="font-family: 'Cormorant Garamond', serif; font-weight: 300; line-height: 1.1"
        >
          Specialized in
          <br />
          <span class="italic" style="font-weight: 400">Luxury Digital</span>
        </h2>
      </div>

      <div class="space-y-24">
        <div
          v-for="(service, index) in services"
          :key="service.number"
          :class="['grid md:grid-cols-12 gap-8 md:gap-12 border-t border-gray-200 pt-12 scroll-reveal', { 'revealed': isInView }]"
          :style="{ animationDelay: `${index * 0.2}s` }"
        >
          <div class="md:col-span-2">
            <span
              class="text-6xl text-gray-200"
              style="font-family: 'Cormorant Garamond', serif; font-weight: 300"
            >
              {{ service.number }}
            </span>
          </div>

          <div class="md:col-span-6">
            <h3
              class="text-4xl md:text-5xl mb-6 tracking-tight"
              style="font-family: 'Cormorant Garamond', serif; font-weight: 400"
            >
              {{ service.title }}
            </h3>
            <p
              class="text-gray-600 leading-relaxed text-lg"
              style="font-family: 'Inter', sans-serif; font-weight: 300"
            >
              {{ service.description }}
            </p>
          </div>

          <div class="md:col-span-4">
            <ul class="space-y-4">
              <li
                v-for="feature in service.features"
                :key="feature"
                class="flex items-center gap-3 text-sm uppercase tracking-[0.2em]"
                style="font-family: 'Inter', sans-serif; font-weight: 400"
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
```

---

### About Section (`/app/components/custom/Home/About.vue`)
**Used in:** Home Page (`index.vue`)

**Section ID:** `#about`

```vue
<script setup>
const { targetRef, isInView } = useInView({ threshold: 0.3 })
</script>

<template>
  <section id="about" ref="targetRef" class="py-32 px-6 lg:px-12 bg-[#fafaf9]">
    <div class="max-w-7xl mx-auto">
      <div class="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div :class="['relative h-[600px] overflow-hidden scroll-reveal', { 'revealed animate-fade-in-left': isInView }]">
          <img
            src="https://images.unsplash.com/photo-1580656940647-8854a00547f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBmYXNoaW9uJTIwc3RvcmV8ZW58MXx8fHwxNzY3NjQ1ODE1fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Luxury store interior"
            class="w-full h-full object-cover transition-transform duration-600 hover:scale-105"
          />
        </div>

        <div :class="['scroll-reveal', { 'revealed animate-fade-in-right': isInView }]" style="animation-delay: 0.2s">
          <p class="text-xs uppercase tracking-[0.4em] text-[#D4AF37] mb-6" style="font-family: 'Inter', sans-serif">
            About Kylva
          </p>

          <h2
            class="text-5xl md:text-6xl lg:text-7xl mb-8 tracking-tight"
            style="font-family: 'Cormorant Garamond', serif; font-weight: 300; line-height: 1.1"
          >
            Where <span class="italic" style="font-weight: 400">Luxury</span>
            <br />
            Meets Technology
          </h2>

          <div class="space-y-6 text-gray-600 text-lg leading-relaxed" style="font-family: 'Inter', sans-serif; font-weight: 300">
            <p>
              Kylva was born from a singular vision: to create digital experiences that match the sophistication and elegance of the world's finest fashion and beauty brands.
            </p>

            <p>
              We understand that luxury isn't just about aesthetics—it's about feeling, experience, and attention to every minute detail. That's why we exclusively focus on fashion and beauty e-commerce, bringing unparalleled expertise to an industry that demands perfection.
            </p>

            <p>
              Our approach combines minimalist design principles with cutting-edge technology, creating platforms that are as functional as they are beautiful. Every line of code, every pixel, every interaction is crafted with the same care your brand puts into its products.
            </p>
          </div>

          <div
            class="mt-12 inline-flex items-center gap-3 text-sm uppercase tracking-[0.3em] cursor-pointer group transition-transform duration-200 hover:translate-x-1"
            style="font-family: 'Inter', sans-serif; font-weight: 500"
          >
            Learn More About Our Process
            <span class="transform group-hover:translate-x-1 transition-transform text-[#D4AF37]">→</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
```

---

### Work/Portfolio Section (`/app/components/custom/Home/Work.vue`)
**Used in:** Home Page (`index.vue`)

**Section ID:** `#work`

```vue
<script setup>
const { targetRef, isInView } = useInView({ threshold: 0.1 })

const projects = [
  {
    title: "Maison Noir",
    category: "Fashion E-Commerce",
    image: "https://images.unsplash.com/photo-1611747581894-45e5f11c7be6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMHdoaXRlJTIwZmFzaGlvbnxlbnwxfHx8fDE3Njc2MjA0NTF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    description: "Contemporary fashion redefined through minimalist digital experience",
  },
  {
    title: "Lumière Beauty",
    category: "Beauty Platform",
    image: "https://images.unsplash.com/photo-1739980296455-3f8d6051ca20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwYmVhdXR5JTIwY29zbWV0aWNzfGVufDF8fHx8MTc2NzczNDA1N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    description: "Luxury cosmetics platform with interactive product discovery",
  },
  {
    title: "Essence",
    category: "Fragrance Store",
    image: "https://images.unsplash.com/photo-1762751629196-1d9a874cdf92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwcGVyZnVtZSUyMGJvdHRsZXxlbnwxfHx8fDE3Njc2NDE3MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    description: "Artisanal perfume brand brought to life through elegant storytelling",
  },
]
</script>

<template>
  <section id="work" ref="targetRef" class="py-32 px-6 lg:px-12 bg-black text-white">
    <div class="max-w-7xl mx-auto">
      <div :class="['mb-24 scroll-reveal', { 'revealed': isInView }]">
        <p class="text-xs uppercase tracking-[0.4em] text-[#D4AF37] mb-4" style="font-family: 'Inter', sans-serif">
          Selected Projects
        </p>
        <h2
          class="text-6xl md:text-7xl lg:text-8xl tracking-tight"
          style="font-family: 'Cormorant Garamond', serif; font-weight: 300; line-height: 1.1"
        >
          Our <span class="italic" style="font-weight: 400">Portfolio</span>
        </h2>
      </div>

      <div class="space-y-32">
        <div
          v-for="(project, index) in projects"
          :key="project.title"
          :class="['group cursor-pointer scroll-reveal', { 'revealed': isInView }]"
          :style="{ animationDelay: `${index * 0.2}s` }"
        >
          <div class="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden mb-8">
            <img
              :src="project.image"
              :alt="project.title"
              class="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
            />

            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500" />
          </div>

          <div class="grid md:grid-cols-12 gap-6">
            <div class="md:col-span-8">
              <h3
                class="text-4xl md:text-5xl lg:text-6xl mb-4 tracking-tight group-hover:text-[#D4AF37] transition-colors duration-300"
                style="font-family: 'Cormorant Garamond', serif; font-weight: 400"
              >
                {{ project.title }}
              </h3>
              <p
                class="text-gray-400 text-lg leading-relaxed"
                style="font-family: 'Inter', sans-serif; font-weight: 300"
              >
                {{ project.description }}
              </p>
            </div>

            <div class="md:col-span-4 flex items-start justify-end">
              <span
                class="text-sm uppercase tracking-[0.2em] text-gray-500"
                style="font-family: 'Inter', sans-serif; font-weight: 400"
              >
                {{ project.category }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div :class="['mt-32 text-center scroll-reveal', { 'revealed': isInView }]" style="animation-delay: 0.8s">
        <button
          class="px-12 py-5 border border-white text-white text-sm uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 active:scale-95"
          style="font-family: 'Inter', sans-serif; font-weight: 500"
        >
          View All Projects
        </button>
      </div>
    </div>
  </section>
</template>
```

---

### Testimonials Section (`/app/components/custom/Home/Testimonials.vue`)
**Used in:** Home Page (`index.vue`)

**Section ID:** `#testimonials`

```vue
<script setup>
const { targetRef, isInView } = useInView({ threshold: 0.2 })

const testimonials = [
  {
    quote: "Kylva transformed our vision into a digital masterpiece. The attention to detail and understanding of luxury e-commerce is unparalleled.",
    author: "Sophie Laurent",
    position: "Creative Director",
    brand: "Maison Noir",
  },
  {
    quote: "Working with Kylva felt like partnering with artisans who truly understand the beauty industry. Our online presence now matches our product quality.",
    author: "Isabella Chen",
    position: "Founder & CEO",
    brand: "Lumière Beauty",
  },
  {
    quote: "The sophistication and elegance they brought to our e-commerce platform exceeded all expectations. Our customers notice the difference.",
    author: "Alexandre Dubois",
    position: "Brand Director",
    brand: "Essence Parfums",
  },
]
</script>

<template>
  <section id="testimonials" ref="targetRef" class="py-32 px-6 lg:px-12 bg-white">
    <div class="max-w-7xl mx-auto">
      <div :class="['mb-24 text-center scroll-reveal', { 'revealed': isInView }]">
        <p class="text-xs uppercase tracking-[0.4em] text-[#D4AF37] mb-4" style="font-family: 'Inter', sans-serif">
          Client Testimonials
        </p>
        <h2
          class="text-6xl md:text-7xl lg:text-8xl tracking-tight"
          style="font-family: 'Cormorant Garamond', serif; font-weight: 300; line-height: 1.1"
        >
          <span class="italic" style="font-weight: 400">Trusted</span> by the Best
        </h2>
      </div>

      <div class="grid lg:grid-cols-3 gap-12">
        <div
          v-for="(testimonial, index) in testimonials"
          :key="testimonial.author"
          :class="['border-t border-gray-200 pt-8 scroll-reveal', { 'revealed': isInView }]"
          :style="{ animationDelay: `${index * 0.2}s` }"
        >
          <p
            class="text-2xl md:text-3xl mb-12 leading-relaxed"
            style="font-family: 'Cormorant Garamond', serif; font-weight: 300; font-style: italic"
          >
            "{{ testimonial.quote }}"
          </p>

          <div>
            <p
              class="text-lg mb-1"
              style="font-family: 'Cormorant Garamond', serif; font-weight: 500"
            >
              {{ testimonial.author }}
            </p>
            <p
              class="text-sm text-gray-500 mb-1"
              style="font-family: 'Inter', sans-serif; font-weight: 300"
            >
              {{ testimonial.position }}
            </p>
            <p
              class="text-xs uppercase tracking-[0.2em] text-[#D4AF37]"
              style="font-family: 'Inter', sans-serif; font-weight: 500"
            >
              {{ testimonial.brand }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
```

---

### Contact Section (`/app/components/custom/Home/Contact.vue`)
**Used in:** Home Page (`index.vue`)

**Section ID:** `#contact`

```vue
<script setup>
const { targetRef, isInView } = useInView({ threshold: 0.3 })

const formData = ref({
  name: "",
  email: "",
  brand: "",
  message: "",
})

const handleSubmit = () => {
  console.log("Form submitted:", formData.value)
}
</script>

<template>
  <section id="contact" ref="targetRef" class="py-32 px-6 lg:px-12 bg-[#fafaf9]">
    <div class="max-w-7xl mx-auto">
      <div class="grid lg:grid-cols-2 gap-16 lg:gap-24">
        <div :class="['scroll-reveal', { 'revealed animate-fade-in-left': isInView }]">
          <p class="text-xs uppercase tracking-[0.4em] text-[#D4AF37] mb-6" style="font-family: 'Inter', sans-serif">
            Get In Touch
          </p>

          <h2
            class="text-5xl md:text-6xl lg:text-7xl mb-8 tracking-tight"
            style="font-family: 'Cormorant Garamond', serif; font-weight: 300; line-height: 1.1"
          >
            Let's Create
            <br />
            <span class="italic" style="font-weight: 400">Something Exceptional</span>
          </h2>

          <p
            class="text-lg text-gray-600 leading-relaxed mb-12"
            style="font-family: 'Inter', sans-serif; font-weight: 300"
          >
            Whether you're launching a new brand or reimagining an existing one, we're here to bring your vision to life with elegance and precision.
          </p>

          <div class="space-y-6">
            <div>
              <p
                class="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2"
                style="font-family: 'Inter', sans-serif"
              >
                Email
              </p>
              <a
                href="mailto:hello@kylva.studio"
                class="text-xl hover:text-[#D4AF37] transition-colors"
                style="font-family: 'Cormorant Garamond', serif; font-weight: 400"
              >
                hello@kylva.studio
              </a>
            </div>

            <div>
              <p
                class="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2"
                style="font-family: 'Inter', sans-serif"
              >
                Phone
              </p>
              <a
                href="tel:+1234567890"
                class="text-xl hover:text-[#D4AF37] transition-colors"
                style="font-family: 'Cormorant Garamond', serif; font-weight: 400"
              >
                +1 (234) 567-890
              </a>
            </div>
          </div>
        </div>

        <div :class="['scroll-reveal', { 'revealed animate-fade-in-right': isInView }]" style="animation-delay: 0.2s">
          <form @submit.prevent="handleSubmit" class="space-y-8">
            <div>
              <label
                for="name"
                class="block text-xs uppercase tracking-[0.3em] mb-3"
                style="font-family: 'Inter', sans-serif; font-weight: 500"
              >
                Your Name
              </label>
              <input
                type="text"
                id="name"
                v-model="formData.name"
                required
                class="w-full border-b border-gray-300 bg-transparent py-3 focus:border-[#D4AF37] focus:outline-none transition-colors text-lg"
                style="font-family: 'Inter', sans-serif; font-weight: 300"
              />
            </div>

            <div>
              <label
                for="email"
                class="block text-xs uppercase tracking-[0.3em] mb-3"
                style="font-family: 'Inter', sans-serif; font-weight: 500"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                v-model="formData.email"
                required
                class="w-full border-b border-gray-300 bg-transparent py-3 focus:border-[#D4AF37] focus:outline-none transition-colors text-lg"
                style="font-family: 'Inter', sans-serif; font-weight: 300"
              />
            </div>

            <div>
              <label
                for="brand"
                class="block text-xs uppercase tracking-[0.3em] mb-3"
                style="font-family: 'Inter', sans-serif; font-weight: 500"
              >
                Brand Name
              </label>
              <input
                type="text"
                id="brand"
                v-model="formData.brand"
                required
                class="w-full border-b border-gray-300 bg-transparent py-3 focus:border-[#D4AF37] focus:outline-none transition-colors text-lg"
                style="font-family: 'Inter', sans-serif; font-weight: 300"
              />
            </div>

            <div>
              <label
                for="message"
                class="block text-xs uppercase tracking-[0.3em] mb-3"
                style="font-family: 'Inter', sans-serif; font-weight: 500"
              >
                Tell Us About Your Project
              </label>
              <textarea
                id="message"
                v-model="formData.message"
                required
                rows="5"
                class="w-full border-b border-gray-300 bg-transparent py-3 focus:border-[#D4AF37] focus:outline-none transition-colors resize-none text-lg"
                style="font-family: 'Inter', sans-serif; font-weight: 300"
              />
            </div>

            <button
              type="submit"
              class="w-full py-5 bg-black text-white text-sm uppercase tracking-[0.3em] transition-all duration-200 hover:scale-105 active:scale-95"
              style="font-family: 'Inter', sans-serif; font-weight: 500"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
```

---

### Navbar Component (`/app/components/custom/general/Navbar.vue`)
**Used in:** Default Layout (`/app/layouts/default.vue`)

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Logo from '@/components/custom/general/Logo.vue'

const scrolled = ref(false)

const scrollToSection = (id) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

onMounted(() => {
  const handleScroll = () => {
    scrolled.value = window.scrollY > 50
  }

  window.addEventListener('scroll', handleScroll)

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
})
</script>

<template>
  <nav
    :class="[
      'fixed top-0 left-0 right-0 z-50 transition-all duration-500 animate-fade-in-down',
      scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-black/20 backdrop-blur-sm'
    ]"
  >
    <div class="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
      <button
        @click="scrollToSection('hero')"
        class="flex items-center transition-transform duration-200 hover:scale-105"
      >
        <Logo :variant="scrolled ? 'black' : 'white'" />
      </button>

      <div class="hidden md:flex items-center gap-12">
        <button
          v-for="item in ['services', 'about', 'work', 'testimonials', 'contact']"
          :key="item"
          @click="scrollToSection(item)"
          :class="[
            'text-sm uppercase tracking-[0.2em] transition-all duration-200 hover:-translate-y-0.5',
            scrolled ? 'text-gray-800 hover:text-gray-600' : 'text-white hover:text-gray-300'
          ]"
          style="font-family: 'Inter', sans-serif; font-weight: 400"
        >
          {{ item }}
        </button>
      </div>

      <button
        @click="scrollToSection('contact')"
        :class="[
          'hidden lg:block px-8 py-3 text-xs uppercase tracking-[0.2em] transition-all duration-200 hover:scale-105 active:scale-95',
          scrolled
            ? 'bg-black text-white hover:bg-gray-900'
            : 'bg-white text-black hover:bg-gray-100'
        ]"
        style="font-family: 'Inter', sans-serif; font-weight: 500"
      >
        Start Project
      </button>
    </div>
  </nav>
</template>
```

---

### Footer Component (`/app/components/custom/general/Footer.vue`)
**Used in:** Default Layout (`/app/layouts/default.vue`)

```vue
<script setup>
import Logo from '@/components/custom/general/Logo.vue'

const currentYear = new Date().getFullYear()

const scrollToSection = (id) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <footer class="bg-black text-white py-16 px-6 lg:px-12">
    <div class="max-w-7xl mx-auto">
      <div class="grid md:grid-cols-3 gap-12 mb-16">
        <div>
          <Logo variant="white" class="mb-6" />
          <p
            class="text-gray-400 text-sm leading-relaxed"
            style="font-family: 'Inter', sans-serif; font-weight: 300"
          >
            Crafting exceptional e-commerce experiences for luxury fashion and beauty brands.
          </p>
        </div>

        <div>
          <h3
            class="text-xs uppercase tracking-[0.3em] mb-6"
            style="font-family: 'Inter', sans-serif; font-weight: 500"
          >
            Quick Links
          </h3>
          <ul class="space-y-3">
            <li v-for="link in ['Services', 'About', 'Work', 'Testimonials', 'Contact']" :key="link">
              <button
                @click="scrollToSection(link.toLowerCase())"
                class="text-gray-400 hover:text-white transition-all duration-200 text-sm hover:translate-x-1"
                style="font-family: 'Inter', sans-serif; font-weight: 300"
              >
                {{ link }}
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3
            class="text-xs uppercase tracking-[0.3em] mb-6"
            style="font-family: 'Inter', sans-serif; font-weight: 500"
          >
            Connect
          </h3>
          <ul class="space-y-3">
            <li>
              <a
                href="mailto:hello@kylva.studio"
                class="text-gray-400 hover:text-white transition-colors text-sm"
                style="font-family: 'Inter', sans-serif; font-weight: 300"
              >
                hello@kylva.studio
              </a>
            </li>
            <li>
              <a
                href="tel:+1234567890"
                class="text-gray-400 hover:text-white transition-colors text-sm"
                style="font-family: 'Inter', sans-serif; font-weight: 300"
              >
                +1 (234) 567-890
              </a>
            </li>
          </ul>

          <div class="flex gap-4 mt-6">
            <a
              v-for="social in ['Instagram', 'LinkedIn', 'Behance']"
              :key="social"
              href="#"
              class="text-xs uppercase tracking-[0.2em] text-gray-400 hover:text-[#D4AF37] transition-all duration-200 hover:-translate-y-1"
              style="font-family: 'Inter', sans-serif; font-weight: 400"
            >
              {{ social }}
            </a>
          </div>
        </div>
      </div>

      <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p
          class="text-xs text-gray-500"
          style="font-family: 'Inter', sans-serif; font-weight: 300"
        >
          © {{ currentYear }} Kylva. All rights reserved.
        </p>
        <div class="flex gap-8">
          <a
            href="#"
            class="text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
            style="font-family: 'Inter', sans-serif; font-weight: 300"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            class="text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
            style="font-family: 'Inter', sans-serif; font-weight: 300"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
```

---

### Thank You Page (`/app/pages/thank-you.vue`)
**Used as:** Standalone confirmation page

```vue
<script setup>
import Button from '@/components/custom/general/Button.vue'

const router = useRouter()

const navigateToHome = () => {
  router.push('/')
}

// SEO Meta Tags for Thank You Page
useSeoMeta({
  title: 'Thank You | Message Received',
  description: 'Your message has been received. We\'ll be in touch soon to discuss your project.',
  ogTitle: 'Thank You | Kylva',
  ogDescription: 'Your message has been received. We\'ll be in touch soon.',
  ogImage: 'https://kylva.com/logo.svg',
  ogUrl: 'https://kylva.com/thank-you',
  twitterTitle: 'Thank You | Kylva',
  twitterDescription: 'Your message has been received. We\'ll be in touch soon.',
  twitterImage: 'https://kylva.com/logo.svg',
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://kylva.com/thank-you'
    }
  ],
  // Prevent indexing of thank you page
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow'
    }
  ]
})
</script>

<template>
  <section class="min-h-[60vh] flex items-center justify-center px-6 py-32">
    <div class="max-w-2xl text-center space-y-12">
      <h1 class="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-[110%] text-foreground">
        Thank you
      </h1>

      <p class="text-lg md:text-xl text-muted-foreground leading-relaxed">
        Your message has been received. We'll be in touch within 24-48 hours to discuss your project.
      </p>

      <Button
        variant="primary"
        text="Back to Home"
        @click="navigateToHome"
      />
    </div>
  </section>
</template>
```

**SEO Note:** This page is set to `noindex, nofollow` to prevent search engine indexing.

---

## SEO Implementation Notes

### Current SEO Configuration
- Homepage Meta Tags: Title, Description, OG Tags, Twitter Card
- Thank You Page: Separate meta tags, noindex directive
- Canonical URLs configured
- Social sharing images defined

### Recommended SEO Enhancements (for Copywriter)
1. **Structured Data (Schema.org):**
   - Organization schema for Kylva
   - LocalBusiness schema
   - Service schema for offerings
   - Portfolio/Project schemas

2. **Copy Needs:**
   - Enhanced page descriptions for social sharing
   - Alt text for all images
   - Meta descriptions for each section/anchor
   - Blog content strategy for thought leadership
   - Case study descriptions for portfolio items

3. **Technical SEO:**
   - XML sitemap configuration
   - Robots.txt optimization
   - Open Graph image specifications
   - Twitter Card image specifications
