// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: process.env.NODE_ENV !== "production" },
  modules: [
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxtjs/color-mode",

    "@nuxtjs/seo",
  ],
  css: ["./app/assets/css/main.css"],
  components: [
    // Nuxt defaults (array form replaces them, so they must be listed to
    // preserve behavior) plus one tweak below.
    { path: "~/components/islands", island: true },
    { path: "~/components/global", global: true },
    {
      path: "~/components",
      // shadcn-vue barrel re-exports are importable modules, not components.
      // Without this each `ui/*/index.{js,ts}` registers as `Ui*` and
      // collides with its `*.vue` twin (duplicate-component warnings).
      // Explicit `import { X } from "@/components/ui/..."` keeps working —
      // `ignore` only affects auto-scanning, not module resolution.
      ignore: ["**/ui/**/index.{js,ts}"],
    },
  ],
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

  // Color Mode Configuration (dark-only: light theme removed)
  colorMode: {
    classSuffix: "",
    preference: "dark",
    fallback: "dark",
    // Fresh key so any "light" stored by the old toggle is ignored.
    storageKey: "massive-theme",
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
        // Favicons owned by app/app.vue (real brand submark) — kept here:
        // font preconnections + Material Symbols only.
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
        { name: "theme-color", content: "#D84315" },
        { name: "msapplication-TileColor", content: "#D84315" },
      ],
    },
  },

  // Robots Configuration (private areas stay out of the index;
  // per-page `robots: noindex` in layouts/pages backs this up)
  robots: {
    allow: "/",
    disallow: ["/admin", "/dashboard", "/checkout", "/login", "/register", "/forgot-password", "/reset-password"],
    sitemap: "https://massivebarbeque.com/sitemap.xml",
  },

  // Sitemap Configuration
  sitemap: {
    // All sources are static (`urls` below) — prerender at build time and
    // skip the runtime sitemap handlers to shrink the server bundle.
    zeroRuntime: true,
    strictNuxtContentPaths: true,
    // Product pages come from /api/__sitemap__/urls (fail-soft: empty on
    // DB error so a Supabase blip never breaks the build). Prerendered
    // below via nitro.prerender.routes.
    sources: ["/api/__sitemap__/urls"],
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
      logo: "https://massivebarbeque.com/images/Food/Logos/Primary.png",
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

  // OG Image Configuration (module defaults — no custom component)
  ogImage: {
    enabled: true,
  },

  // Prerender the sitemap product source at build time.
  nitro: {
    prerender: {
      routes: ["/api/__sitemap__/urls"],
    },
  },

  // Security headers (defense in depth; app-level auth is enforced
  // in server routes + route middleware, not by these alone).
  // CSP allowlist covers: self, Google Fonts, GA4, Paystack + Flutterwave
  // inline checkout (scripts/frames/API), product imagery (Unsplash +
  // Supabase storage), and the Supabase API the browser client calls.
  // `script-src` keeps 'unsafe-inline' because @nuxtjs/color-mode applies
  // the theme via an inline script and GA4 bootstraps inline — without it
  // the app renders light mode and analytics dies. `ws:`/`wss:` keep
  // Vite HMR working in dev.
  routeRules: {
    "/**": {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://js.paystack.co https://checkout.flutterwave.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https://images.unsplash.com https://*.supabase.co",
          "connect-src 'self' ws: wss: https://*.supabase.co https://api.paystack.co https://api.flutterwave.com https://www.google-analytics.com https://region1.google-analytics.com",
          "frame-src https://checkout.paystack.com https://checkout.flutterwave.com",
          "frame-ancestors 'none'",
          "object-src 'none'",
          "base-uri 'self'",
        ].join("; "),
      },
    },
  },

  runtimeConfig: {
    // Private keys (only available on server-side)
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    // Comma-separated emails given the admin role on sign-up/sign-in.
    adminEmails: process.env.ADMIN_EMAILS || "",
    // Owners manage admins (promote/demote). Empty falls back to ADMIN_EMAILS.
    ownerEmails: process.env.OWNER_EMAILS || "",
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL,
    contactReceiverEmail: process.env.CONTACT_RECEIVER_EMAIL,
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
    flutterwaveSecretKey: process.env.FLUTTERWAVE_SECRET_KEY,
    // Signs guest-order tokens (order reads, pay init/verify). Falls back
    // to the service-role key when unset — set explicitly in production.
    guestTokenSecret: process.env.GUEST_TOKEN_SECRET || "",

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

