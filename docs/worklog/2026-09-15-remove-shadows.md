# 2026-09-15 — Remove all shadows (flat design)

## Goal

Remove every `shadow-*` visual elevation (cards, buttons, sheets, dialogs) to move to a flat, clean aesthetic as requested.

## Changes

- Removed 38 shadow utilities across `app/` (all `shadow-m3-*`, `shadow-sm/xs/lg/md`) via `app/` grep → targeted `class="..."` and JS string literal filtering (`is_shadow_token` = last segment after `:` starts with `shadow`, ignoring `box-shadow` transitions and `--shadow` vars).
- Files touched (representative):
  - `app/components/custom/ecommerce/ProductCard.vue:76,118,127,144,169` — card and quick-add shadows
  - `app/components/custom/product/*` — `ProductGallery`, `SidesRail`, `StickyBuyBar`
  - `app/components/custom/landing/*` — `HeroSection`, `HowItWorks`, `TestimonialCard`, `Testimonials`, `VisitUs`
  - `app/components/custom/general/*` — `NavSheet`, `Navbar` (`shadow-m3-1` on surfaced bar), `AdminProductCard`, `ProductDialog`
  - `app/components/custom/admin/dashboard/SectionCards.vue:33` — `*:shadow-xs`
  - `app/layouts/dashboard.vue:19`, `app/pages/dashboard/*`, `app/pages/product/[id].vue`, `app/app.vue:126` (`toast class shadow-sm`)
  - `app/components/ui/*` — `Card`, `AlertDialogContent`, `DialogContent`, `DropdownMenuContent`, `SheetContent`, `Sidebar`, `Input`, `Select`, `Checkbox`, `Textarea`, `ChartTooltipContent` (all `shadow-*` variants)
- Kept intentionally: `transition-shadow` / `transition-[color,box-shadow]` / `--shadow-m3-*` vars / `--vis-tooltip-shadow-color` — these are transitions/vars, not visual shadows. `after:content-['']` preserved.

## Verification

- `grep -rn "shadow-m3\|shadow-sm" app --include="*.vue"` → 0 results; `grep shadow` now only shows transitions/vars.
- `npm test` 6 files 47/47 passing.
- `npm run build` passed: client 4566 modules, server 543 modules, Nitro `sitemap.xml` prerender, no errors (Tailwind Vite sourcemap warnings only as before). CSS entry shrank `168.00 kB → 165.13 kB` from removed shadows.

## Where it stopped / pending

- Flat design is applied globally; no visual test in browser yet — confirm cards still have sufficient border separation without elevation.

## Open questions

- None.
