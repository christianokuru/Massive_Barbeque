# 2026-09-15 — Dashboard polish, codebase guide, ember/charcoal retheme

> Source: agent-witnessed sessions (AGENTS.md refresh, full-codebase read,
> retheme) + git record for `c98de32`. Commits: `c98de32` ("user dashboard done",
> 13:36) and `7a100db` ("Updated the colors…", 16:00, contains all agent work).

## Goal

1. Refresh `AGENTS.md` against executable sources. 2. Read the entire codebase
(~260 files) and write the deep reference `docs/codebase.md`. 3. Re-theme the UI
to the brand palette: bold red `#D84315`, golden `#FFD54F`, smoky brown `#5D4037`,
charcoal `#212121`. 4. Establish this `docs/worklog/` convention.

## Changes

- `c98de32` (user's session, observed via git): dashboard pages reworked
  (`dashboard/index`, `orders`, `orders/[id]`, `profile`), `dashboard.vue` layout
  tabs, and **~5,400 lines of stale docs deleted** (`docs/brief.md`,
  `docs/codes.txt`, `docs/design-rules.md`, `docs/minimalism.md`, `docs/prd.md`).
  Note: `docs/codebase.md` §9 (written later same day) still describes some of
  these as merely "stale" — they are now deleted; see pending item below.
- AGENTS.md refresh: verified every claim against `package.json`, `nuxt.config.ts`,
  `server/`, `shared/`, `supabase/migrations/`, `tests/`; trimmed two low-signal
  items (components.json alias aside, `server/db/schema.ts` note); added
  `~~/shared/...` import rule, `delivery_address` snake_case quirk, admin page
  reading the public order endpoint, verify/webhook catch-masking note.
- `docs/codebase.md` (new, 571 lines): full route/component/DB catalog, money and
  auth flows, composable contracts, config behavior, 9 verified-unfixed bugs,
  doc trust map.
- Retheme (`7a100db`): `app/assets/css/main.css` — rebuilt both M3 schemes around
  the brand palette (dark is live; light kept coherent but unreachable):

  Dark (live) old → new:
  `primary #ffb693 → #ffb59d` (ember tint — small text/icons/rings; raw `#D84315`
  is only ~3.7:1 on charcoal, too weak for body text) · `primary-container
  #7e2a00 → #D84315` (the bold red itself — buttons, panels, badges) ·
  `secondary-container #5d3f37 → #5D4037` (user's smoky brown, kept) ·
  `tertiary #b8cf8a → #FFD54F` + `tertiary-container #3b4a15 → #574300` (gold
  reserved for stars/ratings) · canvas `#171210 → #212121` with warm porcelain
  text `#f7f1ea` (pure white is harsh on charcoal) · neutral container ladder
  `#1a/#25/#2a/#2f/#35` · error roles left standard (a red error would clash
  with the brand red).
- shadcn mapping changes (the highest-impact call): `--primary` now points at
  the ember **container** (not the M3 tint), so every `bg-primary` CTA —
  hero, sticky buy bar, footer, cart sheet, quick-adds, admin "New product" —
  renders bold red with warm-white labels (~4.4:1, semibold uppercase).
  `--accent` points at the brown secondary-container (calm hovers; red stays
  reserved for committed actions). `--sidebar-primary` follows `--primary`.
- Components: `HeroSection.vue` eyebrow + accent word `text-[#FFB693]` →
  `text-tertiary` (token-driven gold, no hex); `Testimonials.vue` aggregate stars
  and `TestimonialCard.vue` stars + quote mark `text-primary` → `text-tertiary`
  (red stars would be a design miss — stars stay gold).
- `nuxt.config.ts`: `theme-color` + `msapplication-TileColor` → `#D84315`.
- `docs/codebase.md`: two `#FF6B35` mentions updated to the new palette.

## Decisions & tradeoffs

- M3 roles kept semantically pure (tint for text, rich color for fills) instead
  of forcing `#D84315` everywhere — contrast correctness over literalness.
- Gold used sparingly (stars/ratings/hero accents only) so it stays premium.
- Legacy `custom/Home/*` hex values (`#D4AF37`, `#fafaf9`) and the MATERIAL-3
  `#FF6B35` *example* intentionally untouched (dead code / generic reference).
- `Button.vue` dead `asChild` prop, `DataTable` chevron typo, verify/webhook
  catch-masking left unfixed (documented in `docs/codebase.md` §8).

## Verification

- `npm test`: 6 files, **47/47 passing** (run twice — after guide work and after retheme).
- Dev-server compile check: `npm run dev` + `curl localhost:3000` → **HTTP 200**
  on the fresh build. Caveat: the cleanup command hit the 120s tool timeout
  during `pkill/tail`, so the rendered-HTML hex grep never ran; server confirmed
  stopped afterwards (`curl` → 000). Dev log also showed `Port 24678 is already
  in use` (stale Vite HMR port — harmless for `nuxt dev`, noted only).

## Where it stopped / pending

1. **No visual browser check of the new palette yet** — nobody has screenshot-
   reviewed charcoal + ember + gold together. Do this before calling the retheme done.
2. Rendered-HTML grep for new hex values never completed (see above).
3. ~~`docs/codebase.md` §9 still lists `docs/brief.md`, `codes.txt`,
   `design-rules.md`, `minimalism.md`, `prd.md` as stale — they were **deleted**~~
   Correction (verified post-write): `docs/codebase.md` §9 cites root `PRD.md`,
   which still exists — the deleted files were `docs/brief.md`, `docs/codes.txt`,
   `docs/design-rules.md`, `docs/minimalism.md`, `docs/prd.md`, none of which §9
   references. No §9 update needed.
4. Webhook deploy checklist still unchecked (needs public URL + live keys).
5. OTP-login roadmap item still open.

## Open questions

- Product images (`og-image.png`, Unsplash hero) still carry the old orange mood —
  do they need re-art-direction to match ember/charcoal? Awaiting user's UI update list.
