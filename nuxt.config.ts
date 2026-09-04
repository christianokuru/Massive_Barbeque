// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxtjs/color-mode",

    "@nuxtjs/seo",
  ],
  css: ["./app/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },

  // Color Mode Configuration
  colorMode: {
    classSuffix: "",
    fallback: "light",
    preference: "light",
  },

  // SEO Configuration
  site: {
    url: "https://massivebarbeque.com",
    name: "Massive Barbeque",
    description:
      "Premium BBQ catering in Lagos, Nigeria. Order delicious barbeque catfish, chicken, turkey, croaker, and sides online. Delivery and pickup available.",
    defaultLocale: "en",
    identity: {
      type: "Restaurant",
    },
  },

  // App Configuration
  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      htmlAttrs: {
        lang: "en",
      },
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
        { rel: "apple-touch-icon", href: "/logo.svg" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "anonymous",
        },
      ],
      meta: [
        { name: "theme-color", content: "#FF6B35" },
        { name: "msapplication-TileColor", content: "#FF6B35" },
      ],
    },
  },

  // Robots Configuration
  robots: {
    allow: "/",
    sitemap: "https://massivebarbeque.com/sitemap.xml",
  },

  // Sitemap Configuration
  sitemap: {
    strictNuxtContentPaths: true,
    urls: [
      {
        loc: "/",
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: 1.0,
      },
      {
        loc: "/menu",
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: 0.9,
      },
      {
        loc: "/about",
        lastmod: new Date().toISOString(),
        changefreq: "monthly",
        priority: 0.7,
      },
      {
        loc: "/contact",
        lastmod: new Date().toISOString(),
        changefreq: "monthly",
        priority: 0.8,
      },
    ],
  },

  // SEO Meta Tags
  seo: {
    meta: {
      description:
        "Order premium BBQ in Lagos, Nigeria. Delicious barbeque catfish, chicken, turkey, croaker, and sides available for delivery and pickup.",
      keywords:
        "Lagos BBQ, barbeque catfish, grilled chicken, turkey delivery, croaker fish, Nigerian BBQ, food delivery Lagos, catering services, grilled food, barbecue restaurant",
      author: "Massive Barbeque",
      ogImage: "/og-image.png",
      twitterCard: "summary_large_image",
      twitterSite: "@massivebarbeque",
    },
  },

  // Link Checker (disable broken link warnings in dev)
  linkChecker: {
    enabled: false,
  },

  // Schema.org Configuration
  schemaOrg: {
    identity: {
      type: "Restaurant",
      name: "Massive Barbeque",
      url: "https://massivebarbeque.com",
      logo: "https://massivebarbeque.com/logo.svg",
      email: "info@massivebarbeque.com",
      description:
        "Premium BBQ catering in Lagos, Nigeria. Specializing in barbeque catfish, chicken, turkey, croaker, and delicious sides.",
      address: {
        type: "PostalAddress",
        addressLocality: "Lagos",
        addressCountry: "NG",
      },
      sameAs: [
        "https://twitter.com/massivebarbeque",
        "https://www.instagram.com/massivebarbeque",
        "https://www.facebook.com/massivebarbeque",
      ],
      areaServed: [
        {
          type: "City",
          name: "Lagos",
        },
      ],
      servesCuisine: [
        "Barbecue",
        "Nigerian",
        "Grilled Fish",
        "African",
      ],
      priceRange: "$$",
    },
  },

  // OG Image Configuration
  ogImage: {
    enabled: true,
    defaults: {
      component: "OgImage",
      props: {
        logo: "/logo.svg",
      },
    },
  },

  runtimeConfig: {
    // Private keys (only available on server-side)
    databaseUrl: process.env.DATABASE_URL,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    betterAuthUrl: process.env.BETTER_AUTH_URL,
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL,
    contactReceiverEmail: process.env.CONTACT_RECEIVER_EMAIL,
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
    flutterwaveSecretKey: process.env.FLUTTERWAVE_SECRET_KEY,

    // Public keys (exposed to client-side)
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || "Massive Barbeque",
      appUrl: process.env.NUXT_PUBLIC_APP_URL || "https://massivebarbeque.com",
      appDescription: process.env.NUXT_PUBLIC_APP_DESCRIPTION || "Premium BBQ Catering in Lagos",
      paystackPublicKey: process.env.NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
      flutterwavePublicKey: process.env.NUXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || "",
      gaId: process.env.NUXT_PUBLIC_GA_ID || "", // Google Analytics 4 ID
    },
  },
});

