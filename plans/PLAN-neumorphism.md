# Wellness Hub — neumorphic UI and the Themes/ palettes — plan

Written 2026-09-30, against commit `d2c57c9`: `css/hub.css` (1,988 lines), `css/themes.css`, `css/neobrutal.css`, `js/theme.js`, `index.html`, `service-worker.js` and the 20 files in `../Themes/`.

Method: read all 20 theme files and measured them with a script (WCAG contrast, hue, CIE L*); rendered Selene's colours in neumorphic shadows at three ground values in headless Chromium and measured the highlight and shadow tones; read every place that hard-codes the current default (`:root`, `theme.js`, the boot script, manifest, service worker) and counted the shape declarations outside `neobrutal.css`. The probe was a standalone page, not the app: no screenshot of the real UI in neumorphism exists yet, so every visual claim below is a measurement on the recipe, not a look at the result.

**Nothing below is implemented — this is the plan.**

## Decisions already made — overturn any of them

**Selene is the default, including on first paint.** `:root` carries Selene's tokens and `data-theme` is always stamped, so nothing flashes the old palette (A6).

| # | Decision | Why | Cost of reversing |
|---|---|---|---|
| 1 | The 20 files **replace** the 7 current palettes (two Gruvbox, Everforest, Rosé Pine, Tokyo Night, the two Ochre) | "Pick up the themes from the theme folder"; 27 tiles in one picker is a scroll, not a choice | The blocks stay in git (`d2c57c9`) and the `.backup-*` files. A saved `gruvbox` preference falls back to Selene through `active()`, which already does this for unknown ids; the preference lives in `wellnessHub.ui`, outside the versioned state and outside backups, so no migration and no history is touched |
| 2 | Neumorphism **replaces** `css/neobrutal.css` | Hard 3–4px shadows and 2px outlines contradict soft dual shadows; leaving both means two shape systems | Restore the file and its `<link>` |
| 3 | The page ground is **not** the file's `background` (A1) | It is `#000000` in 20 of 20 files | Only by dropping neumorphism |
| 4 | Status colours are **not** taken from the files (A2) | `error` = `success` = `primary` in 20 of 20 | — |
| 5 | One **light** palette, "Selene Day", is generated from `selene.txt` (A5) | Your rule is both themes; all 20 files are dark | Skip step B4; it is last on purpose |

## Part A — findings, ranked

### A1 · DESIGN RISK (high): every file's ground is pure black, and neumorphism cannot be drawn on black

`background`, `surface` and every `surfaceContainer*` are `000000` in 20 of 20 files. Neumorphic depth is a light edge on one side and a dark edge on the other; on `#000` the dark edge has nowhere to go. Same recipe (highlight white 7%, shadow black 55%), Selene, three grounds:

| Ground | CIE L* | Shadow vs ground | Reads as |
|---|---|---|---|
| `#000000` — what `selene.txt` says | 0.00 | 0.00 | a faint white glow; no extrusion |
| `#0E1418` — Selene's own `surfaceVariant` | 5.96 | −3.61 | barely there |
| `#202930` — that hue lifted to L\*≈16 | 15.56 | −10.32 | clearly raised and inset |

**Fix:** derive the ground from each file's `surfaceVariant` — keep its hue, cap saturation at 20%, raise lightness to L\*≈16. Smallest correct fix because it keeps each file's own hue rather than inventing a neutral, and it is one function in the generator. The cap matters: uncapped, akira's ground came out `#441A24` (maroon); capped it is `#342327`. **Limit:** the ground is ours, not the file's — the picker swatch draws the lifted ground so a tile matches what you get.

### A2 · DESIGN RISK (high): the files carry no status colours, and five accents sit on danger red

`error`, `success` and `primary` are the same value in 20 of 20 files (Selene: all `CFD8DC`), so danger, success and warning cannot come from them. Separately, five accents are within 25° of red — akira 348°, andromeda 338°, arasaka 0°, basalt 14°, quasar 340° — so on those, Save looks like Delete.

**Fix:** status colours are one fixed set (danger, warning, success, info), nudged per palette only until each clears 4.5:1 as text on that palette's ground — never read from the file. Every status keeps a word or icon beside it, as the existing rule already requires. **Limit:** on the five red-accent palettes the accent and danger are still close in hue; a destructive action is told apart by its label and by being outlined instead of filled, not by colour.

