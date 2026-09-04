# AGENTS.md — Massive Barbeque

Nuxt 4 (Nitro) BBQ ordering app for Lagos. Frontend in `app/`, backend is file-based Nitro routes in `server/api/`, Supabase (Postgres + Auth) via `supabase-js` (`server/utils/supabase.ts`).

## Commands (npm only, lockfile is `package-lock.json`)

- `npm install` then `npm run dev` (http://localhost:3000). `npm run preview` for prod.
- `postinstall` runs `nuxt prepare` — run it after install if `.nuxt/` types are missing.
- No lint or typecheck scripts. Never run `npm run build` unless the user asks — verify with `npm test` (vitest) instead.
- DB lives in Supabase — schema changes are SQL migrations run in the Supabase dashboard (SQL editor) or CLI. No local migration runner.

## Env

- `.env` is gitignored — never commit it. Key names live in `.env.example`.
- Server reads Supabase keys via `useRuntimeConfig()` (`nuxt.config.ts`). `SUPABASE_SERVICE_ROLE_KEY` is server-only; only `runtimeConfig.public.*` (`NUXT_PUBLIC_*`) reaches the client. Do not expose `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`, `RESEND_API_KEY` to client code.

## Structure

- Pages: `index.vue` (BBQ landing + featured products), `menu.vue`, `product/[id].vue`, `cart.vue`, `checkout.vue`, `checkout/confirm.vue`, `login.vue`, `register.vue`, `dashboard/` (index, orders, orders/[id], profile), `admin/` (index, products, products/new, products/[id], orders, orders/[id]). Layouts: `default` (Navbar + `<slot/>` + Footer), `dashboard`, `admin`.
- `app/components/custom/ecommerce/` (ProductCard, CartItem, OrderStatus) and `app/components/custom/admin/` (ProductForm, OrderTable) are the shop components; `app/components/custom/{Home,general}/` holds legacy landing sections (only Navbar/Footer/Logo still used); `app/components/ui/` = shadcn-vue (`new-york`, `typescript: false`, lucide icons). Import via `@/components/...`, `@/lib/utils`.
- Client state: `app/composables/useAuth.ts` (session, login/register/logout, `isAdmin`) and `useCart.ts` (items, subtotal, add/update/remove). New `.vue` SFCs using TS must declare `<script setup lang="ts">` — the repo's older files are plain JS and the build fails otherwise.
- Styling is Tailwind v4: `@import "tailwindcss"` + `@theme inline` in `app/assets/css/main.css`, wired via `@tailwindcss/vite` in `nuxt.config.ts`. No `tailwind.config`.
- Client plugins must be `*.client.ts` (`app/plugins/: aos, lenis, flutterwave`). Lenis smooth-scroll resets on `page:finish`.
- `server/api/**/*.get|post|put|delete.ts` = routes (`orders.post.ts` vs `orders/[id].get.ts` pattern). Subdirs: `auth/` (Supabase Auth), `cart/`, `products/`, `categories/`, `orders/`, `payments/{paystack,flutterwave,webhooks}/`, `admin/{orders,products}/`. Shared Supabase clients live in `server/utils/supabase.ts` (user-scoped + service-role) — use them.
- Schema source of truth: Supabase Postgres (tables mirror the old `server/db/schema.ts` domains: auth users + `categories/products/productVariants/addresses/carts/cartItems/orders/orderItems/payments`). RLS policies enforce owner/admin access — the API relies on them, never bypass with service-role for user data.

## Gotchas

- `docs/` (`brief.md`, `prd.md`) is the old **Kylva agency** template — do not treat it as spec. Trust `server/db/schema.ts`, `server/api/`, `nuxt.config.ts` (site `massivebarbeque.com`, Restaurant schema), and `.env.example`.
- Nuxt 4 `~/` resolves to `app/`, so server code must import sibling modules via `~~/server/...` (e.g. `~~/server/utils/supabase`), never `~/server/...` — the latter breaks the Nitro build (`ENOENT .../app//server/...`).
- Auth: Supabase Auth (email/password) via `server/utils/supabase.ts`. Client session comes from `@supabase/ssr` cookie storage — never roll custom cookie handling. Admin role lives in `app_metadata.role`; first admin comes from the `ADMIN_EMAILS` allow-list (promoted on sign-up/sign-in — no in-app self-promotion). Auth endpoints are rate-limited (`server/utils/rateLimit.ts`: login 10/15min, register 5/hr per IP; in-memory, single-instance only). `colorMode` is pinned to light (`preference/fallback: "light"`).
- Guards: API uses `requireUser`/`requireAdmin` from `server/utils/supabase.ts` (`requireAdmin` denies missing roles — never fail open); pages use `app/middleware/auth.ts` (dashboard) and `admin.ts` (admin, non-admins → `/`, guests → `/login?redirect=`). Login/register only honor internal `redirect` paths (open-redirect protection). Global security headers live in `routeRules` in `nuxt.config.ts`.
- Orders: `GET /api/orders/[id]` allows owner, `role === "admin"`, or guest orders (`userId` null) — keep that shape so the checkout-confirm page works for guests.
- Payments/email: Paystack + Flutterwave initialize/verify + webhook handlers under `server/api/payments/` (Paystack webhook validates `x-paystack-signature`); emails via Resend. Totals/prices are `decimal` strings — convert before arithmetic. Checkout delivery fee is a hardcoded ₦2,000 in `server/api/orders.post.ts` and mirrored in `app/pages/checkout.vue` — change both together.
- Forms: `vee-validate` + `zod`; toasts via `vue-sonner` `<Toaster>` in `app/app.vue`. GA4 is hand-injected in `app/app.vue` from `config.public.gaId` with manual `page_view` on route change — don't double-instrument.
