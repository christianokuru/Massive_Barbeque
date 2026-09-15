# Massive Barbeque — Codebase Guide

Deep reference for AI agents working in this repo. Written after a full line-by-line
read of every source file (excluding `node_modules/`). For the short operational
version, see `AGENTS.md`. If anything here conflicts with executable code, trust the code.

Note: the repo's docs folder is lowercase `docs/` (Linux is case-sensitive) — this file
lives at `docs/codebase.md` to match convention.

---

## 1. What this is

Nuxt 4 (Nitro) BBQ ordering app for Lagos, Nigeria. Guests browse a catalog, build a
localStorage cart, check out (delivery or pickup), and pay via Paystack or Flutterwave.
Customers get a dashboard; admins get an order/product console plus owner-managed admin
roster. Supabase provides Postgres + Auth; Resend sends contact emails; GA4 is
hand-injected.

- Stack: Nuxt 4, Vue 3, Tailwind v4 (no `tailwind.config`), shadcn-vue (`new-york`,
  `typescript: false`), Supabase (`@supabase/ssr` + `supabase-js`), `vee-validate` + `zod`,
  `vue-sonner` toasts, Lenis smooth scroll, AOS animations.
- npm only (`package-lock.json`). Scripts: `dev`, `build`, `generate`, `preview`,
  `test` (`vitest run`). No `postinstall`/`prepare`, no lint, no typecheck, no CI.
  If `.nuxt/` types are missing, run `npx nuxt prepare`. Never run `npm run build`
  unless asked — `npm test` (hermetic, no network) is the only check.
- Single test command for one suite: `npx vitest run tests/pricing.test.ts`.
  Suites: `pricing`, `rateLimit`, `orderStatus`, `cartStore`, `siteUrl`, `adminGovernance`.

---

## 2. Environment variables

`.env` is gitignored — never commit it. Key names live in `.env.example`.
Server keys are read via `useRuntimeConfig()` in `nuxt.config.ts`.

| Var | Reaches client? | Maps to |
|---|---|---|
| `SUPABASE_URL` | yes (public) | `runtimeConfig.public.supabaseUrl` |
| `SUPABASE_KEY` (anon) | yes (public) | `runtimeConfig.public.supabaseKey` |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only** | `runtimeConfig.supabaseServiceRoleKey` |
| `ADMIN_EMAILS` (comma-separated) | no | `runtimeConfig.adminEmails` |
| `OWNER_EMAILS` (empty → falls back to `ADMIN_EMAILS`) | no | `runtimeConfig.ownerEmails` |
| `RESEND_API_KEY` | **server-only** | `runtimeConfig.resendApiKey` |
| `FROM_EMAIL` | no | `runtimeConfig.fromEmail` |
| `FROM_NAME` | no (`runtimeConfig` does **not** carry it) | — |
| `CONTACT_RECEIVER_EMAIL` | no | `runtimeConfig.contactReceiverEmail` |
| `PAYSTACK_SECRET_KEY` | **server-only** | `runtimeConfig.paystackSecretKey` |
| `NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | yes | `public.paystackPublicKey` |
| `FLUTTERWAVE_SECRET_KEY` | **server-only** | `runtimeConfig.flutterwaveSecretKey` |
| `NUXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` | yes | `public.flutterwavePublicKey` |
| `NUXT_PUBLIC_GA_ID` | yes | `public.gaId` |
| `NUXT_PUBLIC_APP_NAME` | yes | `public.appName` |
| `NUXT_PUBLIC_APP_URL` | yes | `public.appUrl` (fallback `https://massivebarbeque.com`) |
| `NUXT_PUBLIC_APP_DESCRIPTION` | yes | `public.appDescription` |

---

## 3. Core request flows

### 3.1 Guest checkout → payment (the money path)

1. Cart lives **only in the browser** (`useCart` + `cart/ops` + `cart/storage`,
   key `mb:cart:v1`). Checkout (`app/pages/checkout/index.vue`, 3 steps:
   Contact → Fulfillment → Payment) posts **ids + quantities only**:
   `POST /api/orders` with `{items: [{variantId, quantity}], fulfillmentType,
   customerEmail, customerName, customerPhone, deliveryAddress?, pickupTime?,
   notes?, paymentMethod}`.
2. `server/api/orders.post.ts` merges duplicate lines, loads live variants from
   `product_variants` (+ inner `products`), rejects stale carts with
   `400 "Some items in your cart are no longer available."`, reprices with
   `shared/utils/pricing.ts`, and inserts via **service role** (there is no
   customer order-insert RLS policy — identity comes from the session, money from
   the DB, never the client). Order numbers look like `MB88260579`
   (`"MB" + Date.now().slice(-8)`), ids are `crypto.randomUUID()`.