### A3 · INCONSISTENCY (medium): the files' "on" colours are unusable and five accents fail as text

`onPrimary` reaches 4.5:1 on `primary` in 1 of 20 files (voidwalker, 5.21). Selene's is **1.25:1** — light text on a light accent. Separately, the accent fails 4.5:1 as *text* on the lifted ground in 5 of 20: akira 3.86, andromeda 2.98, arasaka 2.98, quasar 4.42, voidwalker 2.35.

**Fix:** text on an accent fill is black or white, whichever scores higher — all 20 reach 4.5:1 with one of the two. Accent used as text is the accent mixed toward the page text colour until it reaches 4.5:1. Both are computed by the generator; nothing is hand-tuned per palette.

### A4 · DESIGN RISK (medium): the extrusion is too faint to serve as a control boundary

Selene: highlight/ground **1.24:1**, shadow/ground **1.27:1**. WCAG 1.4.11 asks 3:1 for the visible edge of a control. A shadow-only button is not findable by someone with low vision.

**Fix:** inputs, buttons and toggles keep a 1px hairline at ≥3:1 (the `--wh-ctl` token the Ochre palettes introduced); the focus ring is 3px and accent-coloured; pressed is inset *and* accent-coloured text, never shadow alone. **Limit:** less pure than the classic soft-UI look — the pure version fails contrast.

### A5 · INCONSISTENCY (medium): no light theme exists in the folder

20 of 20 files are `isDark true`. Retiring the Ochre pair (decision 1) would leave the app dark-only, against the both-themes rule.

**Fix:** one derived palette, Selene Day — same 198° hue, ground at L\*≈90, accent darkened until it clears 4.5:1 as text, same generator. Shipped last so it can be dropped without touching anything else.

### A6 · DESIGN RISK (medium): "default" is hard-coded in three places

`:root` in `css/hub.css` is the Gruvbox ramp; `stamp()` in `js/theme.js` removes the attribute when `id === DEFAULT`; the boot script at `index.html:53` skips it when `id === "gruvbox"`. Change one of the three and first paint flashes the old palette.

**Fix:** generated `:root` = Selene; the attribute is always set; the boot script falls back to `"selene"` when storage is empty or holds an id not in the list.

### A7 · COSMETIC (low): four static Gruvbox colours

`index.html:6` `theme-color`, the inline favicon (`#282828`, `#b8bb26`), and `manifest.webmanifest` `theme_color` / `background_color` (`#1d2021`). `theme.js` rewrites the first at runtime, so these only show before the first script runs and in the installed-app splash. **Fix:** Selene's lifted ground, `#202930`.

### A8 · DESIGN RISK (medium): about 235 radius and 40 shadow declarations sit outside the token layer

`border-radius` / `box-shadow` counts: `fitness/basalt.css` 117 / 24, `css/hub.css` 101 / 11, `css/muscles.css` 10 / 0, `css/basalt-gruvbox.css` 3 / 2, `css/basalt-makeover.css` 4 / 3. Editing them one at a time is how a palette ends up half-converted — `PLAN-neobrutal-ui.md` A5 was exactly that, on Fitness.

**Fix:** route through the tokens that already exist (`--wh-r*`, `--r-*`, `--wh-shadow*`) and put the remainder in one scoped file, `css/neumorph.css`, the way `neobrutal.css` did. After the build, grep for surviving literal shadows and list them here rather than claiming none.

## Part B — the build

Each step ships alone.

| Step | What | Done when |
|---|---|---|
| **B0** | Timestamped backups of `index.html`, `css/hub.css`, `css/themes.css`, `css/basalt-*.css`, `js/theme.js`, `js/views/settings.js`, `service-worker.js`, `manifest.webmanifest` | files exist |
| **B1** | `tools/build-palettes.py` (stdlib only — no venv needed) reads `../Themes/*.txt`, writes `css/palettes.css` (`:root` = Selene, one `html[data-theme]` block per palette) and `js/palettes.data.js` (picker metadata). Both marked GENERATED. Prints a per-palette table of the A3 numbers and **exits non-zero if any pair is under 4.5:1** | the script runs and the table matches A1–A3 |
| **B2** | Skeleton: Selene as `:root`, `css/neumorph.css` styling cards, inputs, buttons only; `theme.js` reads `palettes.data.js`, default `selene` | app opens at 390 and 1920, zero console errors, fresh and seeded profile |
| **B3** | Vertical slices: Dashboard → Settings (incl. a 20-tile picker) → the other ten hub views → Fitness (`--ink-*` ramp, cards, the session bar) → modals, toasts, nav | each slice run before the next |
| **B4** | Selene Day (A5) | dark and light both pass the same checks |
| **B5** | Static colours (A7); `service-worker.js` PRECACHE swaps `themes.css` / `neobrutal.css` for `palettes.css` / `neumorph.css` / `palettes.data.js`, `CACHE_VERSION` `v38` → `v39` | offline reload serves the new files |
| **B6** | `README.md`: palette section, plus a "things most themes get wrong" entry on black grounds and unreadable `on*` colours | — |

