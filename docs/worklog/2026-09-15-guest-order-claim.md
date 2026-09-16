# 2026-09-15 — Guest order visibility + claim

## Goal

Fix guest order amnesia: orders placed without login never appeared after account creation. Implement immediate visibility + permanent ownership.

## Changes

- New `server/utils/orderClaim.ts:1` — `claimGuestOrders(userId, email)` via service role: `ilike(customer_email, normalized)` + JS exact filter (avoids `%`/`_` wildcard false positives), updates `user_id IS NULL` rows to `userId`, logs count. Handles case-insensitive exact, idempotent.
- `server/api/orders/index.get.ts:1` — switched from user-scoped `eq(user_id)` to service-role dual query: `eq(user_id, me)` + `is(user_id, null) ilike(customer_email, me.email)` (filtered exact), merged + sorted `created_at DESC`, mapped via `toOrder`. RLS hides guest rows from user client, so service role is required (same pattern as `orders/[id].get.ts`). Guest orders now appear in `/dashboard/orders` the instant the same email logs in, even before DB claim.
- `server/api/auth/login.post.ts:4` — imports `claimGuestOrders`, calls after `ensureAdminRole` (password proven). `server/api/auth/register.post.ts:4` — same after `ensureAdminRole` for both `signedInInstead` (duplicate) and new account (only when `data.session` exists; if `emailConfirmationRequired=true` defers claim to first real login).
- `app/pages/checkout/confirm.vue:6` — injects `isLoggedIn` from `useAuth`, adds CTA under both `paid` and `received` states: `Create account with {{customerEmail}} → /register?email=…&redirect=/dashboard/orders` when `!isLoggedIn && order?.customerEmail`. Uses `order.customerEmail` from `toOrder`.
- `app/pages/register.vue:14` — pre-fills `form.email` from `route.query.email` so the CTA round-trips.

## Decisions & tradeoffs

- Chose **query-time union + async claim** over localStorage orderIds: email is already collected at checkout, survives device clears, no extra client state. localStorage alone would miss cross-device.
- Claim only after password-proven auth (login or duplicate-register sign-in). Fresh register with confirm-email skips claim until confirmed login — avoids an attacker pre-registering victim's email before victim (attacker would need to know victim's future password anyway, but deferring removes any window).
- Kept RLS as-is (no customer INSERT policy) and used service role for reads/writes; authz stays in code (owner/admin/guest). Alternative RLS change (`auth.jwt() ->> 'email'`) was rejected as more invasive.
- `ilike` without wildcards = case-insensitive exact in Postgres; JS re-filter guarantees exactness despite `_`/`%` in local-part.

## Verification

- `npm test` 6 files 47/47 passing.
- `npm run build` client built 4566 modules (30s), server 543 modules, no errors (Tailwind Vite sourcemap warns only, as before). Previous full Nitro build succeeded to `sitemap.xml` prerender.
- Manual steps (requires Supabase dev):
  1. As guest, place order with `guest@example.com`, note `orderId` from `/checkout/confirm?order=…` — should show `received` but not yet in `/dashboard/orders` (not logged in).
  2. `Register` with same email → should land `/menu` then `GET /api/orders` includes the guest order (immediate via email) and after login the DB row has `user_id` set; reload `/dashboard/orders` confirms persisted.
  3. Guest order with different email → not claimed (isolation).

## Where it stopped / pending

- No live Supabase verification in this session (no network). The `ilike` path was code-reviewed, not live-queried against Postgres.

## Open questions

- Should we also add `POST /api/orders/claim` for manual claim while logged in (e.g. typo email)? Not needed if email at checkout is validated.