3. The page then calls `POST /api/payments/{paystack,flutterwave}/initialize`
   with `{email, amount, orderId, ...}` — but the server **ignores the client
   amount** and re-derives it from `orders.total`. Init upserts a `pending` row in
   `payments` (`onConflict: "reference"`) and returns `authorization_url`
   (Paystack, ref `PAY_<uuid>`) or `link` (Flutterwave, ref `FLW_<uuid>`).
   The callback/redirect URL is built by `server/utils/siteUrl.ts` and points at
   `/checkout/confirm?order=<id>`. The cart is cleared **only after init succeeds**;
   if init fails the order stays saved and the cart is kept.
4. The gateway redirects back to `/checkout/confirm`, which reads `?order=` plus
   `reference` (Paystack) or `tx_ref` + `transaction_id` + `status` (Flutterwave)
   and calls the matching `.../verify` endpoint **for display only** — verify
   routes never write to the DB.
5. **Webhooks are the sole writer of paid status.** On success they set
   `payments.status = paid` (+ `raw` payload, `paid_at`) and
   `orders.payment_status = paid, status = confirmed`. If a webhook never arrives,
   the order stays `pending` even though money moved — see the paid-but-stuck
   reconcile in `docs/payment-webhooks.md` (verify provider-side first, then
   mirror the webhook write only if provider status is success AND amounts match).

### 3.2 Auth

- Supabase Auth email/password with `@supabase/ssr` cookie sessions. Never roll
  custom cookies. Browser client is a singleton from `app/plugins/supabase.client.ts`
  (`createBrowserClient`, injected as `$supabase`, accessed via `useSupabase()`).
- `POST /api/auth/login`: rate-limited, then an explicit `listUsers` existence
  check so unknown emails return **404** (`"No account found for this email..."`,
  enumerable by design, throttled) while wrong passwords return **401**.
- `POST /api/auth/register`: duplicate email (422 `user_already_exists`, or a user
  with zero identities when confirm-email is on) falls through to sign-in, which
  only succeeds with the **correct password** — never "fix" this into auto-login.
  Returns `{signedInInstead: true}` or `{emailConfirmationRequired: !session}`.
- `GET /api/auth/session` returns `{user, isOwner}` and never throws (catch-all
  returns `{user: null, isOwner: false}`). Page middleware (`auth.ts`, `admin.ts`)
  is server-safe: on the server it forwards the `cookie` header to this endpoint;
  on the client it uses `useAuth().fetchSession()`. Guests → `/login?redirect=`,
  non-admins → `/`.
- Login/register pages only honor internal `redirect`
  (`startsWith("/") && !startsWith("//")`). After login: admins → `/admin`,
  others → `/dashboard` (or the safe redirect).
- Password reset: `requestPasswordReset` uses `window.location.origin/reset-password`
  (client-only); `reset-password.vue` waits for a session or a `PASSWORD_RECOVERY`
  event, with an 8s timeout that surfaces "invalid or expired" links.

### 3.3 Roles (admin governance)

- The role lives in `app_metadata.role`; enforcement (middleware, `requireAdmin`,
  RLS) reads it — never the env. Admins are **sticky**: nothing demotes implicitly,
  and demoted accounts keep their JWT session until they sign out and back in.
- `ADMIN_EMAILS` bootstraps admins on sign-up/sign-in via `ensureAdminRole`
  (`server/utils/adminBootstrap.ts`). Promoting a non-existent email stores an
  `admin_invites` row that is consumed (deleted + audited as `invite_consumed`) on
  signup. Owners (`OWNER_EMAILS`, empty → `ADMIN_EMAILS`) promote/demote at
  `/admin/admins` (`GET/POST/DELETE /api/admin/admins`, `requireOwner`-guarded,
  every action audited to `admin_audit_log`). Nobody can demote themselves;
  owners are env-only, never UI-managed. Full detail: `docs/payment-webhooks.md`.

---

## 4. Frontend

### 4.1 App root (`app/app.vue`)

Owns SEO defaults (`titleTemplate "%s | Massive Barbeque"`), a hardcoded canonical
(`https://massivebarbeque.com${route.path}` — do not swap in the Host header),
Schema.org `Restaurant` + `WebSite` JSON-LD, and the global `<Toaster>`
(`position="bottom-right"`, 4s, rich colors). GA4 is hand-injected once
(`window.gtag` dedup, `send_page_view: false`) with manual `page_view` on
`route.fullPath` change, gated on `config.public.gaId` — don't double-instrument.

### 4.2 Layouts (`app/layouts/`)