`src-tauri/copy-assets.sh` copies `css/`, `js/`, `fitness/`, `icons/` and `vendor/` wholesale, so the desktop build needs no script change.

**Verification (Gate 2), by clicking, not `page.evaluate`:** every one of the 20 palettes (and Selene Day) picked from the Settings picker with zero page errors; computed contrast of primary text, on-accent text and every status colour ≥4.5:1 asserted from the live DOM; a profile seeded with `wellnessHub.ui = {"theme":"gruvbox"}` loads Selene; a profile with saved habit data loads unchanged; screenshots of Dashboard, Settings and Fitness at 390, 1440 and 1920 for Selene, akira (red accent), chernobyl (neon), voidwalker (dark accent) and Selene Day; `node tools/check-muscle-map.js`. **Not verifiable here:** the installed desktop shell and the Android WebView — those need the Update button and a device.

## Part C — motion (added at approval, 2026-09-30)

**Motion is on controls and on arrivals, never on data.** Gate, by how often each thing happens:

| Motion | Frequency tier | Purpose | Tool · properties · curve · duration |
|---|---|---|---|
| Press: raised → sunk | dozens/day | feedback | CSS transition · `box-shadow` (small controls only) + `transform: scale(.98)` · strong ease-out · 120ms |
| Tab switch: children rise in a short cascade | tens/day | spatial consistency | CSS animation · `transform` 4px + `opacity` · strong ease-out · 200ms, 45ms stagger, only during a 450ms `is-entering` flag |
| Palette switch: page crossfade | rare | preventing a jarring change | View Transitions API (`document.startViewTransition`) · GPU-composited · 220ms; instant where unsupported |
| Modal opens from 97%, toast/view entrances | occasional | spatial consistency | existing keyframes, re-pointed to the strong ease-out |

**Extends the existing tokens, adds no second set.** `--wh-ease` is redefined to `cubic-bezier(.23,1,.32,1)` (the old `.22,.61,.36,1` was a mild ease-out), so every existing transition and animation that reads it gets the stronger curve (hub.css has 60 transitions and 9 keyframes; BASALT has its own `--ease`, pointed at the same value); one new token, `--wh-ease-io`, for movement between two on-screen places. `--wh-fast` / `--wh-slow` are untouched.

**Rejected, on the frequency gate:** a hover lift on cards (tens/day, and a well does not lift), animated progress fills beyond the existing width transitions, any motion on a keyboard shortcut, and a decorative loop anywhere data is read.

