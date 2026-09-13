# Massive Barbeque — Project Scope

> Re-onboarding doc. Sources of truth: `AGENTS.md`, `nuxt.config.ts`, `supabase/migrations/`, `server/api/`, `shared/utils/pricing.ts`, `.env.example`. `docs/` is legacy Kylva agency template — not spec.

## What it is
Nuxt 4 (Nitro) BBQ ordering app for `massivebarbeque.com` — premium BBQ catering in Lagos (catfish, chicken, turkey, croaker, sides). Guest-capable shop: browse menu → product → cart → checkout → Paystack/Flutterwave → confirm. Customer dashboard + admin console + owner admin-governance.

## Stack
- Nuxt 4, Vue 3, Tailwind v4 (`@tailwindcss/vite`, no `tailwind.config`), shadcn-vue (`new-york`), lucide, M3 tokens (`MATERIAL-3-DESIGN-PRINCIPLES.md`)
- Supabase Postgres + Auth (`@supabase/ssr` cookie session), Resend email, Paystack + Flutterwave, GA4 hand-injected in `app/app.vue`, vee-validate + zod, vue-sonner `<Toaster>`
- Tests: vitest (`tests/`: pricing, cartStore, rateLimit, orderStatus, siteUrl, adminGovernance — 47 passing)

## Commands (npm only)
- `npm install` → `npm run dev` (:3000). `postinstall` runs `nuxt prepare`.
- `npm test` / `npx vitest run tests/<name>.test.ts`. Never `npm run build` unless asked.
- DB in Supabase cloud: schema `supabase/migrations/`, seed `supabase/seed.mjs`. No local migration runner.

## Env (`.env` gitignored, keys in `.env.example`)
- Server-only via `useRuntimeConfig()`: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`, `OWNER_EMAILS`, `RESEND_API_KEY`, `FROM_EMAIL`, `CONTACT_RECEIVER_EMAIL`, `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`
- Public (`NUXT_PUBLIC_*` → `runtimeConfig.public`): `SUPABASE_URL/KEY`, `APP_NAME/URL/DESCRIPTION`, `PAYSTACK/FLUTTERWAVE_PUBLIC_KEY`, `GA_ID`
- Site identity: Restaurant, Lagos NG, `theme-color #FF6B35`, static sitemap `/ /menu /about /contact`

## Frontend (`app/`, `~/` → `app/`)
- Pages: `index` (landing), `menu` (search+category → `GET /api/products`), `product/[id]` (variant/qty composer), `about`, `contact` | `checkout/index` (3-step wizard) + `checkout/confirm` (verify return) | `login/register/forgot-password/reset-password` (auth layout) | `dashboard/` (index, orders, orders/[id], profile — `middleware/auth.ts`) | `admin/` (index ops dashboard, orders, orders/[id], products console, admins roster — `middleware/admin.ts`)
- Layouts: `default` (Navbar/Footer), `dashboard` (pill tabs), `admin` (sidebar + global ProductDialog), `auth` (bare + AuthShell)
- Composables: `useCart` + `cart/{types,ops,storage}` (local-first, localStorage, pure ops, max 99, zero network until checkout), `useAuth` (session, `isAdmin` from `app_metadata.role`), `useSupabase`, `useAdminProducts` (CRUD + toasts)
- Components: `custom/ecommerce` (ProductCard, CartItem, OrderStatus), `custom/product` (Gallery, VariantPicker, QtyStepper, StickyBuyBar, rails), `custom/admin` (OrderTable, ProductDialog/AdminProductCard, sidebar, SectionCards, lazy Unovis/TanStack), `custom/general` (Navbar+NavSheet, Footer, CartSheet, AuthShell), `custom/landing` (Hero, FreshOffGrill, HowItWorks, Testimonials, VisitUs). `custom/Home` + `useProjects` = legacy, unused.
- UI rules: mobile-first mandatory (base small screens, `sm:/md:/lg:` up, tap ≥40px), dark-only (`massive-theme`, no toggle), modals/sheets must `lenis.stop()/start()` + body overflow lock, SFCs match surrounding `<script setup>` TS-or-not style

