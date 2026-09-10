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
    build: {
      rollupOptions: {
        output: {
          // Split heavy admin-only vendors into their own chunks so the
          // initial client bundle stays lean; they're loaded on demand
          // via defineAsyncComponent in app/pages/admin/index.vue.
          manualChunks(id) {
            if (id.includes("node_modules/@unovis")) return "unovis";
            if (id.includes("node_modules/@tanstack")) return "vue-table";
          },
        },
      },
    },
  },

  // Image optimization (hero + product imagery)
  image: {
    domains: ["images.unsplash.com"],
  },

  // Color Mode Configuration (M3 light + dark schemes; class strategy drives .dark)
  colorMode: {
    classSuffix: "",
    fallback: "light",
    preference: "system",
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
        // M3 icon system (Material Symbols Outlined, variable axes)
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap",
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
    // All sources are static (`urls` below) — prerender at build time and
    // skip the runtime sitemap handlers to shrink the server bundle.
    zeroRuntime: true,
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

  // Security headers (defense in depth; app-level auth is enforced
  // in server routes + route middleware, not by these alone).
  routeRules: {
    "/**": {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      },
    },
  },

  runtimeConfig: {
    // Private keys (only available on server-side)
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    // Comma-separated emails given the admin role on sign-up/sign-in.
    adminEmails: process.env.ADMIN_EMAILS || "",
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL,
    contactReceiverEmail: process.env.CONTACT_RECEIVER_EMAIL,
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
    flutterwaveSecretKey: process.env.FLUTTERWAVE_SECRET_KEY,

    // Public keys (exposed to client-side)
    public: {
      supabaseUrl: process.env.SUPABASE_URL || "",
      supabaseKey: process.env.SUPABASE_KEY || "",
      appName: process.env.NUXT_PUBLIC_APP_NAME || "Massive Barbeque",
      appUrl: process.env.NUXT_PUBLIC_APP_URL || "https://massivebarbeque.com",
      appDescription: process.env.NUXT_PUBLIC_APP_DESCRIPTION || "Premium BBQ Catering in Lagos",
      paystackPublicKey: process.env.NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
      flutterwavePublicKey: process.env.NUXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || "",
      gaId: process.env.NUXT_PUBLIC_GA_ID || "", // Google Analytics 4 ID
    },
  },
});