- `default.vue`: `Navbar` + `<slot/>` + `Footer` (relative imports `../components/...`).
- `admin.vue`: sidebar shell (`SidebarProvider` with `--sidebar-width *60`,
  `--header-height *12`), path-derived title (`Orders|Products|Admins|Dashboard`;
  prefix order matters so `/admin/orders/[id]` titles as `Orders`). `ProductDialog`
  is mounted **outside** `SidebarProvider` as a global modal.
- `auth.vue`: bare `<slot/>` — the `AuthShell` split-screen owns the chrome.
- `dashboard.vue`: pill tab nav (Overview/Orders/Profile) with exact-path matching
  for `/dashboard` so Overview doesn't stay active on subroutes.

### 4.3 Pages (`app/pages/`)

No page touches `localStorage` directly (cart persistence is inside `useCart`).
Public pages use the default layout with no middleware; all `/dashboard/*` use
`middleware: "auth"`, all `/admin/*` use `middleware: "admin"`.

- `index.vue`: live homepage composed of `custom/landing/*`. Fetches
  `/api/products?featured=true&limit=4` and `?limit=4` in parallel, dedupes by id,
  caps at 4 (rail stays full even with <4 featured). Note: `featured` is the
  **string** `"true"`.
- `menu.vue`: `GET /api/products?search=&categoryId=&limit=60` (300ms debounce) +
  `GET /api/categories`. Category chips toggle; skeleton grid while pending;
  `grid-cols-2 sm:3 lg:4 xl:5`.
