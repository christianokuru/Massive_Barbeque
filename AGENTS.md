# AGENTS.md — Massive Barbeque

Nuxt 4 (Nitro) BBQ ordering app. Frontend `app/`, Nitro routes `server/api/`, Supabase (Postgres + Auth) via `server/utils/supabase.ts`. Deep reference: `docs/codebase.md` (route/component/DB catalog + bugs); ops: `docs/payment-webhooks.md`; session logs: `docs/worklog/` (read latest entry first).

## Commands (npm only, `package-lock.json`)

- `npm install`, `npm run dev` (:3000). No `postinstall` — if `.nuxt/` types missing, `npx nuxt prepare`.
- `npm test` (vitest, hermetic — no network/Supabase). Single suite: `npx vitest run tests/<name>.test.ts` (pricing, rateLimit, orderStatus, cartStore, siteUrl, adminGovernance, guestToken, clientIp, safeRedirect). No lint/typecheck/CI. Never run `npm run build` unless asked.
- DB in Supabase: schema `supabase/migrations/` (0001 schema, 0002 category parents, 0003 governance — RLS on, zero policies on governance tables = service-role only; 0004 security hardening — RLS `WITH CHECK`, active-only catalog, audit `actor_ip`/`status_change`). Seed: `node supabase/seed.mjs` (idempotent slug/sku upserts; parses `.env` itself). No local migration runner.

## Env

