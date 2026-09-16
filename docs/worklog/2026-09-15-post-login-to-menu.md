# 2026-09-15 — Post-login redirect to menu

## Goal

Reduce friction after authentication: customers should land where they can order immediately, not in the account dashboard.

## Changes

- `app/pages/login.vue:29` — default after login changed from `→ /dashboard` to `→ /menu` (admins still `→ /admin`, safe `?redirect=` still honoured: `startsWith("/") && !startsWith("//")`).
- `app/pages/register.vue:39` — same change for new accounts (`signedInInstead` keeps its 1.8s notice delay before redirect).
- Docs: `AGENTS.md:32` and `docs/codebase.md:112,136,187,282` updated to document the new default and the global auth hydration that keeps it reliable; `docs/worklog/2026-09-15-checkout-logout-fix.md` holds the hydration fix that this depends on.

## Decisions & tradeoffs

- Chose `/menu` over `/` — one fewer tap to food. Homepage hero still exposes the same CTA but menu is the ordering surface.
- Kept `?redirect=` priority so guarded pages (e.g. `/dashboard/orders/…` or `/checkout`) still round-trip correctly. Dashboard remains reachable via `Navbar → Account` and `checkout/confirm → Track order`.
- No middleware change — `auth.ts` / `admin.ts` behaviour unchanged.

## Verification

- `npm test` 6 files 47/47 passing (no logic change to tested utils).
- Manual: log in → should land `/menu` with Navbar avatar, not `/dashboard`; log in with `?redirect=/dashboard/orders` → should still land there; admin login → still `/admin`.

## Where it stopped / pending

- Visual review of menu landing after auth not yet done.

## Open questions

- Product images still on old orange palette — awaiting art direction decision.
