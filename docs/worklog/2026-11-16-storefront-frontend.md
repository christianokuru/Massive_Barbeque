# 2026-11-16 — Storefront frontend fixes and redesign

Goal: make every shop page work correctly with the API and look clean on phone, tablet and desktop.

## Bugs fixed
- **Cart badge / checkout hydration mismatch** on every page: the cart was read from localStorage during setup, so the browser's first render differed from the server's. Now loaded in `onNuxtReady` (`plugins/cart.client.ts`); checkout shows a placeholder until it's ready instead of flashing "cart is empty".
- **Stale cart prices**: the cart kept the price from when an item was added, so checkout showed (and the Pay button said) the wrong total, and removed sizes failed with a vague error. New `POST /api/cart/quote` returns live values; cart sheet and checkout sync, drop removed sizes and say which. Checkout also refuses to redirect if the server's total differs from the one shown.
- **"Try again" after a failed payment led to an empty cart** (cart is cleared before the gateway). The confirm page now pays the existing order directly (`usePayOrder`).
- **Confirm page**: unknown order showed "No charge was made"; guests had a "Track order" link into a login wall; no way to see items or cancel. Rebuilt as a proper order page with status, items, totals, delivery details, pay again, cancel, and auto-refresh while the webhook lands.
- **Guests had no way to track orders** (footer "Track order" → login). New `/track`.
- **Product page** showed "₦0" as the price until a size was picked; sticky buy bar never attached after client navigation; single-size products needed an extra tap; "Checkout" shown with an empty cart.
- **Contact page** had no form even though `/api/contact` exists. Added a validated form (honeypot, field errors, clear failure message).
- **Checkout**: signed-in buyers could type an email the server then ignored (now shown fixed); guests triggered a 401 on `/api/addresses`; Enter key did nothing.
- **Menu** filters weren't in the URL (lost on back/reload, not shareable).
- Nuxt's default dev error page replaced with a branded `error.vue`.
- Footer showed "Log in" to signed-in users.

## Tests
- Unit: 149 passing (new `tests/cartQuote.test.ts`).
- Browser (desktop + iPhone 13): 48/48 storefront checks — guest checkout, backing out at the gateway then paying from the confirm page, Flutterwave pickup, cancel, track, contact, 404, signed-in checkout. Customer dashboard, addresses and admin suites re-run and pass.
- Crawl of 13 pages at 390/820/1440 px: no console errors, no hydration warnings, no horizontal overflow.

## Notes
- The homepage hero and auth side image are Unsplash stock photos (allowed in CSP/IPX). They work in production; consider replacing them with the shop's own high-res photos.
