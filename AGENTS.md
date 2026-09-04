# AGENTS.md — Massive Barbeque

Nuxt 4 (Nitro) BBQ ordering app for Lagos. Frontend in `app/`, backend is file-based Nitro routes in `server/api/`, Postgres via Drizzle (`server/db/`).

## Commands (npm only, lockfile is `package-lock.json`)

- `npm install` then `npm run dev` (http://localhost:3000). `npm run build` / `npm run preview` for prod.
- `postinstall` runs `nuxt prepare` — run it after install if `.nuxt/` types are missing.
- No lint, typecheck, or test scripts. No CI/pre-commit. Verify with `npm run build`.
- DB (requires `DATABASE_URL`): `npm run db:generate` → `npm run db:push` (dev, no migration files) or `npm run db:migrate` (prod). `npm run db:studio` to inspect.
- Neon: `DATABASE_URL` = **pooled** (`-pooler` host) for runtime; `DIRECT_URL` = **direct** host for `drizzle-kit` only (`drizzle.config.ts` uses `DIRECT_URL || DATABASE_URL`). Pooled PgBouncer transaction mode breaks some DDL, so never migrate over the pooler.

## Env

- Copy `.env.example` to `.env`. Never commit `.env` (gitignored).
- Server reads `process.env.DATABASE_URL` directly in `server/db/index.ts`; everything else goes through `useRuntimeConfig()` (`nuxt.config.ts`). Private keys are server-only; only `runtimeConfig.public.*` (`NUXT_PUBLIC_*`) reaches the client. Do not expose `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`, `RESEND_API_KEY`, `BETTER_AUTH_SECRET` to client code.
- `BETTER_AUTH_URL` must match the running origin (e.g. `http://localhost:3000` locally).

## Structure

- `app/pages/index.vue` — currently the only page (single landing page composing `app/components/custom/Home/*.vue`). `app/layouts/default.vue` = Navbar + `<slot/>` + Footer.
- `app/components/custom/{Home,general}/` = hand-written sections; `app/components/ui/` = shadcn-vue (`new-york`, `typescript: false`, lucide icons). Import via `@/components/...`, `@/lib/utils`.
- Styling is Tailwind v4: `@import "tailwindcss"` + `@theme inline` in `app/assets/css/main.css`, wired via `@tailwindcss/vite` in `nuxt.config.ts`. No `tailwind.config`.
- Client plugins must be `*.client.ts` (`app/plugins/: aos, lenis, flutterwave`). Lenis smooth-scroll resets on `page:finish`.
- `server/api/**/*.get|post|put|delete.ts` = routes (`orders.post.ts` vs `orders/[id].get.ts` pattern). Subdirs: `auth/`, `cart/`, `products/`, `categories/`, `orders/`, `payments/{paystack,flutterwave,webhooks}/`, `admin/{orders,products}/`.
- Schema source of truth: `server/db/schema.ts` (Better-Auth `user/session/account/verification` + `categories/products/productVariants/addresses/carts/cartItems/orders/orderItems/payments`). `drizzle.config.ts`: schema `./server/db/schema.ts`, out `./drizzle` (not yet generated — run `db:generate`).

## Gotchas

- `docs/` (`brief.md`, `prd.md`) and `app/app.vue`, `app/pages/index.vue`, `server/api/contact.post.ts` still contain the old **Kylva agency** template (wrong brand/SEO/copy). Do not treat docs as spec; trust `server/db/schema.ts`, `server/api/`, `nuxt.config.ts` (site `massivebarbeque.com`, Restaurant schema), and `.env.example`.
- `nuxt.config.ts` ends with a bogus local `function defineNuxtConfig(...) { throw ... }` stub shadowing Nuxt's global. Delete it; keep only `export default defineNuxtConfig({...})`.
- `server/db/schema.ts` defines **no Drizzle relations**, but `server/api/products/index.get.ts` uses `db.query.products.findMany({ with: { variants, category } })`. That query fails until relations are added — fix schema first if touching product reads.
- `server/db/index.ts` uses `postgres-js` with `prepare: false` (pgBouncer mode) and throws at import if `DATABASE_URL` is unset. Every `server/api/*` importing `db` inherits this.
- Nuxt 4 `~/` resolves to `app/`, so server code must import sibling modules via `~~/server/...` (e.g. `~~/server/db`), never `~/server/...` — the latter breaks the Nitro build (`ENOENT .../app//server/db`).
- `drizzle.config.ts` uses `dialect: 'postgresql'` + `dbCredentials.url` — ensure `DIRECT_URL`/`DATABASE_URL` is exported in the shell running `drizzle-kit`.
- Auth: `server/auth.config.ts` = better-auth + `drizzleAdapter(provider: "pg")`, email/password, no email verification. `colorMode` is pinned to light (`preference/fallback: "light"`).
- Payments/email: Paystack + Flutterwave initialize/verify + webhook handlers under `server/api/payments/`; emails via Resend (`server/api/contact.post.ts`). Totals/prices are `decimal` strings — convert before arithmetic.
- Forms: `vee-validate` + `zod`; toasts via `vue-sonner` `<Toaster>` in `app/app.vue`. GA4 is hand-injected in `app/app.vue` from `config.public.gaId` with manual `page_view` on route change — don't double-instrument.