- `product/[id].vue`: three `useAsyncData` calls (product by id; related by
  category, minus self, max 4; sides-rail via the `sides` category slug, skipped
  when the product itself is a side). Buy box defaults to the first variant,
  blocks purchase when `inventoryQty <= 0` or no variants ("isn't orderable online
  yet"). `addItem` sends `{variantId, quantity, snapshot}` then
  `toast.success`; no await (optimistic). Sticky mobile buy bar is driven by an
  `IntersectionObserver` sentinel in the page. Delivery copy hardcodes
  `"₦2,000 delivery"` / `"Free pickup"` — keep in sync with `DELIVERY_FEE_FLAT`.
- `checkout/index.vue`: guest-friendly (no auth guard). Step gating via
  `highestStep` (can't jump ahead); zod contact schema; delivery requires
  `addressLine1`; name is split into `firstName`/`lastName` (`"-"` fallback) for
  `deliveryAddress`, which is `undefined` on pickup. Payment method radio defaults
  to `paystack`. Place-order button reads `Pay ₦<total>` / `Placing order…`.
- `checkout/confirm.vue`: state machine `loading|verifying|paid|failed|received`.
  `status=cancelled` from Flutterwave short-circuits to `failed` with no verify.
  If the provider says paid, a missing local order is recovered via the verify
  response's embedded order id (mangled return URLs). Paid/received link to
  `/menu` + `/dashboard/orders`; failed links to `/checkout` + `/menu`.
- `login.vue` / `register.vue` (`auth` layout): 404 from login reveals the
  `Create one → /register` link; register surfaces `emailConfirmationRequired`
  and `signedInInstead` notices (1.8s pause before redirect on the latter).
- `forgot-password.vue`: always shows the non-enumerating
  "If an account exists…" notice.
- `dashboard/index.vue`: greeting by hour is set `onMounted` (avoids hydration
  mismatch). Stats derive from exact strings: terminal = `completed|cancelled`,
  spend counts `paymentStatus === "paid"`. Spotlight = first non-terminal order.
- `dashboard/orders.vue`: client-side filter tabs `all|active|completed|cancelled`
  (`active` = not completed/cancelled). Rows show `date · Delivery|Pickup · ₦total`.
- `dashboard/orders/[id].vue`: 5-step pipeline
  (`pending→confirmed→preparing→ready→completed`, mirrors
  `shared/utils/orderStatus.ts`); `cancelled` renders a separate card, never in
  the timeline. **Quirk:** `deliveryAddress` is read in **snake_case**
  (`first_name`, `address_line_1`, …) because `orders.post.ts` stores the JSONB
  blob raw — anyone rendering addresses must use snake_case keys (the `toOrder`
  mapper does not transform this blob).
- `dashboard/profile.vue`: reads `useAuth` state only (no API fetch); redundant
  in-page login guard besides middleware; initials split on `/[\s@._-]+/`.
- `admin/index.vue`: `SectionCards` statically imported; `ChartAreaInteractive`
  (`@unovis`) and `DataTable` (`@tanstack/vue-table`) lazy via
  `defineAsyncComponent` (matching `manualChunks` in `nuxt.config.ts`). Forwards
  request cookies on SSR for `/api/admin/orders` + `/api/admin/customers/count`;
  `/api/products` needs no auth. Revenue = sum of `paymentStatus === "paid"`,
  grouped per day (`YYYY-MM-DD`); `revenueDeltaPct` is always `null` today.
- `admin/orders.vue`: thin — `<OrderTable :orders>` owns the table.
- `admin/orders/[id].vue`: reads the **public** `/api/orders/:id` (works because
  the admin role passes its code authz), writes via
  `PUT /api/admin/orders/:id/status` with `{status, paymentStatus}` selects.
  No transition enforcement in the UI.
- `admin/products.vue`: single page + dialog pattern (no `products/new` route).
  SSR seeds the `useAdminProducts` store by forwarding cookies; the client path
  calls `fetchProducts()`.
- `admin/admins.vue`: owner UI (page guard is `admin`, but the API enforces
  owner — non-owners get `forbidden`). Promote distinguishes `invited` vs
  `promoted` modes; demote is two-click confirm; self-demote and owner-demote are
  disabled with explanatory titles. Note the template gates on `forbidden`, not
  on the fetched `isOwner`.

### 4.4 Components

`app/components/ui/` is stock shadcn-vue (`new-york`, `typescript: false`, lucide)
— treat as boilerplate, but note `nuxt.config.ts` excludes `ui/**/index.*` from
auto-scan (barrels would register as colliding `Ui*` components), so keep
importing those explicitly. `cn()` lives in `app/lib/utils.ts`.

Live custom components (`app/components/custom/`):

- `general/`: `Navbar` (owns the canonical Lenis scroll-lock — see §4.6; cart
  badge caps at `99+`; avatar initials), `NavSheet` (mobile nav), `CartSheet`
  (controlled drawer, auto-closes on route change, **no scroll-lock of its own** —
  the parent owns it), `Footer` (back-to-top prefers `$lenis.scrollTo`),
  `AuthShell` (login-02 split screen used by all four auth pages), `Logo`
  (inline SVG), `PasswordInput` (`defineModel`, Eye/EyeOff toggle),
  `Button` (cva variants; `asChild` prop is declared but dead — never read).
- `landing/` (live homepage, all presentational/props-only): `HeroSection`
  (`NuxtImg` 1920×1080 webp preload), `FreshOffGrill` (caps at 4 `showcase`
  cards), `HowItWorks`, `Testimonials` (CSS marquee: list rendered twice,
  55s loop, pauses on hover/focus, honors `prefers-reduced-motion`),
  `TestimonialCard` (fixed `280/340px` width the marquee depends on), `VisitUs`.
- `ecommerce/`: `ProductCard` (`showcase` vs standard templates; quick-add picks
  the cheapest variant, navigates to the PDP when there are none; media and title
  are sibling `NuxtLink`s, never nested), `CartItem` (untyped `Object` prop,
  `update`/`remove` emits, no clamping — parents sanitize), `OrderStatus`
  (color map incl. `paid→green`, `failed→red`, `refunded→muted`).
- `product/` (PDP kit, all used by `product/[id].vue`): `ProductGallery`,
  `ProductBreadcrumb`, `VariantPicker` (single variant renders an info line, not
  a chooser), `QtyStepper` (`update:modelValue`, clamped), `StockStatus`
  (`LOW_STOCK_AT = 5`), `DeliveryStrip`, `StickyBuyBar` (`md:hidden`, safe-area
  padding, visibility owned by the page), `RelatedRail` (renders nothing when
  empty), `SidesRail` (hardcoded "Complete your meal" headings, own quick-add),
  `ProductNotFound` (default CTA `→ /menu`).
- `admin/`: `OrderTable` (props `orders`, `detailBase` default `/admin/orders`),
  `dashboard/*` (`AppSidebar`, `NavMain` with owner-gated Admins link + global
  `openCreate`, `NavUser` whose logout lands on `/login`, `SiteHeader` with
  `View store → /`, `SectionCards` with 5 responsive stat cards,
  `ChartAreaInteractive` with 7/30/90-day revenue range,
  `DataTable` with status tabs where `active = confirmed|preparing|ready`;
  copy-paste bug: the last-page button renders `ChevronRight` instead of
  `ChevronsRight`), `features.ts` (TanStack feature registration),
  `products/AdminProductCard` (edit/delete overlays, destructive confirm dialog),
  `products/ProductDialog` (405 lines, mounted by `admin.vue`; zod validation
  with `PRICE_RE = /^\d+(\.\d{1,2})?$/`; slug auto-derives from name until
  hand-edited; dirty-guarded close with discard confirm; image upload via
  `uploadImage`; variant diffing via `variantKey`).

Legacy (do not build on): `custom/Home/*` + `useProjects.ts` — Kylva
luxury-agency template leftovers (fashion/beauty copy, `data-aos` anchors,
a `/projects` link to a route that doesn't exist). Zero imports from any page or
layout; the only `useProjects` consumer is `Home/Work.vue` itself. Also unused:
`app/assets/images/*` template art, `public/images/portfolio/*`,
`public/images/team/*`, `docs/image.png`, `ref-images/Full-UI.png`.

### 4.5 Composables & shared client state

- `useAuth.ts`: session façade. State keys `auth:user`, `auth:pending`,
  `auth:isOwner`. `isAdmin` comes from `app_metadata.role` in the JWT;
  `isOwner` comes **only** from `GET /api/auth/session` — never derive it from
  the JWT. `logout()` always lands on `/`.
- `useCart.ts` + `cart/{types,storage,ops}`: local-first, synchronous, zero
  network until checkout. `id === variantId`, unique by variant; `MAX_QTY = 99`;
  `applyAdd` merges lines, `applySetQty` with qty < 1 removes, `applyRemove`
  matches on `id`. Storage envelope `{v: 1, savedAt, rows}` under `mb:cart:v1`,
  SSR-safe, never throws, validates only `variantId`/`quantity` on load, and
  returns `null` for empty/corrupt data. Subtotal uses `shared/utils/pricing`.
  Server reprices at checkout — never treat `price` as truth.
- `useAdminProducts.ts`: admin console store (list + dialog + toasts). Products
  are created with embedded variants but updated via split endpoints
  (`PUT product` + per-variant POST/PUT/DELETE diffed by `variantKey`).
  `uploadImage` posts `FormData{file}` to `/api/admin/products/images`.
  `slugify` is exported for the dialog. `comparePrice`/`weight` serialize as
  `|| null` on update but `|| undefined` on create — preserve the difference.
- `useSupabase.ts`: one-liner accessor for the plugin client.
- `useInView.ts`: one-way IntersectionObserver latch (never resets, only reads
  `entries[0]`, defaults `threshold 0.1`), no `disconnect` — fine for reveals,
  not for toggles.
- `useZod.js` (plain JS): maps only the **first** zod path segment into
  `errors[field]` — nested schemas collapse to their top-level key.
- `M3Icon.vue`: Material Symbols glyph (`FILL`/`wght`/`opsz` variation
  settings, decorative `aria-hidden` unless `label` sets `role="img"`). Requires
  the global Symbols font from `nuxt.config.ts`.

### 4.6 Scroll, styling, app conventions

- Lenis owns window scroll (`app/plugins/lenis.client.ts`: 1.2s expo easing,
  scroll reset on `page:finish`, exposed as `$lenis`). Any modal/sheet MUST pair
  `lenis.stop()/start()` with a body `overflow` lock — see `setScrollLock` in
  `Navbar.vue`. `ProductDialog` does Lenis-only locking (no body overflow);
  `CartSheet`/`NavSheet` rely on the parent. Nested scrollers need
  `data-lenis-prevent`.
- Styling is Tailwind v4 (`@import "tailwindcss"` in `app/assets/css/main.css`,
  no config file) with M3 tokens: brand palette `#D84315` (ember red CTAs) /
  `#FFD54F` (gold accent) / `#5D4037` (smoky brown) / `#212121` (charcoal canvas),
  shadcn vars mapped onto M3, `@theme inline` color/elevation/radius tokens, M3
  type utilities (`m3-display-*`, `m3-headline-*`, `m3-title-*`, `m3-body-*`,
  `m3-label-*`), state/easing/duration tokens. Never hardcode hex — use tokens
  (`bg-primary-container`, `text-on-surface-variant`, `shadow-m3-1`,
  `rounded-m3-xl`). Fonts: Inter (sans) + Cormorant Garamond (serif headlines).
  `colorMode` is dark-only (`preference/fallback "dark"`, key `massive-theme`) —
  no light mode, no toggle. Base font 16px (also prevents iOS input zoom).
  Mobile-first: base styles target small screens, `sm:/md:/lg:` up.
- SFCs mix plain `<script setup>` and `<script setup lang="ts">` — match the
  surrounding file. Client plugins must be `*.client.ts`.
- Forms: `vee-validate` + `zod`; toasts via the global `<Toaster>`.
- **Import alias rule (build-breaking):** Nuxt 4 resolves `~/` to `app/`, so
  server code must import via `~~/server/...`, never `~/server/...`. Shared
  helpers are imported as `~~/shared/...` from both server routes and app code
  (e.g. `useCart.ts`, `SidesRail.vue`); `~`/`~~` both resolve to repo root in
  vitest.

---

## 5. Backend (`server/api/`, file-based: `*.get|post|put|delete.ts`)

### 5.1 Supabase helpers (`server/utils/supabase.ts`)

- `getSupabase(event)`: user-scoped `@supabase/ssr` client (cookie get/set
  bridged to H3). RLS applies — use for user data.
- `getServiceSupabase()`: service-role client, bypasses RLS. Admin/webhook-only,
  plus order create/read (no customer RLS policies there; authz in code).
- `getAuthUser(event)`: soft session read (`user` may be null).
- `requireUser` → 401 when absent; `requireAdmin` → 403 unless
  `app_metadata.role === "admin"`. Deny missing roles, never fail open.

### 5.2 Other utils

- `rateLimit.ts`: in-memory sliding window (`Map<key, timestamps[]>`, injectable
  `now` for tests, opportunistic cleanup past 5000 keys). **Single-instance
  only** — needs Redis/Upstash behind multiple instances. `clearRateLimits()` is
  the test helper. Limits (per IP): login 10/15min, register 5/hr, orders
  20/15min, contact 5/hr, pay-init 30/hr, pay-verify 60/hr, admin-promote 20/hr.
- `siteUrl.ts`: `gatewayReturnBase` trusts the Host header **only for loopback**
  (`localhost`, `127.0.0.1`, `[::1]`, `http://`); everything else uses canonical
  `appUrl`. `confirmUrl(event, orderId?)` appends `/checkout/confirm(?order=)`.
- `adminGovernance.ts`: `parseEmailList`, `ownerEmails`/`adminAllowEmails`,
  `isOwnerEmail` (empty owners → `ADMIN_EMAILS` fallback), `requireOwner`
  (403 `"Forbidden: owner only"`), `auditAdminAction` (never throws — logs and
  continues), `stampAdminRole`/`stripAdminRole` (merge/delete `app_metadata.role`
  via service client; sessions keep old JWT until re-login), `findUserIdByEmail`
  (paginated `listUsers`, up to 10×1000, case-insensitive).
- `adminBootstrap.ts`: `ensureAdminRole` — allow-listed (or invited) emails get
  stamped on sign-up/sign-in; invites are deleted + audited on consume.
- `mappers.ts`: snake→camel for category/variant/product/order-item/payment/order
  (prices stringified, e.g. `price: String(price ?? "0")`). `toAddress` exists but
  no current route uses it; `toOrder` passes `delivery_address` through raw
  (hence the snake_case quirk in §4.3).

### 5.3 Auth (`server/api/auth/`)

| Route | Guard | Rate | Notes |
|---|---|---|---|
| `POST /api/auth/login` | none | `login:<ip>` 10/15min (+`Retry-After`) | 404 unknown email / 401 wrong password; `ensureAdminRole` on success |
| `POST /api/auth/register` | none | `register:<ip>` 5/hr (+`Retry-After`) | duplicate → sign-in attempt; `{signedInInstead}` / `{emailConfirmationRequired}` |
| `POST /api/auth/logout` | none | none | `supabase.auth.signOut()`, `{success: true}` |
| `GET /api/auth/session` | soft | none | `{user, isOwner}`, never throws |

### 5.4 Catalog (public, user-scoped, no rate limits)

- `GET /api/products` (`categoryId`, `featured === "true"`, `search` ilike on
  name, `limit` default 50, `offset`): active products newest-first, inactive
  variants filtered in JS. Returns `{products, pagination: {total, limit, offset}}`.
- `GET /api/products/:id`: 400 without id, 404 when missing.
- `GET /api/categories` (`activeOnly` default true unless `"false"`): attaches
  `parent` via a second query when any `parent_id` is set.

### 5.5 Orders (customer)

- `POST /api/orders` (§3.1): guest-friendly, service-role writes, zod caps
  (≤50 lines, qty 1–99, merged + capped at 99 per variant).
- `GET /api/orders`: `requireUser`, own orders newest-first.
- `GET /api/orders/:id`: service-role read + code authz — owner, `role ===
  "admin"`, or guest orders (`user_id` null). Keep that shape: the guest
  checkout-confirm page depends on it.

### 5.6 Contact

`POST /api/contact`: 5/hr per IP. Schema `{name ≥2, email, brand ≥1, message ≥10}`
via `readBody` + `parse` (not `readValidatedBody`). Sends via Resend with HTML
entity escaping (`escapeHtml`), `replyTo` = sender. Defaults keep it working
without env: from `onboarding@resend.dev`, to `info@massivebarbeque.com`.

### 5.7 Payments (`server/api/payments/`)

- `POST .../paystack/initialize` (`{email, orderId, metadata?}`) and
  `POST .../flutterwave/initialize` (adds `customerName?`, `customerPhone?`):
  30/hr per IP (**no `Retry-After` header**, unlike auth/order/contact routes).
  Both re-read the order via service role and reject unknown (`404`), already
  paid (`400`), wrong-provider (`400`), and non-payable totals (`400`) before
  calling the provider. Amounts come from `orders.total` only.
- `POST .../paystack/verify` (`{reference}`) and
  `POST .../flutterwave/verify` (`{transaction_id}`): 60/hr per IP, display-only,
  no DB writes. Flutterwave additionally requires the `tx_ref` to exist in local
  `payments` (`404 "Transaction not found."`) so it can't be used as a general
  oracle. **Known bug:** both verify catches handle only `ZodError` and fall
  through to 500 — a rate-limit 429 is masked as 500.
- `POST .../webhooks/paystack`: no auth/rate limit (it's the provider calling).
  Reads the **raw** body (`readRawBody`), requires `x-paystack-signature`, and
  HMAC-SHA512-verifies it over the raw bytes — never verify over parsed JSON.
  Only `charge.success` is processed, and only if the kobo amount is `>=` the
  order total (`currency === "NGN"` enforced); mismatches are logged and
  acknowledged without writes. **Known bug:** the outer catch returns 500
  unconditionally, masking the 400/401 signature errors above.
- `POST .../webhooks/flutterwave`: parsed body + `verif-hash` header, verified
  as `sha256(secret)` (hash of the secret, not an HMAC of the body — keep that
  shape). Only `charge.completed`, same dual-write, same amount-guard and same
  catch-masking note as Paystack.
- Emails go through Resend (`server-only` key).

### 5.8 Admin (`server/api/admin/`, all `requireAdmin` unless noted)

- `GET /api/admin/admins` (`requireOwner`): admin users from `listUsers` (+
  `isOwner` flag, `lastSignIn`) plus `admin_invites` newest-first.
- `POST /api/admin/admins` (`requireOwner`, 20/hr per IP, no `Retry-After`):
  owners-by-env are rejected (`400`); existing users are stamped (`promoted`),
  unknown emails become invites (`invited`); both audited.
- `DELETE /api/admin/admins` (`requireOwner`): no self-demote, no owner-demote
  (`400`s), 404 for unknown emails, audited.
- `GET /api/admin/orders`: **user-scoped** client (works through the admin RLS
  policy), full table newest-first.
- `PUT /api/admin/orders/:id/status`: `{status, paymentStatus?}` — validates the
  enums only; does **not** enforce `canTransitionOrder`.
- `GET /api/admin/products`: service-role read (includes inactive).
- `POST /api/admin/products`: embedded variant creation (price regex
  `^\d+(\.\d{1,2})?$`); `PUT /api/admin/products/:id` maps friendly keys via
  `FIELD_MAP` (partial updates, **no try/catch** — errors bubble to Nuxt's
  handler); `DELETE` likewise bare.
- `POST /api/admin/products/images`: multipart `file` field → `product-images`
  bucket, allow-list `jpeg/png/webp`, 5MB max, random `admin-<ts>-<rand>.<ext>`
  path, `upsert: false`, returns `{url, path}` (public URL).
- Variants (`POST /api/admin/variants`, `PUT/DELETE .../variants/:id`): raw rows
  in/out (not mapped); same price regex; create returns `{success, variant}`.
- `GET /api/admin/customers/count`: paginated `listUsers` accumulation.

---

## 6. Data layer

### 6.1 Schema (`supabase/migrations/`)

- `0001_initial_schema.sql`: 9 tables — `categories`, `products`,
  `product_variants` (money as `numeric(10,2)`), `addresses`, `carts` (+
  `cart_items`; unguessable UUID guest carts — **unused by the app**, which keeps
  carts in localStorage), `orders` (nullable `user_id` = guest orders,
  `delivery_address jsonb`, status/payment-status CHECKs), `order_items`
  (immutable snapshot, `variant_id SET NULL`), `payments` (`reference` unique).
  RLS enabled everywhere: public catalog reads, admin writes via JWT role,
  owner-only addresses, guest-or-own carts, **own-orders + admin-orders selects
  with no customer INSERT policy** (creation is service-role only), payment
  selects scoped to own orders.
- `0002_category_parent.sql`: optional `categories.parent_id` self-FK + index.
- `0003_admin_governance.sql`: `admin_invites` (email PK) + `admin_audit_log`
  (promote/demote/invite/invite_consumed CHECK). RLS on with **zero policies** =
  service-role only. (The "zero policies" phrase applies to these two tables,
  not the whole DB.)
- No local migration runner — apply in the Supabase SQL editor.

### 6.2 Seed (`supabase/seed.mjs`)

`node supabase/seed.mjs` (parses `.env` itself without overriding existing env).
Idempotent upserts on category slug / product slug / variant sku. Seeds 5
categories (`barbeque-fish`, `grilled-chicken`, `turkey`, `croaker`, `sides`) and
13 products / 17 variants (catfish 8500/12000, chicken half 5000 / full 9500,
turkey 7500/10500, croaker 10000/14000, wings platter 6000, sides 1500–4000).
Featured: catfish, full chicken, croaker.

### 6.3 Pricing & status (`shared/`)

- `pricing.ts` is the single source both server and checkout must use — never
  hardcode the fee: `DELIVERY_FEE_FLAT = 2000`, `deliveryFeeFor` (delivery-only),
  `orderTotals`, `toAmount` (Postgres `decimal` strings → number, invalid → 0),
  `lineTotal` (floors qty, negatives → 0), `cartSubtotal`, `toKobo` (Paystack,
  rounded), `formatNaira` (`₦12,500` via `en-NG`, rounded).
- `orderStatus.ts`: `ORDER_STATUSES`
  (`pending, confirmed, preparing, ready, completed, cancelled`),
  `PAYMENT_STATUSES` (`pending, paid, failed, refunded`), and
  `canTransitionOrder` (forward-only pipeline, `cancelled` reachable until
  completion, terminal states self-loop for idempotent re-saves). Reuse for
  status logic — but note the admin PUT doesn't enforce it.

### 6.4 Tests (`tests/`, all hermetic)

`pricing` (parsing/rounding/delivery contract/kobo/naira), `rateLimit`
(sliding window, expiry, per-IP and per-bucket isolation), `orderStatus` (enum
order, forward/skip/backward/cancel/terminal/self-transition matrix),
`cartStore` (merge/floor/cap/immutability, storage round-trip + corrupt-data
`null`s), `siteUrl` (loopback passthrough, `evil.com` and
`massivebarbeque.com.evil.com` → canonical), `adminGovernance` (list parsing,
owner fallback only while owners empty).

---

## 7. Config & platform notes (`nuxt.config.ts`)

- Modules: `@nuxt/fonts`, `@nuxt/icon`, `@nuxt/image` (only `images.unsplash.com`
  allowed), `@nuxtjs/color-mode`, `@nuxtjs/seo`. Devtools on.
- `components` array replaces Nuxt defaults (islands/global preserved) and
  ignores `ui/**/index.*` — see §4.4.
- `manualChunks` splits `@unovis` → `unovis` and `@tanstack` → `vue-table`
  (loaded on demand in `admin/index.vue`).
- SEO: static sitemap (`zeroRuntime`, `/`, `/menu`, `/about`, `/contact`),
  `linkChecker` off, Restaurant Schema.org identity, `ogImage` on, Material
  Symbols font, `theme-color #D84315`.
- Security headers on `/**` (`nosniff`, `DENY`, strict referrer, locked-down
  `Permissions-Policy`) are defense-in-depth only — auth lives in routes +
  middleware.

---

## 8. Known issues & small bugs (verified in code, unfixed)

1. Verify endpoints (`paystack/verify`, `flutterwave/verify`) mask rate-limit
   429s as 500s — their catch handles only `ZodError` and doesn't rethrow
   `statusCode`.
2. Both webhook catches return 500 unconditionally, masking their own 400/401
   signature errors. Functionally the provider still sees a failure, but the
   status shape lies; don't "fix" by changing acknowledge-on-mismatch behavior
   (logging + `{success: true}` without writes is intentional).
3. `DataTable.vue` last-page button renders `ChevronRight` instead of
   `ChevronsRight` (first-page correctly uses `ChevronsLeft`).
4. `Button.vue` declares an `asChild` prop it never reads.
5. `PUT /api/admin/products/:id` and both product/variant DELETEs have no
   try/catch — errors bubble to Nuxt's default handler (different error shape
   from the rest of the API).
6. Rate limiting is in-memory single-instance — it silently under-enforces behind
   multiple Nitro instances (needs Redis/Upstash per the code comment).
7. `useInView` never disconnects its observer and never resets to false.
8. `carts`/`cart_items`/`addresses` tables exist with RLS but the app never uses
   them (localStorage cart, no saved addresses) — don't build features assuming
   they're wired up.
9. `FROM_NAME` is in `.env.example` but not in `runtimeConfig` — setting it has
   no effect on the contact email path.

---

## 9. Doc map (what to trust)

- Authoritative: this file, `AGENTS.md`, `docs/payment-webhooks.md` (live ops:
  governance, webhook checklist, paid-but-stuck reconcile), executable sources
  (`supabase/migrations/`, `server/api/`, `nuxt.config.ts`, `.env.example`).
- Advisory: `MATERIAL-3-DESIGN-PRINCIPLES.md` (M3 reference for UI work).
- Historical/stale: `PRD.md` (batch notes), `PROJECT_SCOPE.md` (re-onboarding
  with stale bits — e.g. claims a `postinstall` script `package.json` doesn't
  have), `README.md` (stock Nuxt starter), `docs/architecture-types.md` (generic
  textbook, no project content), `docs/fixes/contact-component-fixes.md`
  (2026-01-16 fix to the now-legacy `custom/Home/Contact.vue`).