## Backend (`server/api/`, file-based `*.get|post|put|delete.ts`)
- Public: `GET /api/products` (filters categoryId/featured/search), `GET /api/products/:id`, `GET /api/categories`, `POST /api/contact` (zod + Resend, 5/hr)
- Orders: `POST /api/orders` (guest-allowed, takes `{variantId,quantity}[]` only, reprices from live catalog, service-role write, 20/15m) | `GET /api/orders` (`requireUser`) | `GET /api/orders/[id]` (service-role + code authz: owner / admin / guest `user_id null`)
- Auth: `POST /api/auth/login` (10/15m, unknown email → 404 by design), `POST /api/auth/register` (5/hr, duplicate = sign-in attempt, password must match), `GET /api/auth/session` (`{user,isOwner}`, null-safe), `POST /api/auth/logout`. Both login/register call `ensureAdminRole()`.
- Admin products/variants (`requireAdmin`): full-catalog GET, product create/update (`FIELD_MAP`)/delete, image upload (multipart → `product-images` bucket, JPG/PNG/WebP 5MB, service-role), variant create/update/delete
- Admin orders/customers (`requireAdmin`): list all orders, `PUT .../status` (status + optional paymentStatus), customers count via `listUsers`
- Admin admins (owner-only `requireOwner`): roster (admins + invites), promote-or-invite (audited, 20/hr), demote (blocks self/owner)
- Payments (public + signatures, service-role): Paystack/Flutterwave `initialize` (server-priced total, kobo, `confirmUrl`, upsert pending, 30/hr), `verify` proxies (Flutterwave checks `tx_ref` vs own row, 60/hr), webhooks = sole paid-writers (Paystack HMAC-SHA512 over **raw** `readRawBody`; Flutterwave `verif-hash == sha256(secret)`; amount guard → `payments.paid` + `orders paid/confirmed`; need public URL, see `docs/payment-webhooks.md`)

## Server utils (`server/utils/`)
- `supabase.ts`: `getSupabase(event)` user-scoped (RLS), `getServiceSupabase()` bypasses RLS (admin/webhook/order-create only), `getAuthUser/requireUser/requireAdmin` (deny missing roles, never fail open)
- `adminBootstrap.ts`: `ensureAdminRole()` stamps admin from `OWNER/ADMIN_EMAILS` or consumes `admin_invites` (role in `app_metadata`, no self-promotion)
- `adminGovernance.ts`: `parseEmailList/isOwnerEmail` (empty owners → admins fallback), `requireOwner`, `stamp/stripAdminRole`, `findUserIdByEmail`, `auditAdminAction` (never throws)
- `rateLimit.ts`: in-memory sliding window, single-instance (needs Redis multi-instance), `clearRateLimits()` for tests
- `mappers.ts`: snake_case → camelCase (prices to String); `siteUrl.ts`: `gatewayReturnBase()` (loopback Host ok, else canonical — anti-open-redirect) + `confirmUrl()` → `/checkout/confirm?order=`

## DB (`supabase/migrations/`)
- `0001`: `categories` (slug unique), `products` (slug, category FK SET NULL, featured), `product_variants` (sku unique, price/compare/inventory/weight), `addresses` (user FK CASCADE, default Lagos), `carts` (uuid PK, nullable user), `cart_items` (qty>0), `orders` (uuid PK, nullable user = guest, order_number unique, status 6, fulfillment delivery/pickup, subtotal/delivery_fee/total numeric, customer fields, address jsonb, payment_method paystack/flutterwave, payment_status 4), `order_items` (snapshot names/sku/prices), `payments` (reference unique, NGN, raw jsonb). Indexes on FKs/slugs/numbers.
- `0002`: `categories.parent_id` self-FK (sub-categories)
- `0003`: `admin_invites(email PK)` + `admin_audit_log(promote/demote/invite/invite_consumed)` — RLS on, zero policies = service-role only
- RLS: admin = `jwt app_metadata.role == admin`; catalog public SELECT, admin ALL; addresses own; carts guest-or-own; orders SELECT own + admin ALL, **no customer INSERT**; order_items/payments via owned parent, admin ALL
- Seed (`seed.mjs`, idempotent upsert on slug/sku): 5 categories, 13 products / 17 variants (`MB-*`, e.g. `MB-CAT-REG 8500`, `MB-CHK-FUL 9500`, sides 1500–4000)

## Pricing (`shared/utils/pricing.ts` — single source, both `orders.post.ts` + checkout use it)
- `DELIVERY_FEE_FLAT = 2000` (₦; pickup = 0) via `deliveryFeeFor`; `toAmount` (decimal strings → number, garbage → 0); `lineTotal/cartSubtotal/orderTotals/toKobo` (Paystack) / `formatNaira` (₦ + en-NG rounding)
- `shared/utils/orderStatus.ts`: 6 order + 4 payment statuses; forward-only `pending→confirmed→preparing→ready→completed`, `cancelled` from any active, terminal states, idempotent

## Gotchas
- Server imports via `~~/server/...`, never `~/server/...` (Nitro build break)
- No `/api/cart*` routes; never trust client prices; never hardcode delivery fee
- Guards: `auth.ts`/`admin.ts` middleware server-safe via `/api/auth/session` (guests → `/login?redirect=`, non-admins → `/`); `redirect` only if `startsWith("/")` and not `"//"`
- Register duplicate-email-as-sign-in is intentional — don't "fix"
- Security headers in `nuxt.config.ts` are defense-in-depth only
- `server/db/schema.ts` does not exist; single `admin/products.vue` + dialog (no `products/new`)
