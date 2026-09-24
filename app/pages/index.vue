<script setup lang="ts">
import HeroSection from "@/components/custom/landing/HeroSection.vue";
import FreshOffGrill from "@/components/custom/landing/FreshOffGrill.vue";
import HowItWorks from "@/components/custom/landing/HowItWorks.vue";
import Testimonials from "@/components/custom/landing/Testimonials.vue";
import VisitUs from "@/components/custom/landing/VisitUs.vue";

useSeoMeta({
  // Brand-first homepage title: bypass the global "%s | Massive Barbeque"
  // template so it doesn't stutter.
  titleTemplate: "%s",
  title: "Massive Barbeque — Premium BBQ in Lagos",
  description:
    "Order premium Barbeque in Lagos: barbeque catfish, chicken, turkey, croaker and sides. Delivery and pickup available.",
  ogTitle: "Massive Barbeque — Premium BBQ in Lagos",
  ogDescription:
    "Order premium Barbeque in Lagos: barbeque catfish, chicken, turkey, croaker and sides.",
  ogImage: "/og-image.jpeg",
  twitterCard: "summary_large_image",
});

useSchemaOrg([
  {
    "@type": "WebPage",
    "@id": "https://massivebarbeque.com/#webpage",
    name: "Massive Barbeque — Premium BBQ in Lagos",
    url: "https://massivebarbeque.com",
    isPartOf: { "@id": "https://massivebarbeque.com/#website" },
    about: { "@id": "https://massivebarbeque.com/#restaurant" },
  },
]);

const hero = {
  eyebrow: "Lagos · Nigeria",
  titleTop: "Fire-grilled BBQ,",
  titleAccent: "delivered hot.",
  description:
    "Barbeque catfish, chicken, turkey, croaker and sides — grilled to order. Delivery across Lagos or quick pickup.",
  imageSrc: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
  imageAlt: "Fire-grilled BBQ skewers, wings and sides with pepper sauces",
  primaryCta: { label: "Order now", to: "/menu" },
  secondaryCta: { label: "View menu", to: "/menu" },
};

const grill = {
  eyebrow: "Customer favourites",
  title: "Fresh off the grill",
  browseLabel: "See full menu →",
  browseTo: "/menu",
  emptyLead: "Our menu is firing up —",
  emptyCtaLabel: "browse all items",
  emptyCtaTo: "/menu",
};

const steps = [
  {
    icon: "local_fire_department",
    title: "Pick your BBQ",
    text: "Catfish, chicken, turkey, croaker — choose a size and sides.",
  },
  {
    icon: "payments",
    title: "Pay securely",
    text: "Paystack or Flutterwave. Cards, transfers, and more.",
  },
  {
    icon: "delivery_dining",
    title: "Delivery or pickup",
    text: "Hot delivery across Lagos, or grab it fresh at pickup.",
  },
];

const testimonials = {
  eyebrow: "Word on the street",
  title: "Lagos keeps coming back",
  rating: "4.9",
  ratingLabel: "from 2,000+ verified orders",
  reviews: [
    {
      quote: "The catfish is unreal — smoky, peppery, still sizzling on arrival. Best BBQ I've had in Lagos.",
      name: "Adaeze O.",
      area: "Lekki",
      dish: "Barbeque Catfish",
    },
    {
      quote: "Ordered turkey and croaker for a family hangout. Hot, fast, and the portions are generous.",
      name: "Tunde B.",
      area: "Ikeja",
      dish: "Grilled Turkey",
    },
    {
      quote: "Checkout took a minute and payment was smooth. My new weekend ritual, no contest.",
      name: "Funmi A.",
      area: "Surulere",
      dish: "Croaker & Sides",
    },
    {
      quote: "That pepper sauce should be illegal. Chicken was juicy all the way through — nothing dry about it.",
      name: "Chidi E.",
      area: "Victoria Island",
      dish: "Grilled Chicken",
    },
    {
      quote: "Fed 15 people at my birthday with two platters. Everyone asked who catered. Enough said.",
      name: "Bisi A.",
      area: "Yaba",
      dish: "Party Platter",
    },
    {
      quote: "Delivery beat the estimate by 20 minutes and everything arrived hot. Rare for Lagos, honestly.",
      name: "Emeka N.",
      area: "Ajah",
      dish: "Barbeque Catfish",
    },
    {
      quote: "The asun-style turkey is my obsession. Smoky, spicy, perfect with cold Chapman on the side.",
      name: "Kemi S.",
      area: "Ikoyi",
      dish: "Grilled Turkey",
    },
    {
      quote: "Ordered pickup on my way home — ready when I got there, still grilling when I walked in.",
      name: "Femi O.",
      area: "Maryland",
      dish: "Grilled Chicken",
    },
  ],
};

const visit = {
  eyebrow: "Get it hot",
  title: "Craving BBQ right now?",
  description:
    "Order in minutes and track it to your door — or reach out for bulk and party orders.",
  info: [
    { icon: "location_on", label: "Find us", value: "Lagos, Nigeria" },
    { icon: "schedule", label: "Hours", value: "Open daily · delivery across Lagos" },
    { icon: "mail", label: "Contact", value: "info@massivebarbeque.com" },
  ],
  primaryCta: { label: "Order now", to: "/menu" },
  secondaryCta: { label: "Contact us", to: "mailto:info@massivebarbeque.com" },
};

const { data: featured } = await useAsyncData("featured-products", async () => {
  try {
    // Featured first, backfilled with latest actives so the 4-up
    // rail is always full even when <4 products are flagged.
    const [fav, latest] = await Promise.all([
      $fetch<{ products: any[] }>("/api/products", { params: { featured: "true", limit: 4 } }).then((r) => r.products ?? []),
      $fetch<{ products: any[] }>("/api/products", { params: { limit: 4 } }).then((r) => r.products ?? []),
    ]);
    const seen = new Set<number>();
    const merged: any[] = [];
    for (const p of [...fav, ...latest]) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        merged.push(p);
      }
      if (merged.length === 4) break;
    }
    return merged;
  } catch {
    return [];
  }
});
</script>

<template>
  <div class="size-full">
    <HeroSection v-bind="hero" />

    <FreshOffGrill v-bind="grill" :products="(featured ?? []) as Record<string, any>[]" />

    <HowItWorks :steps="steps" />

    <Testimonials v-bind="testimonials" />

    <VisitUs v-bind="visit" />
  </div>
</template>
