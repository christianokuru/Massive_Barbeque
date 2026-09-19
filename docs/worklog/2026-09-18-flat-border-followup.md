# 2026-09-18 — Flat-design border follow-up

## Goal

Confirm borderless flat surfaces still read as cards after shadow removal; add outlines where elevation loss hurts separation.

## Changes

- `app/components/custom/landing/HowItWorks.vue:23` — step cards `rounded-xl bg-card` → `rounded-xl border border-border bg-card` (bg-card on bg-muted section needs outline).
- `app/components/custom/product/DeliveryStrip.vue:25` — tiles `rounded-xl bg-muted` → `rounded-xl border border-border bg-muted`.
- `app/components/custom/product/ProductGallery.vue:19` — media container `rounded-xl bg-muted` → `rounded-xl border border-border bg-muted` (defines edge when image missing/same-tone).
- Left alone (already bordered or solid-fill): `TestimonialCard.vue:49` (`border border-border`), `SidesRail.vue:62` rows, `StickyBuyBar.vue:29` (`border-t`), `VisitUs.vue:32,57` (solid `bg-primary-container`/`bg-primary` fills need no outline).

## Verification

- `npm test` 6 files 47/47 passing.
- No build run (class-only change, prior build clean).

## Open questions

- None.
