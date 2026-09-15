# 2026-09-15 — Checkout logout fix

## Goal

Fix bug where placing an order logs the user out even when authenticated.

## Investigation

- Read `app/pages/checkout/index.vue:87` (`placeOrder`: `$fetch /api/orders` → `$fetch /api/payments/*/initialize` → `clear()` → `window.location.href`), `server/api/orders.post.ts:59` (`getAuthUser` + `getServiceSupabase`), `app/composables/useAuth.ts:17` (`fetchSession`), `app/plugins/supabase.client.ts:1` (`createBrowserClient`), `server/utils/supabase.ts:56` (`getAuthUser` via `createServerClient`), `app/app.vue:71` and `app/components/custom/general/Navbar.vue:24` (auth hydration).
- Checked every code path that touches auth: no `signOut`/`localStorage.clear` in checkout or cart (`cart/storage.ts:50` only removes `mb:cart:v1`, `useCart.ts:55` `clear()` only empties that envelope). `$fetch /api/orders` and payment init do not clear cookies.
- Found hydration gap:
  1. `useAuth.fetchSession` used `supabase.auth.getUser()` (browser client via `document.cookie`). Server auth sets cookies via `createServerClient` with `setCookie` (`server/utils/supabase.ts:31`). If those cookies are `httpOnly` (or otherwise not readable via `document.cookie`), the browser client returns `null`, so `user` stays `null` even though `GET /api/auth/session` (which reads cookies server-side) sees the user. This made Navbar (`isLoggedIn` from `user`) show "Log in" while middleware (server-side) still saw the user.
  2. No global hydration: `Navbar` and `default` layout never called `fetchSession`. Only `dashboard/*` pages did (`if (process.client) await fetchSession()`). `checkout` and `checkout/confirm` are public (no middleware), so after a full navigation (especially `window.location.href` to Paystack/Flutterwave and back to `/checkout/confirm?order=…`), the app reloaded with `useState("auth:user", null)` and never hydrated — appeared logged out.

## Changes

- `app/composables/useAuth.ts:17` — `fetchSession` now calls `GET /api/auth/session` (`$fetch<{user}>`) instead of `supabase.auth.getUser()`. Same endpoint middleware uses, so httpOnly cookies are honoured and the client doesn't need to parse `document.cookie`. `supabase` instance kept for `resetPasswordForEmail`/`updateUser` only.
- `app/app.vue:67` — added global `onMounted(() => fetchSession())` via `useAuth()`. Runs once per app load (e.g. after gateway return), deduplicated via `pending` flag; dashboard pages' own calls remain safe.

## Decisions & tradeoffs

- Kept `supabase.client.ts` as-is (`createBrowserClient` singleton). Server is now the source of truth for session reading; browser client remains for direct auth writes (reset/verify) only.
- Did not change cart or order/payment routes — they already correctly forward cookies via `$fetch` and link `orders.user_id` from `getAuthUser` when present. No DB/RLS change.

## Verification

- `npm test` 6 files 47/47 passing (no logic change to tested utils).
- Manual steps to verify (requires running dev + real Supabase):
  1. `npm run dev`, login, confirm Navbar shows initials/avatar.
  2. Add item, go to `/checkout`, place order (any gateway), do not complete payment — check Navbar still shows "Account" before redirect, and order appears in `GET /api/orders` with `user_id` set.
  3. Complete gateway redirect back to `/checkout/confirm?order=…` — Navbar should still show "Account", `/dashboard/orders` lists the new order, no logout.

## Where it stopped / pending

- Fix is code-only, not yet manually verified against live Supabase/gateway (needs env + browser test).
- If still flaky after this, next suspects: token expiry during `getAuthUser` (SSR refresh clearing cookies) or SameSite on auth cookies during external redirect — check network `Set-Cookie` on `/api/auth/login` and `/api/orders`.

## Open questions

- Should checkout prefill `customerName/Email/Phone` from `user` when logged in? Currently blank — minor UX follow-up.
