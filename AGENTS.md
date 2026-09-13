# AGENTS.md — Massive Barbeque

Nuxt 4 (Nitro) BBQ ordering app. Frontend in `app/`, file-based Nitro routes in `server/api/`, Supabase (Postgres + Auth) via `server/utils/supabase.ts`. Pricing helpers in `shared/utils/pricing.ts`.

## Commands (npm only — lockfile is `package-lock.json`)

- `npm install` then `npm run dev` (http://localhost:3000). `postinstall` runs `nuxt prepare` — rerun if `.nuxt/` types are missing.
- Verify with `npm test` (vitest); single suite: `npx vitest run tests/pricing.test.ts` (`tests/`: pricing, rateLimit, orderStatus). Never run `npm run build` unless asked.
- DB lives in Supabase: schema in `supabase/migrations/` (`0001_initial_schema.sql`), seed via `supabase/seed.mjs`. No local migration runner.

## Env

- `.env` is gitignored — never commit it; key names live in `.env.example`.
- Server reads keys via `useRuntimeConfig()` (`nuxt.config.ts`). `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`, `RESEND_API_KEY` are server-only; only `runtimeConfig.public.*` (`NUXT_PUBLIC_*`) reaches the client.

## Structure

- Pages (`app/pages/`): `index`, `menu`, `product/[id]`, `checkout`, `checkout/confirm`, `login`, `register`, `forgot-password`, `reset-password`, `dashboard/` (index, orders, orders/[id], profile), `admin/` (index, orders, orders/[id], products — single `products.vue` + dialog, no `products/new`). Layouts: `default`, `dashboard`, `admin`.
- Components: shop UI in `app/components/custom/{ecommerce,product,admin}/` (ProductCard, CartItem, OrderStatus, OrderTable, ProductDialog/AdminProductCard); `custom/{landing,general}/` is legacy landing — only Navbar/Footer/shared still used. `app/components/ui/` = shadcn-vue (`new-york`, `typescript: false`, lucide). Aliases per `components.json`: `@/components/...`, `@/lib/utils`.
- SFCs are mixed plain `<script setup>` and `<script setup lang="ts">` — match the surrounding file.
- Client state: `useAuth.ts` (session, `isAdmin` from `app_metadata.role`), `useSupabase.ts`, `useAdminProducts.ts`. Cart is local-first: `app/composables/useCart.ts` + `cart/{types,storage,ops}` (pure ops, localStorage-persisted, zero network until checkout). Checkout posts `{variantId, quantity}[]`; `orders.post.ts` reprices from the live catalog and writes via service role (RLS has no customer order-insert policy — identity from session, money from DB, never the client). Guest order reads use service role + code authz in `orders/[id].get.ts` (owner/admin/`user_id` null). There are no `/api/cart*` routes. Styling is Tailwind v4 (`@import "tailwindcss"` in `app/assets/css/main.css` via `@tailwindcss/vite`; no `tailwind.config`) with M3 tokens — see `MATERIAL-3-DESIGN-PRINCIPLES.md` for UI work. `colorMode` is dark-only (`preference: "dark"`, `fallback: "dark"`, `storageKey: "massive-theme"` — no light mode, no theme toggle).
- Mobile-first is mandatory: every UI change/addition MUST be mobile-responsive (base styles for small screens, `sm:`/`md:`/`lg:` up; grids collapse to 1–2 cols, tap targets ≥40px). Never ship desktop-only layouts.
- Client plugins must be `*.client.ts` (`app/plugins/`: aos, lenis, flutterwave, supabase). Lenis resets scroll on `page:finish`. Lenis owns window scroll — any modal/sheet MUST pair it with `lenis.stop()`/`start()` (see Navbar sheet lock) plus body `overflow` lock, or the background keeps scrolling behind the overlay.
- API: `server/api/**/*.get|post|put|delete.ts` (`orders.post.ts` vs `orders/[id].get.ts` pattern). Subdirs: `auth/`, `products/`, `categories/`, `orders/`, `payments/{paystack,flutterwave,webhooks}/`, `admin/{orders,products,variants,customers}/`. Use `getSupabase(event)` (user-scoped, RLS applies) for user data; `getServiceSupabase()` bypasses RLS — admin/webhook-only, plus order create/read (no customer RLS policies there; authz in code).
- Pricing: `shared/utils/pricing.ts` is the single source (`DELIVERY_FEE_FLAT = 2000`, `orderTotals`/`deliveryFeeFor`, `toAmount` for Postgres `decimal` strings, `toKobo` for Paystack). Both `server/api/orders.post.ts` and `app/pages/checkout/index.vue` use it — never hardcode the fee on either side.

## Gotchas

- `docs/` (`brief.md`, `prd.md`) is the old Kylva agency template — not spec. Trust `supabase/migrations/`, `server/api/`, `nuxt.config.ts` (site `massivebarbeque.com`, Restaurant schema), `.env.example`. There is no `server/db/schema.ts`.
- Nuxt 4 `~/` resolves to `app/`, so server code must import via `~~/server/...` (e.g. `~~/server/utils/supabase`), never `~/server/...` — the latter breaks the Nitro build.
- Auth: Supabase Auth email/password, `@supabase/ssr` cookie session — never roll custom cookies. Admin role lives in `app_metadata.role`; `ADMIN_EMAILS` allow-list promotes on sign-up/sign-in (`server/utils/adminBootstrap.ts`) — no in-app self-promotion. Owners (`OWNER_EMAILS`, fallback `ADMIN_EMAILS`) manage admins at `/admin/admins` (`GET/POST/DELETE /api/admin/admins`, audited) — sticky until explicitly demoted, owners env-only, see `docs/payment-webhooks.md`. Register treats duplicate email as sign-in attempt (password must still match — don't "fix" this). Rate-limited (`server/utils/rateLimit.ts`, in-memory single-instance): login 10/15min, register 5/hr per IP.
- Guards: API `requireUser`/`requireAdmin` (deny missing roles, never fail open); pages `app/middleware/auth.ts` (dashboard) and `admin.ts` (guests → `/login?redirect=`, non-admins → `/`) — both server-safe via `/api/auth/session`. Login/register only honor internal `redirect` (`startsWith("/")` and not `"//"`). Security headers in `nuxt.config.ts` `routeRules` are defense-in-depth only.
- Orders: `GET /api/orders/[id]` allows owner, `role === "admin"`, or guest orders (`user_id` null) — keep that shape for the guest checkout-confirm page.
- Payments/email: Paystack + Flutterwave initialize/verify + webhooks under `server/api/payments/`; Paystack webhook must HMAC-verify `x-paystack-signature` over the **raw** body (`readRawBody`), not parsed JSON. Webhooks are the only DB writer for paid status and need a public URL — deployment checklist in `docs/payment-webhooks.md`. Emails via Resend.
- Forms: `vee-validate` + `zod`; toasts via `vue-sonner` `<Toaster>` in `app/app.vue`. GA4 is hand-injected there from `config.public.gaId` with manual `page_view` on route change — don't double-instrument.