**Guards that ship with it:** `prefers-reduced-motion` switches the cascade off entirely (a stagger's *delay* is not a duration, so the existing `.001ms` rule would leave content invisible for up to 180ms) and skips the view transition; pressing still sinks, without the scale. Hover styling is inside `@media (hover: hover) and (pointer: fine)`. **Limit:** `box-shadow` repaints. It is used on ~20 small controls a screen and never on a card; if a low-end WebView drops frames on press, the fix is to move the inset layer to a `::after` and fade its `opacity`. That has not been measured on a device.

## Out of scope

- **True-black (AMOLED) variant** — it is the one thing the files literally say and neumorphism cannot show; a flat-black option would be a different theme, not this one.
- **Per-section accent colours** — one accent per palette, sections told apart by label and position, as the neobrutal plan already decided.
- **Font changes** — type stays as it is. `vendor/inter/` becomes unreferenced once `neobrutal.css` goes; it is left in place until you say to delete it.
- **The Android countdown face** (`js/face.js`) — two-tone by design in `PLAN-android.md`; verified for legibility only, not restyled.
- **A theme editor or importing `.txt` files at runtime** — `../Themes/` is outside the repo and not packaged, so the generator bakes the values in.

## Status, 2026-09-30 (later the same day): implemented — what was built, where it departs, what was not verified

The paragraphs above are left as written. Everything in Part B and Part C was built and run.

**Built.** `tools/build-palettes.py` → `css/palettes.css` (21 palettes, Selene also `:root`) and `js/palettes.data.js`; `css/neumorph.css` (shape, depth, motion); `js/theme.js` reads the generated list, always stamps the attribute and crossfades a switch through `startViewTransition`; `index.html`, `manifest.webmanifest` and the favicon carry Selene's ground `#202930`; the service worker precaches the new files (`v38` → `v39`). `css/themes.css` and `css/neobrutal.css` are deleted from the working tree — nothing is committed, and both are in git (`d2c57c9`) and as `.backup-20260930-103644` copies.

**Departures from the plan.**

| # | What | Why |
|---|---|---|
| 1 | The countdown face's light variant moved from `themes.css` into `css/hub.css` | It lived in `themes.css` and was not on the plan's list; deleting the sheet would have dropped it silently |
| 2 | The generator holds text floors on three surfaces (ground, hover tint, well tint), not the ground alone | The first Selene Day audit found 11 elements at 4.15:1 and 3.91:1 on the darker tint |
| 3 | Selene Day's accent comes from `tertiary_paletteKeyColor` (`#455A64`) | Selene's plain `tertiary` is `CFD8DC`, the same as `primary` |
| 4 | The palette picker is two columns at ≤640px and hides each tile's note there | 21 tiles in one column were ~3,400px at 390px |
| 5 | `Hub.show()` in `js/core.js` sets a 450ms `is-entering` flag | The tab cascade would otherwise replay on every `refresh()`, i.e. every logged glass of water |
| 6 | Clicking the palette that is already active is still a no-op | Unchanged behaviour: for the default, nothing is stored until a different palette is chosen |

**Verified by running.** 106 checks, 0 failures, in one run on the final files (`suite.py`, 280s): every palette picked by clicking; live-DOM contrast; control edges ≥3:1; a retired saved id lands on Selene; 21 switches leave saved logs byte-identical; no `SCHEMA_VERSION` change; 390px and 1920px layout; the press sinks and returns (120ms); the cascade runs on a tab switch, clears, and does **not** replay on a refresh; reduced motion removes it; the crossfade is used once, and skipped under reduced motion; every precached path exists; the generator is idempotent; `tools/check-muscle-map.js` still passes. The before/after audit table is in the README.

**A8 follow-up.** 24 literal `box-shadow` declarations remain outside the token layer; 10 of them are on classes `neumorph.css` never mentions: `.wh-theme__surface`, `.wh-tour-spot`, `.choice.is-sel`, `.rt`, `.cal-day--next`, `.cal-day--run`, `.cal-day--run-done`, `.minput:focus`, `.pg-day.is-next`, `.run-goal.is-sel`. All are state rings, glows or a spotlight, not depth, and the ones that carry colour read `--primary` / `--*-rgb`, so they follow the palette.

**Not verified.** The installed desktop shell and the Android WebView; press frame rate on a low-end phone (the ceiling named in Part C); whether `startViewTransition` exists in the desktop shell's WebKitGTK; hover states; the keyboard focus ring on screen; print; Fitness with training history; and how the motion feels.

**Known limits, stated where they bite.** On the five red-accent palettes (akira, andromeda, arasaka, basalt, quasar) a filled primary button is close in hue to danger; destructive buttons are outlined and labelled instead. On borealis, chernobyl and nostromo the accent is green and so is "done". Selene's accent is a light grey-blue, so its primary button is a pale fill with black text — legible (14.5:1), but the least "accent-like" of the twenty-one.

**Addendum, 2026-09-30 (same day, after the Android updater work).** "Hover states" was on the not-verified list above, and driving a real pointer over the primary button found a defect in this build: the fill lightened toward `fg0` on hover, which lowered a white label to 4.31:1 on arasaka and 4.37:1 on andromeda. `tools/build-palettes.py` now emits `--wh-accent-hover` (the fill moves away from its label) and refuses any palette under 4.5:1 hovered; the danger button's hover wash went from 12% to 10% (Selene Day was 4.44:1). The Gate-2 suite gained a per-palette hover check. Hover on anything other than the primary button is still not driven.

