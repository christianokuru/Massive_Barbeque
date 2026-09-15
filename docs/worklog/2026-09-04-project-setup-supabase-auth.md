# 2026-09-04 — Project setup, Supabase + tests, auth + admin shell

> Source: reconstructed from git history (`adb7702` → `b67c669` → `1857acf`,
> author christianokuru). Not witnessed live by an agent — details come from
> commit messages and `git show --stat`. Treat file lists as exact, motives as inferred.

## Goal

Scaffold the Nuxt app, wire Supabase (Postgres + Auth), ship email/password auth
pages with route guards, add the first tests, and start the admin dashboard UI shell.

## Changes

- `adb7702` "Project Setup": Nuxt scaffold (`app/app.vue`, `app/assets/css/main.css`,
  `.env.example`, `.gitignore`, `AGENTS.md`, `README.md`) plus the Kylva
  luxury-agency template assets under `app/assets/images/` (later established as
  unused legacy — see `docs/codebase.md` §4.4).
- `b67c669` "installed Supabase and added some tests": `.env.example` Supabase keys,
  `AGENTS.md` update, `PRD.md` (batch notes), `app/app.vue` tweak,
  `PasswordInput.vue`, `useAuth.ts` / `useSupabase.ts` session façade,
  `app/middleware/auth.ts` + `admin.ts` (server-safe via `/api/auth/session`),
  `admin/products/[id].vue` + `admin/products/new.vue` (both later removed in
  favor of the single-page + dialog pattern), first test files.
- `1857acf` "Done with auth and started admin dashboard UI": full admin dashboard
  shell — `AppSidebar`, `NavMain`, `NavUser`, `SiteHeader`, `SectionCards`,
  `ChartAreaInteractive` (@unovis), `DataTable` + `features.ts` (@tanstack/vue-table)
  — plus the bulk `app/components/ui/*` shadcn-vue install (avatar, badge, button,
  card, …).

## Decisions & tradeoffs (inferred)

- Supabase Auth email/password with `@supabase/ssr` cookie sessions instead of
  custom JWT handling — server middleware forwards cookies to `/api/auth/session`.
- Admin console built on shadcn-vue primitives + TanStack Table + Unovis from day
  one (hence the `manualChunks` split for `unovis`/`vue-table` in `nuxt.config.ts`).

## Verification

- No recorded test output in the commits. First verification on record is
  `npm test` 47/47 much later (2026-09-15). If touching this era's code, re-run
  `npx vitest run tests/<name>.test.ts` for the affected suite.

## Where it stopped / pending (as of this commit)

- Auth pages done; admin dashboard was UI shell only (no live data wiring yet).
- `admin/products/[id].vue` + `new.vue` still existed (removed 2026-09-13).

## Open questions

- None carried forward — later commits superseded the open items.