- `.env` gitignored, never commit; keys in `.env.example`. Server reads via `useRuntimeConfig()` (`nuxt.config.ts`).
- Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`, `RESEND_API_KEY`. Only `runtimeConfig.public.*` (`NUXT_PUBLIC_*`) reaches client. `GUEST_TOKEN_SECRET` signs guest-order tokens (falls back to service-role key — set explicitly in production).

## Architecture

- Pages `app/pages/`: public (`index`, `menu`, `product/[id]`, `about`, `contact`, `checkout`, `checkout/confirm`), auth (`login`, `register`, `forgot-password`, `reset-password`), `dashboard/` + `admin/` (guarded). Layouts: `default`, `dashboard`, `admin`, `auth` (bare + AuthShell). `admin/products.vue` is single page + dialog (no `products/new` route).
- Live components `app/components/custom/`: `landing/` = homepage (used by `index.vue`); `Home/` + `useProjects.ts` = unused legacy, don't build on. `general/` = Navbar/Footer/NavSheet/CartSheet/AuthShell; `ecommerce|product|admin/` = shop kit. `components/ui/` = shadcn-vue (`typescript: false`); `nuxt.config` ignores `ui/**/index.*` in auto-scan — import those explicitly.
- API `server/api/**/*.get|post|put|delete.ts`: `auth/`, `products/`, `categories/`, `orders/`, `contact.post.ts`, `payments/{paystack,flutterwave,webhooks}/`, `admin/{admins,orders,products,variants,customers}/`.
- Supabase: `getSupabase(event)` = user-scoped (RLS applies); `getServiceSupabase()` = bypasses RLS — admin/webhook-only, plus order create/read (no customer order-insert RLS; authz in code). Image upload: multipart → `product-images` bucket, 5MB max, magic-byte sniffed (MIME/ext from content, never filename). Gallery model: `products.image_url` = required cover; `product_images` table (migration 0005, RLS active-only read, service-role writes) = up to 8 optional extras shown on the product page; image URLs allow https or site-relative `/…` (`server/utils/productImages.ts`).
- **Import alias (build-breaking):** Nuxt 4 `~/` = `app/`, so server code uses `~~/server/...`, never `~/server/...`. Shared helpers `~~/shared/...` from both sides. Vitest maps `~`/`~~` to root (`vitest.config.ts`).

## Conventions

- SFCs mix `<script setup>` and `<script setup lang="ts">` — match the file. Client plugins must be `*.client.ts`.
- Pricing: `shared/utils/pricing.ts` is single source (`DELIVERY_FEE_FLAT = 2000`, `orderTotals`/`deliveryFeeFor`, `toAmount` for Postgres decimal strings, `toKobo` for Paystack). Never hardcode fee. Status enums + `canTransitionOrder` in `shared/utils/orderStatus.ts` — admin status PUT **enforces** transitions, forbids hand-setting `paid`, and audits (`status_change`, fail-closed).
- Cart is local-first (`useCart.ts` + `cart/{types,storage,ops}`, key `mb:cart:v1`, zero network). Checkout posts `{variantId, quantity}[]` only; `orders.post.ts` reprices from live catalog. No `/api/cart*` routes.
- `delivery_address` stored as raw snake_case JSONB (`first_name`, `address_line_1`, … — `toOrder` doesn't transform); order-display code must read snake_case.
- Styling: Tailwind v4 (`@import "tailwindcss"`, no config) + M3 tokens — see `MATERIAL-3-DESIGN-PRINCIPLES.md`; never hardcode hex. Dark-only (`preference/fallback "dark"`, key `massive-theme` — no toggle). Mobile-first (`sm:/md:/lg:` up).
- Lenis owns window scroll (`$lenis`, reset on `page:finish`). Modals/sheets MUST pair `lenis.stop()/start()` + body `overflow` lock (see `setScrollLock` in `Navbar.vue`); nested scrollers need `data-lenis-prevent`.
- Forms `vee-validate` + `zod`; toasts via `<Toaster>` in `app/app.vue`. GA4 hand-injected there (manual `page_view` on `route.path` only — never `fullPath`; `gaId` shape-validated) — don't double-instrument. Security headers (CSP + HSTS + legacy) live in `nuxt.config.ts` `routeRules` — keep gateway/font/GA hosts in the CSP allowlist when adding third parties.

## Auth / roles

- Supabase email/password, `@supabase/ssr` cookies — never roll custom cookies. Role in `app_metadata.role`; `isAdmin` from JWT, `isOwner` only from `GET /api/auth/session` (httpOnly-safe; `app.vue` hydrates globally on mount). Guards: `requireUser`/`requireAdmin`/`requireOwner` (deny, never fail open); pages `middleware/auth.ts` + `admin.ts` (server-safe via session endpoint; guests → `/login?redirect=`, non-admins → `/`).
- `ADMIN_EMAILS` promotes on sign-up/sign-in (`adminBootstrap.ts`, supports `admin_invites`) — but ONLY for verified emails (unconfirmed signups are never stamped). `OWNER_EMAILS` (REQUIRED, no fallback to `ADMIN_EMAILS`) manage admins at `/admin/admins` (`requireOwner` needs confirmed email too, audited with actor IP, env-only, no self-demote). Demote revokes sessions (`signOut`) so old JWTs die immediately.
- Keep these shapes: login 404 unknown email vs 401 wrong password (enumerable by design, throttled); register duplicate email = sign-in attempt (password must still match). Login/register honor `redirect` via `safeRedirectPath()` (`app/utils/safeRedirect.ts`); post-auth landing → `/menu` (→ `/admin` for admins). Password reset via `POST /api/auth/reset` (throttled, fixed redirect, non-enumerating).
- Rate limits (in-memory, single-instance; IP via `getClientIp()` — socket-first, XFF only behind local proxy; composite keys): login 10/15min per IP+email, register 5/hr per IP+email, reset 5/hr per IP+email, orders 20/15min, contact 5/hr, order-read 120/hr, pay-init 10/hr per IP+order, pay-verify 60/hr, webhooks 300/hr, admin-promote/demote 20/hr per IP.

## Orders / payments

- Guest orders need the HMAC `guestToken` issued at order-create (`server/utils/guestToken.ts`, bound to order+email, 30d). `GET /api/orders/[id]` allows owner, admin, or guest+token (denied → 404, never 403). Checkout stores it (`sessionStorage mb:guest:<id>`) and passes it to pay-init/verify. Admin order-detail reads this endpoint via session (no token needed for admins).
- `orders.post.ts` enforces: string caps, delivery-requires-address, safe `pickupTime`, stock check (`inventory_qty`), random `MB########` numbers, logged-in email forced from session.
- Webhooks are the ONLY paid-status writer (`charge.success` / `charge.completed` → `payments` paid + `orders` paid/`confirmed`), and both now re-verify with the provider before writing + only transition pending→paid (idempotent). Needs public URL — checklist in `docs/payment-webhooks.md`.
- Paystack webhook: HMAC-SHA512 over **raw** body (`readRawBody`), `x-paystack-signature` (constant-time compare), amount ≥ order total (kobo). Flutterwave: `verif-hash` gates noise only — the transaction is re-verified server-side (static hash is replayable alone). Auth failures return 401/400 (never 500); amount-mismatch = log + acknowledge without write (intentional). Gateway return URLs via `siteUrl.ts` (`gatewayReturnBase` trusts Host only for loopback, else canonical `appUrl`) — never trust Host for production.
- Pay-init requires ownership/guest token, caps 5 pending rows per order, receipts go to the order email, metadata is capped strings-only (Flutterwave `orderId` forced after spread). Verify endpoints are display-only, return minimal `{paid, orderId, amount, currency}` (never raw provider payload), preserve inner status codes.
- Catalog: public single-product read is active-only; `GET /api/products` clamps `limit ≤ 100`, escapes LIKE wildcards. Contact: field caps + honeypot (`company`). `GET /api/admin/customers/count` cached 60s, page-capped, excludes admins.
- Don't "fix": admin DataTable last-page icon (`ChevronRight` vs `ChevronsRight`); `Button` dead `asChild` prop; `carts`/`cart_items`/`addresses` tables unused (localStorage cart); `FROM_NAME` env has no effect (not in `runtimeConfig`).
- Stale docs: `README.md` = stock Nuxt starter; `PRD.md`/`PROJECT_SCOPE.md` = historical (scope claims a `postinstall` that doesn't exist). Trust executable sources.
