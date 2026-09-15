# 2026-09-10 — M3 migration, cart persistence, light-mode removal, menu rebuild

> Source: reconstructed from git history (`c95801d` → `1273e5d` → `642419d` →
> `875a53c`, author christianokuru). Not witnessed live — from commit messages
> and `git show --stat`.

## Goal

Migrate the whole UI to the Material 3 design system, make the cart persist in
localStorage with tests, kill light mode (dark-only app), and rebuild the menu page.

## Changes

- `c95801d` "major refactor: migrate to Material 3 design system" (largest UI
  commit on record): `MATERIAL-3-DESIGN-PRINCIPLES.md` (428-line M3 reference),
  `app/assets/css/main.css` rewritten around M3 tokens (seed `#FF6B35`, later
  replaced 2026-09-15), `M3Icon.vue` (Material Symbols), new live components —
  `CartSheet`, `NavSheet` (replacing `MobileMenu.vue`, deleted),
  `AdminProductCard` + `ProductDialog` (replacing `admin/ProductForm.vue`, deleted),
  `ProductCard` expanded, `Footer`, `Navbar`, `FreshOffGrill`, `HeroSection` —
  and `AGENTS.md` updated to match.
- `1273e5d` "updated the cart store to use local storage": cart persistence
  (`app/composables/cart/storage.ts`, envelope key `mb:cart:v1`) + cart operation
  tests; `nuxt.config.ts` + `public/_robots.txt` touch-ups.
- `642419d` "removed light mode": deleted `ThemeToggle.vue` and
  `useDarkMode.js`, stripped toggle references from `Navbar`/`SiteHeader`/
  dashboard layout, locked `colorMode` to dark (`preference/fallback "dark"`,
  `storageKey "massive-theme"`); added static `about.vue` + `contact.vue` pages.
- `875a53c` "Improved the menu page": `menu.vue` rebuilt (search + category
  filter, `limit: 60`, skeleton grid) with a `ProductCard` fix-up.

## Decisions & tradeoffs (inferred)

- M3 tokens as the single styling source (no `tailwind.config`); shadcn vars
  mapped onto M3 roles so `ui/*` follows automatically.
- Cart kept local-first (localStorage, zero network until checkout) instead of
  the unused `carts`/`cart_items` DB tables — server reprices at checkout.
- Dark-only: removed the toggle entirely rather than maintaining two themes.

## Verification

- Cart suites (`tests/cartStore.test.ts`) added here; no recorded run output.
  Re-run `npx vitest run tests/cartStore.test.ts` if touching cart code.

## Where it stopped / pending (as of these commits)

- M3 migration done except later palette swap (2026-09-15 replaced the
  `#FF6B35` seed with the ember/charcoal brand palette).
- `custom/Home/*` + `useProjects.ts` left in place as dead legacy (still present).

## Open questions

- None carried forward.
