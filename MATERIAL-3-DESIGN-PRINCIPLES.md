# Material Design 3 (M3 / Material You) — Design Principles Reference

> Source-grounded reference distilled from the official M3 specification
> (m3.material.io), Google's Material You publications, and the M3
> implementations (Compose, Flutter, Material Web).
> Purpose: framework-agnostic reference for stealing M3's *principles*
> (tokens, scales, roles) into any project — without depending on
> Google's component libraries.
> Last updated: September 2026.

---

## 1. Philosophy — the ideas behind M3

### 1.1 Founding principles (carried over from Material 1 & 2)

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **Material is the metaphor** | UI is built from physical-like surfaces. Edges, shadows and depth communicate hierarchy — a raised surface is more important than a flat one. Decoration never carries meaning; elevation does. |
| 2 | **Bold, graphic, intentional** | Color, typography and shape are deliberate and meaningful. Every visual choice should communicate something (state, hierarchy, brand) — never fill space. |
| 3 | **Motion provides meaning** | Animation exists to explain spatial relationships: where a surface came from, where it went, what is related to what. No gratuitous animation. |

### 1.2 Material You additions (what makes it M3, not M2)

| # | Principle | Meaning |
|---|-----------|---------|
| 4 | **Form follows feeling** | Emotion is treated as a UX input, not decoration. Interfaces should evoke something; desirability is a usability factor (validated by Google's M3 Expressive research program). |
| 5 | **User as co-creator** | The system adapts to the person, not one designer vision for everyone. Dynamic color (seed → full scheme), adaptable type, and theming levers let individuals shape the UI. The designer's brand sometimes takes a backseat to user expression. |
| 6 | **Consistency ≠ uniformity** | One token system, many valid expressions. Two apps (or two users) can look different while both being "correct" M3, because correctness lives in the *roles and relationships*, not fixed hex values. |
| 7 | **Accessible by default** | Contrast is engineered *into* the color system (tonal palettes + strict `on-*` roles) rather than checked after the fact. Any seed color should produce a passing scheme. |
| 8 | **Adaptive everywhere** | One system spans phones, tablets, desktops, foldables: navigation morphs (bar → rail → drawer), layouts reflow across breakpoints, components resize within defined ranges. |

---

## 2. Color system

M3 color is a pipeline: **seed → tonal palettes → color roles → light/dark schemes.**

### 2.1 Dynamic color (the centerpiece)

- A single **seed color** (from wallpaper, brand, or user pick) is converted into the HCT color space (Hue, Chroma, Tone) and expanded into **5 tonal palettes**: primary, secondary, tertiary, neutral, neutral-variant (+ error, fixed red).
- Each palette contains 13 tones (0–100). Tones are perceptually uniform lightness steps — tone 40 in any hue has the same perceived lightness.
- Light and dark schemes are then *read off* the palettes at fixed tones (e.g. light `primary` = tone 40, dark `primary` = tone 80). This is why any seed yields a coherent, accessible scheme automatically.
- **Takeaway for stealing:** you don't need the HCT algorithm. Pick a seed, hand-derive ~6 key tones per palette (or use Material Theme Builder once), and freeze them as tokens.

### 2.2 Color roles (the actual API of M3 color)

Never use raw palette colors in UI. Always use **roles**. Each role has a fixed job and a guaranteed-contrast partner (`on-*` roles go on top of their parent).

**Accent roles:**

| Role | Job |
|------|-----|
| `primary` | Key actions, FAB, active states, brand moments |
| `on-primary` | Content on top of `primary` |
| `primary-container` | High-emphasis fills, tinted cards, selected states |
| `on-primary-container` | Content on `primary-container` |
| `secondary` | Less prominent actions, filters, chips |
| `on-secondary` | Content on `secondary` |
| `secondary-container` | Selected / highlighted fills (e.g. selected nav item) |
| `on-secondary-container` | Content on `secondary-container` |
| `tertiary` | Contrasting accent for balance (badges, illustrations, charts) |
| `on-tertiary` / `tertiary-container` / `on-tertiary-container` | As above |

**Surface roles (the background ladder):**

| Role | Job |
|------|-----|
| `background` / `on-background` | App background, scrolling content |
| `surface` / `on-surface` | Cards, sheets, dialogs, menus (default surface) |
| `surface-variant` / `on-surface-variant` | Subtle differentiation; secondary text lives on `on-surface-variant` |
| `surface-dim` | Darkest surface (anchors gradients) |
| `surface-bright` | Brightest surface |
| `surface-container-lowest` → `surface-container-highest` (5 steps) | Layered depth: lowest = flat/app bg, low = cards, default = raised, high = dialogs, highest = topmost overlays |
| `surface-tint` | Always = `primary`; used for elevation tint overlays |
| `inverse-surface` / `inverse-on-surface` / `inverse-primary` | High-contrast flips (snackbars, tooltips) |

**Utility roles:**

| Role | Job |
|------|-----|
| `error` / `on-error` / `error-container` / `on-error-container` | Errors, destructive actions (fixed red family) |
| `outline` | Borders needing emphasis (inputs, focus rings) |
| `outline-variant` | Subtle dividers, hairlines |
| `shadow` / `scrim` | Shadows and modal scrims (always black) |

### 2.3 Baseline schemes (seed `#6750A4`, for reference)

Light:

| Token | Value | Token | Value |
|---|---|---|---|
| primary | `#6750A4` | on-primary | `#FFFFFF` |
| primary-container | `#EADDFF` | on-primary-container | `#21005D` |
| secondary | `#625B71` | on-secondary | `#FFFFFF` |
| secondary-container | `#E8DEF8` | on-secondary-container | `#1D192B` |
| tertiary | `#7D5260` | on-tertiary | `#FFFFFF` |
| tertiary-container | `#FFD8E4` | on-tertiary-container | `#31111D` |
| error | `#B3261E` | on-error | `#FFFFFF` |
| error-container | `#F9DEDC` | on-error-container | `#410E0B` |
| background | `#FFFBFE` | on-background | `#1C1B1F` |
| surface | `#FFFBFE` | on-surface | `#1C1B1F` |
| surface-variant | `#E7E0EC` | on-surface-variant | `#49454F` |
| surface-dim | `#DED8E1` | surface-bright | `#FFFBFE` |
| container-lowest | `#FFFFFF` | container-low | `#F7F2FA` |
| container | `#F3EDF7` | container-high | `#ECE6F0` |
| container-highest | `#E6E0E9` | outline | `#79747E` |
| outline-variant | `#CAC4D0` | inverse-surface | `#313033` |
| inverse-on-surface | `#F4EFF4` | inverse-primary | `#D0BCFF` |

Dark:

| Token | Value | Token | Value |
|---|---|---|---|
| primary | `#D0BCFF` | on-primary | `#381E72` |
| primary-container | `#4F378B` | on-primary-container | `#EADDFF` |
| secondary | `#CCC2DC` | on-secondary | `#332D41` |
| secondary-container | `#4A4458` | on-secondary-container | `#E8DEF8` |
| tertiary | `#EFB8C8` | on-tertiary | `#492532` |
| tertiary-container | `#633B48` | on-tertiary-container | `#FFD8E4` |
| error | `#F2B8B5` | on-error | `#601410` |
| error-container | `#8C1D18` | on-error-container | `#F9DEDC` |
| background | `#141218` | on-background | `#E6E0E9` |
| surface | `#141218` | on-surface | `#E6E0E9` |
| surface-variant | `#49454F` | on-surface-variant | `#CAC4D0` |
| surface-dim | `#141218` | surface-bright | `#3B383E` |
| container-lowest | `#0F0D13` | container-low | `#1D1B20` |
| container | `#232127` | container-high | `#2B2930` |
| container-highest | `#36343B` | outline | `#938F99` |
| outline-variant | `#49454F` | inverse-surface | `#E6E0E9` |
| inverse-on-surface | `#313033` | inverse-primary | `#6750A4` |

> Rule of thumb visible above: light scheme reads *dark text on light fills*
> (accent = tone 40, fills = tone 90); dark scheme flips to *light text on
> dark fills* (accent = tone 80, fills = tone 30). Copy that relationship
> for any custom seed.

### 2.4 Color rules

1. **Always pair roles**: `on-primary` on `primary`, `on-primary-container` on `primary-container` — never cross-pair. Contrast is only guaranteed within pairs.
2. **One accent at a time**: `primary` dominates; `secondary`/`tertiary` support. If everything is accented, nothing is.
3. **Dark theme is a separate scheme**, not an inversion: desaturate, use tone-80 accents, and express elevation with *lighter* surfaces (the container ladder), never with shadows alone.
4. **Never pure black backgrounds** in dark mode; use the dark `surface` (≈ tone 6 neutral).
5. **Don't use color alone** to convey meaning — pair with icons/text (accessibility).

---

## 3. Typography

### 3.1 The fixed scale (what "fixed" means)

M3 defines exactly **15 named slots** — 5 roles × 3 sizes — plus a mirrored
**15-style emphasized set** (30 total). Every M3 component is built against
these slots. Customization = swapping the *typeface*, never inventing new
sizes; changing sizes breaks component rendering and reflow. If 15 is too
many, M3 expects you to **pick a reduced subset** (typically 5–8 styles) and
drop the rest — staying on-scale.

The scale follows a **Major Second progression anchored at 14px**
(the body size), which is why the numbers look the way they do.

### 3.2 The five roles

| Role | Job | Typical use |
|------|-----|-------------|
| **Display** | Largest, hero moments | Landing heroes, empty states, onboarding. Short text only. |
| **Headline** | Section statements | Page titles, section headers, important numerals. Short text. |
| **Title** | Medium emphasis, short text | Card titles, dialog titles, list headers, app bars. |
| **Body** | Long-form reading | Paragraphs, descriptions, product copy. |
| **Label** | UI chrome | Buttons, tabs, chips, captions, text fields, overlines. Small + medium weight. |

### 3.3 Baseline slots (size / line-height / tracking / weight; Roboto default)

| Style | Size | Line-height | Tracking | Weight |
|---|---|---|---|---|
| Display Large | 57 | 64 | −0.25 | 400 |
| Display Medium | 45 | 52 | 0 | 400 |
| Display Small | 36 | 44 | 0 | 400 |
| Headline Large | 32 | 40 | 0 | 400 |
| Headline Medium | 28 | 36 | 0 | 400 |
| Headline Small | 24 | 32 | 0 | 400 |
| Title Large | 22 | 28 | 0 | 400 |
| Title Medium | 16 | 24 | +0.15 | 500 |
| Title Small | 14 | 20 | +0.10 | 500 |
| Body Large | 16 | 24 | +0.50 | 400 |
| Body Medium | 14 | 20 | +0.25 | 400 |
| Body Small | 12 | 16 | +0.40 | 400 |
| Label Large | 14 | 20 | +0.10 | 500 |
| Label Medium | 12 | 16 | +0.50 | 500 |
| Label Small | 11 | 16 | +0.50 | 500 |

### 3.4 Supporting rules

- **Brand vs. plain typeface**: large styles (Display/Headline) take an expressive *brand* face; small styles (Body/Label) take a legible *plain* face. Default is Roboto for both; change the two face tokens, keep the sizes.
- **Emphasized set**: same 15 slots with bolder/wider treatment via variable-font axes — used for selection, actions, headlines, editorial moments. Keep emphasized styles visually consistent with each other.
- **Variable fonts preferred**: weight/width/grade/slant/optical-size axes give expression without new files.
- **Tracking math**: letter-spacing = tracking(px) ÷ font-size. On web use `em` (Android uses `sp`-relative `em` too). Example: Label Small +0.5px @ 11px → `0.045em`.
- **Type & color pairing**: body text on `on-surface` / `on-surface-variant`; interactive labels on `primary`; never place body text directly on `primary`.

---

## 4. Shape scale

One scale of corner roundness; corner style **identifies components** and
carries brand expression (rounder = friendlier, squarer = more technical).

| Token | Radius | Used for |
|-------|--------|----------|
| Extra Small (XS) | 4px | Chips internals, small controls, dividers-adjacent elements |
| Small (S) | 8px | Chips, menus, snackbars, small cards |
| Medium (M) | 12px | Cards, dialogs (small), text fields, filled buttons (alt) |
| Large (L) | 16px | FAB, extended FAB, bottom sheets (top corners), large cards |
| Extra Large (XL) | 28px | Dialogs, large sheets, hero containers |
| Full | 999px (stadium/circle) | Buttons (default), icon buttons, avatars, switches, badges |

Rules:

1. Shape communicates **state and identity**: pressed/morphed shapes (e.g. FAB → toolbar) signal transformation.
2. Keep **one shape language per product**: if buttons are `full`, don't make cards `full` too — contrast shapes by role.
3. Shape pairs with elevation: higher surfaces may use larger radii.

---

## 5. Elevation

Elevation = distance along the z-axis. All surfaces/components carry a level,
expressed as **shadow + surface-tint overlay** (tint = `primary` over
`surface`). In dark mode the tint overlay matters more than the shadow.

| Level | Shadow | Tint overlay | Typical use |
|-------|--------|--------------|-------------|
| 0 | none | 0% | Flat backgrounds, dividers |
| 1 | `0 1px 2px rgba(0,0,0,.30), 0 1px 3px 1px rgba(0,0,0,.15)` | +5% | Cards (resting), raised buttons |
| 2 | `0 1px 2px rgba(0,0,0,.30), 0 2px 6px 2px rgba(0,0,0,.15)` | +8% | Cards (hover), menus |
| 3 | `0 4px 8px 3px rgba(0,0,0,.15), 0 1px 3px rgba(0,0,0,.30)` | +11% | FAB, snackbars, sheets (resting) |
| 4 | `0 6px 10px 4px rgba(0,0,0,.15), 0 2px 3px rgba(0,0,0,.30)` | +12% | Sheets (raised), app bars (scrolled) |
| 5 | `0 8px 12px 6px rgba(0,0,0,.15), 0 4px 4px rgba(0,0,0,.30)` | +14% | Dialogs, pickers, topmost overlays |

Rules:

1. Elevation **only increases on interaction** (rest → hover → drag → overlay); it never decorates static content.
2. In dark mode, prefer the **surface-container ladder** (§2.2) over deeper shadows.
3. One scrim (`#000`, ~32–50%) sits under modal levels (3+).

---

## 6. Motion

Motion explains space: enter/exit, hierarchy, and cause→effect.

**Easing tokens:**

| Token | Curve | Use |
|-------|-------|-----|
| `emphasized` | `cubic-bezier(0.05, 0.7, 0.1, 1.0)` | Default for most UI motion; expressive but controlled |
| `emphasized-accelerate` | `cubic-bezier(0.3, 0, 0.8, 0.15)` | Elements leaving the screen |
| `emphasized-decelerate` | `cubic-bezier(0.05, 0.7, 0.1, 1.0)` | Elements entering the screen |
| `standard` | `cubic-bezier(0.2, 0, 0, 1)` | Small utility motion (fades, ripples) |
| `standard-accelerate` | `cubic-bezier(0.3, 0, 1, 1)` | Small exits |
| `standard-decelerate` | `cubic-bezier(0, 0, 0, 1)` | Small entrances |

**Duration tokens (ms):** short 50 / 100 / 150 / 200 · medium 250 / 300 / 350 / 400 · long 450 / 500 / 550 / 600 · extra-long 700–1000 (only large, shared-element transitions).

**Transition patterns:** fade · fade-through · shared-axis (X/Y/Z) · container transform (shared-element morph, e.g. card → detail, FAB → sheet).

**State motion:** state-layer opacity changes use `standard` easing at short durations; layout changes (reflow) animate size/position rather than jumping.

Rules:

1. **Exits accelerate, entrances decelerate** — never the reverse.
2. Duration scales with travel distance; small fades stay ≤150ms.
3. Respect `prefers-reduced-motion`: replace movement with fades/dissolves.

---

## 7. Interaction states (state layers)

A translucent layer of `on-surface` (or `on-<container>`) drawn over a
component at fixed opacities. Same numbers everywhere — this is what makes
unrelated components *feel* like one system.

| State | Opacity | Notes |
|-------|---------|-------|
| Hover | **8%** | Pointer hover; also drives hover elevation (+1 level) |
| Focus (keyboard) | **12%** | Always paired with a visible focus indicator (outline/ring) |
| Pressed | **12%** | Touch/click hold |
| Dragged | **16%** | Drag-and-drop, sliders |
| Selected | — | Uses `secondary-container` fill (not an overlay) |
| Disabled | 38% content on 12% container | Never interactive; never use color alone to signal |

Rules:

1. State color = the `on-*` role of whatever surface it sits on.
2. Focus must **always** be visible via keyboard, even where hover is subtle.
3. Disabled elements show no state layers and no pointer events.

---

## 8. Icons (Material Symbols)

- Variable icon font with axes: **weight 100–700**, **optical size 20–48**, grade, plus three styles: **outlined / rounded / sharp**.
- Match icon weight to surrounding type weight; match optical size to rendered size (don't scale one master asset).
- Icons inherit `currentColor` from their `on-*` role — never hard-code icon colors.
- Touch targets for icon buttons: **48×48dp** minimum (icon itself 24px).

---

## 9. Layout

**Breakpoints (window widths):**

| Class | Range | Columns | Margins | Gutter | Nav pattern |
|-------|-------|---------|---------|--------|-------------|
| Compact | 0–599 | 4 | 16 | 16 | Navigation bar |
| Medium | 600–839 | 8 | 24 | 24 | Navigation rail |
| Expanded | 840–1199 | 12 | 24 | 24 | Navigation drawer (modal) |
| Large | 1200–1599 | 12 | 24 | 24 | Navigation drawer (permanent) |
| Extra-large | 1600+ | 12 | 24 | 24 | Permanent drawer + supporting pane |

**Rules:**

1. **Spacing base unit 4** (4, 8, 12, 16, 24, 32, 48…); all padding/gaps snap to it.
2. Build from the **scaffold**: app bar + navigation + body + FAB in standard slots; start new screens from **canonical layouts** (list-detail, feed, supporting-pane).
3. **Bidirectionality**: mirror layouts for RTL languages (start/end, never left/right).
4. Content max-widths per breakpoint; body text measure ≤ ~80ch.

---

## 10. Components (governing ideas, not an exhaustive catalog)

M3 components share: a color-role mapping, a shape token, an elevation
level, a type slot, and state layers. Hierarchy *within* a family is
expressed by fill, never by inventing new styles.

| Family | Variants (high → low emphasis) | Key principle |
|--------|-------------------------------|---------------|
| Buttons | Elevated → Filled → Tonal → Outlined → Text | One primary action per view; `filled` = the action, `text` = the escape hatch |
| FAB | Small / regular / large, + extended | Single most important *constructive* action; morphs into toolbars/sheets |
| Icon buttons | Standard / filled / tonal / outlined | 48dp targets; toggle variants use `secondary-container` when selected |
| Cards | Elevated / Filled / Outlined | Container for related content; whole-card action only when content is uniform |
| Chips | Assist / Filter / Input / Suggestion | Compact inputs/filters; selected = `secondary-container` + checkmark |
| Dialogs | Basic / full-screen (small screens) | Interrupt only for critical decisions; 1–2 actions, dismissive action as `text` |
| Sheets | Bottom (modal) / Side | Supplementary content and long action lists; drag handle + scrim |
| Snackbars | Single-line, with optional action | Transient, low-focus feedback; inverse-surface colors; auto-dismiss |
| Navigation | Bar / Rail / Drawer (+ modal drawer) | Chosen by breakpoint (§9); active item = `secondary-container` pill + `on-surface` label |
| Tabs | Primary / Secondary | Same-level content switching; active = `primary` indicator + label |
| Search | Search bar → Search view | Bar collapses into a full view; recent/suggested queries, never a dead end |
| Menus | Dropdown / Exposed select | Anchored to invoker; elevation 2; same-list scrolling, not page scrolling |
| Progress | Linear / Circular | Indeterminate only when duration truly unknown; pair with status text |
| Selection | Switch / Checkbox / Radio | Switch = takes effect immediately; checkbox = applied on submit; radio = exclusive choice |
| Sliders | Continuous / Discrete | Dragged state = 16% layer + enlarged thumb; value label on drag |
| App bars | Small / Medium / Large | Large collapses to small on scroll; surface tint appears on scroll (elev. 2) |

---

## 11. Accessibility (built-in, not bolted on)

- **Contrast**: ≥ 4.5:1 body text, ≥ 3:1 large text/UI boundaries — guaranteed by correct role pairing (§2.4.1).
- **Targets**: ≥ 48×48dp touch targets; ≥ 8dp spacing between targets.
- **Focus**: visible keyboard focus everywhere (§7); logical focus order; focus trapped in modals.
- **Motion**: honor reduced-motion; no information carried by animation alone.
- **Screen readers**: content descriptions on all icon-only controls; state announced (selected/checked/disabled); headings form a real outline.
- **Color independence**: errors, statuses and selections always pair color with icon/text/shape.

---

## 12. Content design (UX writing)

- **Sentence case** everywhere (never title case, never all-caps except brand-mandated logos).
- Lead with the **verb** on actions ("Save changes", not "Changes save").
- Concise: buttons ≤ ~3 words, snackbars 1 line, dialogs titled by decision ("Delete order?").
- Numbers, dates, currency follow the **user's locale**, not the designer's.
- Empty/error states explain *what happened + what to do next*, in body-medium on `on-surface-variant`.

---

## 13. Design tokens (how it all connects)

Three layers, most-specific wins:

1. **Reference tokens** — raw values (`palette.primary40 = #6750A4`).
2. **System tokens** — roles (`color.primary`, `type.titleLarge.size`, `shape.medium`, `elevation.level1`).
3. **Component tokens** — per-component bindings (`button.filled.container.color = color.primary`).

Naming pattern: `{system}.{component}.{property}.{state}` —
e.g. `color.button.filled.label.hover`. Porting M3 to a new codebase =
recreating the **system-token layer** as variables and binding existing
components to them (see §15).

---

## 14. Dark theme (summary rules)

1. Separate scheme from the same palettes (§2.3), not an inverted light theme.
2. Accents go light (tone 80); fills go dark (tone 30 for containers, tone 6 for surfaces).
3. Depth via the **container ladder**, not shadows.
4. Desaturate large surfaces; reserve saturation for accents.
5. Images/illustrations get ~8% white scrim or reduced opacity so they don't vibrate.
6. Never pure black (`#000`) except scrims/shadows.

---

## 15. Appendix — stealing M3 into a non-M3 codebase (porting checklist)

1. **Seed**: pick the brand color (e.g. `#FF6B35`). Generate or hand-pick tonal values; freeze light + dark role tables (§2.3 pattern).
2. **Variables**: encode every role as a theme variable (`--m3-primary`, …) for both schemes; map existing component variables onto them (`--primary → --m3-primary`, `--card → --m3-surface-container-low`, `--border → --m3-outline-variant`, `--ring → --m3-primary`).
3. **Type**: define the chosen subset of §3.3 as utility classes with exact size/line/tracking/weight; assign brand face to Display/Headline, plain face to Body/Label.
4. **Shape**: define 6 radius tokens (§4); remap component radii to them.
5. **Elevation**: define 6 shadow+tint tokens (§5); replace ad-hoc shadows.
6. **States**: implement hover/focus/press overlays at 8/12/12% via color-mix on `currentColor`.
7. **Motion**: adopt easing + duration tokens (§6); standardize transitions.
8. **Dark mode**: class- or media-switched scheme (§14) + `color-scheme: light dark` so native controls follow.
9. **Verify**: role-pair audit (no orphan `on-*`), reduced-subset type check, contrast spot-checks, `prefers-reduced-motion` respected.

### Official implementations (for reference, not required)

| Platform | Implementation | M3 Expressive status (2026) |
|----------|---------------|-----------------------------|
| Android | Jetpack Compose M3 / Views M3 | ✅ First-class |
| Flutter | Flutter Material 3 | ✅ Supported |
| Wear OS | Compose for Wear OS | ✅ Supported |
| Web | `@material/web` (maintenance mode) | ❌ Not implemented — community libs (`@m3e/web`) or hand-ported tokens |
| Angular | Angular Material M3 theming | Partial |

---

*End of reference. When porting, treat §§2–9 as normative (steal exactly)
and §§10–12 as advisory (adapt to the product).*
