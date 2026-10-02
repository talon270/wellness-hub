# Wellness Hub — restrained neobrutalist UI plan

Written 2026-09-29; extended 2026-09-30 with a Fitness review and navigation specification. Original source anchors: `css/hub.css`, `css/themes.css`, `css/basalt-gruvbox.css`, `css/basalt-makeover.css`, `js/core.js`, `js/theme.js`, `js/views/dashboard.js`, and `js/views/settings.js`. `css/hub.css` SHA-256 at the original review: `511d52c36b825cb0d4841e180d5d852ddfdff8d45c61de33c206f795e7c3cece`. Line references below identify that review snapshot; locate the named functions before editing.

Method: read the active stylesheets, theme and navigation code, and the relevant view renderers. Opened `index.html` in isolated Chromium profiles and navigated by clicking the UI. Captured Dashboard, Health Records, Settings, Insights and Fitness at 1440px and 1920px, plus Dashboard, Fitness, Eye Care and Wellness at 390px. The 14 inspected screens had zero page errors and no document-level horizontal overflow. Screenshots and measurements are in `/tmp/helth-ui-inspection/`; they are temporary evidence. This was a fresh-profile visual review. Populated data, preference migrations, sync, offline caching and physical Android behaviour have not been verified.

**Fitness review method:** clicked through all eight Fitness sections at 390 × 844, 1440 × 900 and 1920 × 1080 in isolated Chromium profiles, using synthetic onboarding, bodyweight and sleep data. Checked onboarding visibility, a Dashboard shortcut, saved-section reload, keyboard activation of a Progress tab, and an active workout with notes. The 24 section renders had no page errors; Evaluation overflowed to 504px on the 390px viewport. Workout notes survived switching sections and leaving Fitness for the hub. Screenshots, `metrics.json` and `followup.json` are in `/tmp/helth-fitness-review/`. Training history, phase advancement, running plans, timer continuity and physical Android behaviour were not exercised. No personal data was used.

**This update changes the plan only; the Fitness navigation changes below are not implemented.** Since the captures, the working tree has gained `css/neobrutal.css`, local Inter assets and ochre palette work. The earlier findings and measurements remain a baseline, not a verdict on those newer changes. Reconcile the original steps with that work instead of adding duplicate themes or styles. Fitness's core JS and original CSS remain unchanged at this update: SHA-256 `d9312ee4662ca878bba34cfe6455ab126b680842d1e8769436816f0cfbe6ae2e` for `fitness/basalt.js`, and `30c5162af564e0dd65c9b8055d6397bd1dc4f46c6da91d655369eb462e779353` for `fitness/basalt.css`. Preserve existing changes; take timestamped backups before editing large files.

**Status, 2026-09-30 (later the same day): implemented — see "Status" at the end for what was built, where it departs from this plan, and what was not verified.** The paragraphs above and below are left as written; the hashes above are the baseline the work started from.

## Direction and constraints

**Make the hub feel like one calm instrument.** Use paper or charcoal grounds, ink, a single ochre interface accent, strong type, crisp edges, and a few hard shadows. Colour still identifies warnings, errors and completed work when the meaning warrants it. Every such state also needs a word, value, icon or pattern, in line with [W3C guidance on colour](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color).

**Keep a health log trustworthy.** The selected logging date, active desk clock, running timers, reminders, overdue check-ups, medication status, sync errors and recovery messages must remain explicit. Restyling cannot change what a reading means, which date receives it, or what has been saved.

**Keep delivery local.** The app opens from `file://`, installs as a PWA and is copied into Tauri. Any font or icon asset must be local, licensed, precached and included in the packaged frontend.

## Part A — findings, ranked

### A1 · DESIGN RISK (medium): frequent logging is below the first phone screen

Source: `js/views/dashboard.js:224-300` renders the greeting, date selector, profile prompt, advice and eleven streak tiles before Quick log. At 390 × 844 in a fresh profile, the first screen ends in the streak grid; the Dashboard document measures 3,239px high. The date and core habit state are useful, but the main logging controls are out of sight.

**Fix:** place a compact “Today” summary and the first Quick log actions immediately after date selection. Keep the profile prompt visible as a short entry point that expands to its current explanation. Move the detailed streak grid and recent badges below the frequent actions. Keep due reminders and any backfill, recovery or risk message next to the action they affect. This is a reorder of existing modules, with the current event handlers and stored data retained.

### A2 · DESIGN RISK (medium): Settings requires a long search by scrolling

Source: `js/views/settings.js:87-170` puts Profile, Palette, reminder explanations and device setup ahead of many daily controls. The fresh Settings render has 21 cards and measures 8,814px at 1440 × 900. That length makes a setting hard to find again.

**Fix:** add in-page navigation and clear groups: Daily use, Reminders & devices, Appearance, and Data. Show the current palette with an expandable picker. Use compact section summaries, while keeping permission state, “works only while open” explanations, export and reset wording with their controls. Open the relevant group when a validation message or deep link targets it. Expansion state can stay in memory.

### A3 · DESIGN RISK (medium): the palette uses colour for section identity and status at once

Source: `css/hub.css:124-136` defines thirteen section accents; `js/core.js:898-915` assigns them to navigation and each view. The Dashboard also passes separate blue, aqua and purple accents to its four mini bars at `js/views/dashboard.js:277-283`. The default Gruvbox Health Records accent is red, the same hue family as danger; the rendered Save reading button is red.

**Fix:** give the new paper and charcoal palettes one ochre interface accent across sections. Use labels, icons and position for section identity. Give progress tracks direct values and a shared neutral/ochre treatment. Reserve semantic colours for completion, warning and error, accompanied by text. In the existing Gruvbox palette, move the Health Records section accent away from danger red so ordinary Save no longer reads as an alert. Preserve distinguishable chart series where multiple values must be compared; label them directly.

### A4 · DESIGN RISK (medium): the active desk clock is too quiet on a phone

Source: `css/hub.css:356-359` hides the “At Desk” text at widths up to 640px. `js/app.js:103-118` updates that text and the button title while running, but the 390px top bar shows only a small dot. A phone user cannot rely on hover to learn that a sitting clock is running.

**Fix:** show a compact elapsed-time chip, for example `At desk · 12m`, while running, with an accessible Stop action or a clear route to it. Keep the idle control compact. Check it alongside the top bar, guide button and safe-area inset so no controls overlap.

### A5 · DESIGN RISK (medium): a light theme must reach the separate Fitness token layer

Source: the active stylesheet order in `index.html:26-51` ends with `css/themes.css`. `css/basalt-gruvbox.css` maps BASALT's own `--ink-*`, `--primary-*` and `--text-*` tokens; `css/basalt-makeover.css` sets several of those values as dark literals. Current palette choices in `js/theme.js:25-66` are all dark. Adding a light hub palette without completing this mapping would leave Fitness with dark cards and mismatched text.

**Fix:** define the complete BASALT token ramp for each new palette, remove or override dark literals where necessary, and inspect onboarding, live training, progress charts and the muscle map in both. `js/face.js` and the Android countdown face have a separate two-tone design under `PLAN-android.md`; verify that shared token work does not alter their legibility.

### A6 · COSMETIC (low): the geometry reads softer than the requested style

Source: `css/hub.css:168-171,459-465,498-545` gives cards 16px corners and blurred shadows, controls 10px corners, and pills fully rounded ends. `css/basalt-makeover.css:99-150` sets separate 14px Fitness cards and rounded buttons. Background washes and translucent bars soften the effect further.

**Fix:** define shared geometry tokens: 4px corners for major cards and controls, a 2px outline on main work surfaces, and a 3–4px zero-blur shadow on the primary action or one featured panel. Keep secondary content as flat surfaces with dividers. Make selected navigation rectangular and unmistakable in both themes. Apply these rules in the Fitness skin as well as the hub so it remains one app.

### A7 · COSMETIC (low): small labels make dense screens harder to scan

Source: `css/hub.css:451-474,656-662` uses 11px eyebrows and labels, 11.5px stat subtext and 12.5px notes. The system font resolved predominantly as monospace in this review environment, despite the CSS `system-ui` stack; that appearance is machine-dependent.

**Fix:** use a licensed, locally bundled sans serif for headings, form labels and prose, while keeping monospace for clocks, dates, measurements and the existing Doto countdown. Target 12–13px labels and 14–16px explanatory text. Shorten repeated descriptions where a nearby label already makes the action clear. [Inter](https://rsms.me/inter/) is one suitable open-licensed candidate; check the downloaded font and include its licence before shipping.

### Fitness findings — confirmed in the review capture

#### F1 · BUG (medium): hub navigation covers the workout completion control

Source: `fitness/basalt.css:709` gives `.session-bar` a sticky `bottom:0` and z-index 30; `css/hub.css` fixes the phone navigation above it. During a live session at 390 × 844, Complete session occupied y=759–828 while the hub navigation began at y=782. A hit test at the button centre reached the hub's Daily button. Scrolling to the very end exposed the whole action, so it is intermittently obstructed.

**Fix:** offset the Fitness action bar by the actual hub bottom navigation height and safe-area inset on mobile. Position rest timers and toasts above the action bar when present. Keep Complete session dominant, Discard secondary, and move Print to a labelled overflow action if needed for width. This adjusts stacking and spacing without changing session completion.

#### F2 · BUG (medium): training navigation is usable before onboarding finishes

Source: `bootstrap()` in `fitness/basalt.js:932` sets `#appbar.hidden` and `#app.hidden`; `.appbar { display:flex }` and `css/basalt-gruvbox.css:136`'s `#app { display:block }` override their hidden presentation. In a fresh profile, clicking Today rendered the workout preparation screen and Begin session while onboarding remained open.

**Fix:** enforce `#wh-view-fitness #appbar[hidden]` and `#wh-view-fitness #app[hidden] { display:none }` after the display rules. Keep the hub navigation usable during setup. This restores the existing onboarding boundary; no new onboarding state is required.

#### F3 · BUG (medium): changing a Progress tab loses keyboard focus

Source: `renderProgress()` in `fitness/basalt.js:5571` replaces its entire DOM on each subtab click. Tab to Log and press Enter: the panel changes, but `document.activeElement` becomes `BODY`. The existing `role="tab"` controls also lack the complete tab/panel relationships and arrow-key behaviour.

**Fix:** keep the navigation controls mounted and update the content panel, retaining focus on the selected control. Supply complete desktop tab semantics and keyboard handling; use the labelled phone selector specified below. This is confined to Progress rendering and its existing `progTab` preference.

#### F4 · BUG (medium): Evaluation creates horizontal page overflow

Source: `renderEvaluation()` in `fitness/basalt.js:6426` hardcodes `grid-template-columns:1fr 1.1fr` inline for Live metrics and Bodyweight this phase. At 390px the second card extends to x=504. The desktop column rule survives the small-screen layout.

**Fix:** replace the inline declaration with a scoped responsive class: two `minmax(0, …)` columns on desktop, one on phone, with wrapping card headings and shrinkable children. Retain all scores and chart data. Hiding page overflow would conceal information.

#### F5 · DESIGN RISK (medium): eight sections disappear into a scrolling strip

Source: `SECTIONS` and `buildNav()` in `fitness/basalt.js:65,516`, plus the Muscles insertion in `fitness/muscles.js:819`, create eight destinations. `fitness/basalt.css:260` hides the horizontal scrollbar. On phone, 918px of navigation sits in 332px; only Dashboard and Today are fully visible initially. Training setup also loses its text below 600px. Clicking Dashboard's View progress shortcut, or reloading the remembered Progress section, leaves the selected navigation item outside the visible strip.

**Fix:** use a labelled section picker on compact layouts, with a visible Workout/Resume shortcut. Keep all eight destinations and Training setup discoverable in its expanded list. On desktop, show all destinations directly when they fit. Renaming Dashboard to Overview, Today to Workout and Evaluation to Phase review makes their jobs clearer while preserving route IDs.

#### F6 · DESIGN RISK (medium): Progress navigation is below four large statistic cards

Source: `renderProgress()` renders four summary tiles before its five subviews. At 390 × 844, the subview strip starts at y=766, just above the bottom navigation at y=782. Reaching Session history or Measurements therefore starts with scrolling past unrelated summaries.

**Fix:** put the subview control immediately after the Progress heading. Show summary metrics within its Overview subview, using a compact two-column arrangement on phone. All other subviews start with their own content.

## Part B — design specification

### Palettes and tokens

Use `paper-ochre` and `charcoal-ochre` as explicit choices in `js/theme.js`, with full selectors in `css/themes.css`; review and complete the additions now present. Keep existing saved palette IDs and the current default; a person chooses the new look from Settings. A new mode toggle or automatic day/night switching would add a separate preference and is outside this pass.

| Role | Paper | Charcoal |
|---|---|---|
| Page ground | `#F4F1E8` | `#191919` |
| Main surface | `#FCFAF4` | `#242423` |
| Main text | `#20201E` | `#F4F1E8` |
| Interface accent | `#D7B95E` | `#D7B95E` |
| Text on filled accent | `#20201E` | `#20201E` |
| Visible control outline | `#837D70` | `#A29F95` |

Calculated pairs: ink on ochre 8.54:1; ink on paper 14.45:1; paper on charcoal 15.57:1; the proposed light outline on off-white 3.92:1; the dark outline on raised charcoal 5.87:1. These are token-pair calculations, not a whole-screen audit. Ochre on off-white is only 1.83:1, so small text on light surfaces must use ink or another verified text colour. Check actual component combinations against [text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast) before accepting them.

Define separate tokens for main outlines, quiet dividers, accent text, filled-action text, hard shadow and semantic states. Preserve warning and danger as distinct states that appear only where meaningful. For charts and maps, show units and values directly; use more than one hue only when several data series need to be distinguished.

### View composition

| Surface | Proposed arrangement |
|---|---|
| Dashboard | Date and any backfill warning; compact perfect-day/streak summary; one tap Quick log; due reminder and active timers; detailed streaks; recent badges and tip. |
| Navigation | One neutral shell, with a rectangular active item and a small ochre mark. The mobile top bar shows the active desk clock in words and elapsed time. |
| Health Records | Keep the form beside latest values on desktop and stacked on phone. Use neutral/ochre for Save; reserve red for actual danger. Keep units, dates and source beside readings; keep overdue check-up explanations beside those statuses. |
| Fitness | Match the hub's borders and type; add the responsive section navigation below, compact Progress controls and unobstructed workout actions. Preserve training logic and saved route IDs. |
| Insights and Achievements | Give the headline figure or nearest milestone the strongest outline. Group supporting figures with dividers; label chart series and badge progress in text. |
| Settings | Compact overview and section links; current palette shown before its expandable gallery; practical controls and data actions reached by section links. |

### Interaction details

Primary actions use filled ochre, ink text, a 2px outline and a 3–4px hard shadow. Pressing the button shifts it into that shadow without moving neighbouring content. Secondary buttons are flat and neutral. Hover, focus, disabled and pressed states each have a distinct treatment. Respect reduced motion and retain the existing keyboard navigation. Aim for at least 44 × 44px on important phone controls; [W3C's enhanced target guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced) describes this as an enhanced target, not the minimum criterion.

### Fitness navigation

**Make the active section and the route back to training visible.** Fitness is opened before, during and after a workout. Navigation must preserve the unfinished session, entered sets, notes and running rest timer. Existing workout-note persistence passed the review; preserve it. The new shell uses the same paper/charcoal, ink and ochre tokens, with outlined rectangular controls and a filled active state.

| Existing route ID | Display label | Purpose / picker group |
|---|---|---|
| `dashboard` | Overview | Summary and next action / Start |
| `today` | Workout | Prepare or resume the current session / Train |
| `running` | Running | Run plan and logging / Train |
| `skills` | Skills & mobility | Practice and movement library / Train |
| `program` | Program | Training rotation and progression targets / Plan |
| `muscles` | Muscles | Muscle map and exercise reference / Plan |
| `progress` | Progress | Trends, calendar and session history / Review |
| `evaluation` | Phase review | Current phase score and report cards / Review |

**Keep one registry for destinations.** Extend the existing live `App.SECTIONS` metadata with labels/grouping as needed. Generate both layouts from it, including the Muscles entry registered by `fitness/muscles.js`. Preserve `App.showSection()`, `ironframe.ui.section`, `progTab`, `today.workout` and existing `data-go` links. Change visible labels and relevant help text together; never rename stored route IDs. Training setup remains a separate labelled action opening the existing dialog.

**Desktop: expose the full set when space permits.** Show Overview, Workout, Program and Progress first, followed by Running, Skills & mobility, Muscles and Phase review. Keep Training setup labelled. Permit a deliberate second row at intermediate widths; switch to the compact picker before labels clip or horizontal scrolling becomes necessary. Use available content width when choosing the breakpoint, including the hub sidebar and 200% zoom. The 1440px and 1920px layouts must keep content centred beside the sidebar.

**Phone: replace the scrolling strip with a section picker and workout shortcut.** Use a small visible “Fitness sections” label above a control displaying the selected name, such as `Progress ▾`. Beside it, show `Workout`, changing to `Resume` while a session is active. Workout opens preparation; it does not start a session. Opening the picker reveals every destination under the groups above, plus Training setup at the end. Each destination has a minimum 44px tap height, a text label and a visible current marker. The expanded panel fits between the top and bottom hub chrome and scrolls vertically if necessary. This keeps Running and Phase review within two taps from any Fitness section.

```text
Fitness sections
[ Progress                  v ] [ Resume ]

Progress
Progress view
[ Session history                       v ]

Session history content…
```

**Use a disclosure with ordinary navigation controls.** The section toggle has `aria-expanded` and `aria-controls`; collapsed items leave the tab order. Tab reaches its controls in order; Escape closes the picker and restores toggle focus; choosing a destination closes it and focuses the destination heading. Its selected item uses `aria-current="page"`. Follow the [W3C disclosure navigation pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/), without adding menu-widget semantics. Handle Escape locally so dismissing this picker does not also stop the rest timer.

**Keep navigation state coherent across entry points.** A section click, Overview shortcut, Program link and saved-section restore all update the same active indicator and picker label. Selecting the current destination should close the picker without rebuilding the form. On deliberate section changes, place the heading below the sticky bars using scroll margins; obey reduced motion. Startup and background refresh must not steal focus. Keep the current remembered-section behaviour when returning from another hub tab. Resume opens the existing workout draft; it never generates a replacement workout.

### Fitness content hierarchy

| Surface | Change |
|---|---|
| Overview | Keep next workout/Resume as the primary action. Consolidate duplicate first-session CTAs; put onboarding tips in a short expandable block. Follow with compact week/phase figures and existing quick logs. |
| Workout | Keep session type, intensity and length together before Begin session. In an active workout, prioritise sets and rest time; retain access to cues, swaps and notes. Use the unobstructed action bar from F1, with enough page padding to reveal final content. |
| Program | Lead with current phase, training rotation and targets. Use explicit links to Phase review and Progress; preserve advancement and deload confirmations. |
| Progress | Place its subview control before statistics. Desktop uses five proper tabs; phone uses a native select labelled “Progress view”. Both share `progTab`; the hidden layout contributes no focusable controls. |
| Running / Skills / Muscles | Keep their existing content and actions, with direct access from the picker. Apply shared type and surface tokens; preserve map labels, exercise details and running-plan controls. |
| Phase review | Lead with phase day and report preview; stack metrics and bodyweight on phone. Keep manual phase changes distinct from the ordinary review action. |

**Name Progress subviews by their contents.** Keep IDs `overview`, `ladders`, `calendar`, `log`, `body`; display Overview, Strength levels, Calendar, Session history, and Measurements & sleep. On desktop, implement one tab stop, arrow-key movement, Enter/Space activation and explicit tab/panel associations, following the [W3C tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). Updating a panel must preserve focus. On phone, retain focus on the select after changing it. Put the four summary metrics in Overview, before its charts.

**Keep the changes local to Fitness.** Navigation markup belongs in `index.html`; destination metadata, routing UI and Progress rendering in `fitness/basalt.js`; Muscles registration in `fitness/muscles.js`; responsive layout and hidden-state fixes in the Fitness integration styles. Extend the existing `css/neobrutal.css` for ochre-specific appearance. Behavioural fixes must work in all palettes. Scope selectors to Fitness so the hub navigation, exercise phase controls and other segmented buttons are unaffected.

## Part C — implementation order

1. **Capture and protect the baseline.** Record the current dirty working tree, reconcile the ochre work already present, and back up the large files before editing. Run the same isolated-browser capture with a fresh profile and a synthetic populated profile. Include 360, 390, 412, 768, 1024, 1440 and 1920px widths; keep screenshots out of the project.
2. **Complete the two palettes.** Review the existing `css/themes.css` and `js/theme.js` additions; cover RGB triplets, raised surfaces, `--ink-*`, BASALT primaries, category aliases and theme previews. Verify first paint, saved-choice reload, PWA theme colour and chart repaint without touching stored health data.
3. **Complete geometry and type.** Extend the existing `css/neobrutal.css` for ochre-specific cards, buttons, fields, chips, navigation and focus. Use `css/hub.css` and the Fitness integration styles for shared layout and interaction fixes. Verify the bundled Inter file and licence. Review existing five palettes for regressions.
4. **Recompose Dashboard.** Move Quick log into the first phone screen; compact the hero, setup prompt and streak summary; keep all present logging handlers and warnings. Make the desk clock's running state readable in the mobile chrome.
5. **Organise Settings.** Add in-page section links and the expandable palette picker. Preserve all controls, status copy and current storage behaviour. Verify links, expansion and focus after a render refresh.
6. **Rework Fitness navigation.** First fix hidden onboarding, action-bar overlap and Evaluation overflow (F1, F2, F4). Then build both navigation layouts from the live registry, update labels and route/focus behaviour, and move Progress navigation ahead of summaries with the F3 keyboard fix. Apply the Fitness content hierarchy. Verify each slice against the checks below before continuing.
7. **Finish the remaining views.** Check Health Records, Insights, Achievements and representative daily-care forms for light/dark surfaces, readable values, contextual semantic colours and balanced desktop width. Change view-specific CSS only where shared tokens cannot express the intended hierarchy.
8. **Ship the static assets.** Update `service-worker.js`'s cache version and precache any new font or icon. Confirm `src-tauri/copy-assets.sh` includes them, then update README palette counts and screenshots if those are part of release documentation.

## Acceptance checks

| Area | Required result |
|---|---|
| Phone Dashboard | At 390 × 844 and 412 × 915, date context and at least one usable Quick log action appear above the bottom navigation in ordinary fresh and populated states. At 360 × 800, no document-level horizontal overflow. |
| Active state | A running desk clock is visible by text and elapsed time on phone and desktop; stopping it clears the indicator. Active timers, reminders and backfill remain obvious. |
| Logging | The selected past date remains visible; one tap logging writes to that date; edit, delete and undo still affect the intended record. |
| Health Records | Normal Save does not look like danger. Overdue checks, medication status and sync errors retain distinct labels and visible states. Reading values keep their units and dates. |
| Settings | Section links reach every existing control; palette selection persists; expansion and validation do not lose focus or hide a message. |
| Fitness setup | Fresh profiles show setup with the training shell hidden and unfocusable. Completing setup reveals all eight destinations. Hub navigation remains usable throughout. |
| Fitness navigation | Every destination and Training setup is reachable at all seven test widths, with no clipped labels or invisible overflow. On phone, every section takes at most two taps. CTA navigation and remembered-section reload show the correct active name. |
| Fitness keyboard | Picker opens/closes predictably; Escape returns focus without stopping a rest timer. Section selection focuses its heading. Progress keyboard activation retains focus; hidden responsive controls are absent from the tab order. Check at 200% zoom. |
| Workout continuity | Enter sets and notes, start a rest timer, visit Program and Progress, leave for the hub and return via Resume. Values and timer remain correct; no duplicate workout is created. Reload preserves the existing draft according to current storage behaviour. Use a disposable profile. |
| Workout actions | At 360, 390 and 412px, Complete session and Discard remain visible and tappable while scrolling. Their centre hit tests reach the intended controls. Check rest timer, toast, safe-area inset and soft keyboard together; final fields remain reachable. |
| Fitness content | Progress's selector appears before all metrics and is usable above the bottom navigation at 390 × 844. Phase review stays within the viewport. Check empty and populated session history, measurements, charts and report cards in both ochre themes. |
| Themes | Paper, charcoal and all five existing palettes render Dashboard, Fitness, Health Records, Insights and Settings without unreadable text or page errors. Check measured text/control contrast on the actual surfaces. |
| Data display | Chart series, muscle map levels, progress values and badge states remain distinguishable without relying on hue alone. |
| Keyboard and touch | Focus stays visible; selected nav is announced; controls meet target sizing or spacing on phone; reduced motion preserves state changes. |
| Delivery | `file://` works without network; PWA starts offline after install; the new font is cached and present in the Tauri asset copy; the Android face remains legible in both system modes. |

A browser capture alone does not establish Android overlay and alarm behaviour. Check the packaged app on a phone before claiming that part complete.

## Out of scope

This pass does not change health data schemas, unit conversion, date boundaries, reminder scheduling, sync merge rules, training progression, badge thresholds or the Android countdown face's behaviour. It adds no account, CDN, framework or build step. Any discovered data-shape change needs its own migration plan.

Implementation and release are separate from this document.

## Status — 2026-09-30

**Part A (A1–A7), Part B, the Fitness findings F1–F6, the Fitness navigation and Part C steps 1–8 are built.** Backups are `*.backup-20260930-014537.*` (hub, palettes) and `*.backup-20260930-023023.*` (Fitness, its styles, the shell) beside each edited file. Nothing is committed. `fitness/basalt.css` is byte-identical to the baseline hash; `fitness/basalt.js` and `fitness/muscles.js` changed (new hashes: `eef8e723…f39f`, `15294db8…902e`).

| Item | Built | Departs from the plan |
|---|---|---|
| A1 Dashboard | Order is date → hero → setup prompt (one row, explanation folded) → **Quick log** → suggestions and advice → next reminder / today / timers → streaks → badges → tip. Handlers untouched. | Quick log's first tile moved from y≈2,386 to y≈481 fresh and y≈334 seeded at 390 × 844; the same at 360 × 800 and 412 × 915. |
| A2 Settings | Four groups as native `<details>`, a row of section links, the palette folded behind the current choice. Same 21 card titles and control ids as before (checked by script). | **Groups are open by default**, so unfolded the page is 9,013px against 8,814px — 199px *taller*. A folded group would hide Android exact-alarm and sync state; the group summary carries notification state and a storage-not-protected warning. The guided tour unfolds Data itself. |
| A3 Colour | Health's Gruvbox accent is `#6caae5`, not danger red; Dashboard bars share one treatment; the Ochre pair uses one accent. | The trophy case's *Medication* label also moves from red to blue: it reads the Health accent. |
| A4 Desk clock | `At desk · 12m` in the ochre fill on a phone while running. | The pre-change copy measured the label at width 0. |
| A5 Fitness tokens | BASALT `--ink-*`, `--primary*`, `--r-*`, `--fs-*`, `--font-*` set inside both palette blocks. | `--primary` is the accent as *text*; the ochre fill has its own token, because ochre on paper is 1.83:1. |
| A6 Geometry | 4px corners, 2px ink outline, one hard shadow on the primary button and one featured panel. | **Scoped, not global:** new `css/neobrutal.css`, every rule keyed to `html[data-theme$="-ochre"]`, instead of editing the `hub.css` / `basalt-makeover.css` primitives. 36 of 55 captures of the five original palettes are pixel-identical; the rest are the intended changes plus chart-animation timing. State (overdue, done, warn, running) is a border round the whole element in the state's colour beside its word or icon, not a coloured stripe down one edge. |
| A7 Type | Inter latin subset (48 KB, OFL) in `vendor/inter/`; 12px floor. | Only the Ochre palettes use it. |
| F1 Action bar | The bar sticks above the phone navigation; rest timer and both toast hosts lift by 92px while it is on screen; the bar rests in one place at every scroll position. | Print is an icon button, not a third of the bar. `:has()` drives the lift, so without it the timer and toasts stay where they were. |
| F2 Setup boundary | `#appbar[hidden]` and `#app[hidden]` are `display:none` again. | — |
| F3 / F6 Progress | Control directly under the heading; the four figures live in *Overview*, two-up on a phone; five real tabs (roving tabindex, arrows, Home/End) above 560px, a native *Progress view* select below; the panel is swapped, the control stays mounted. | Subviews renamed *Strength levels*, *Session history*, *Measurements & sleep*; ids unchanged. |
| F4 Phase review | Inline `grid-template-columns` replaced by a class, one column below 1000px. Heading, manual phase controls after the metrics. | Heading is *Phase review*; the manual controls moved below the plateau flags so the ordinary review comes first. |
| F5 Navigation | One registry (`App.SECTIONS`: label, group, rank, blurb) feeds both layouts; container query on the app bar at 719px; disclosure picker with *Workout*/*Resume*; Escape handled locally; heading focus only on a deliberate change. | The rest timer's Space shortcut no longer fires when a button, select, link, summary or tab has focus — outside the plan, needed so Space can operate the picker and tabs while a timer runs. |
| Content hierarchy | Overview: day-one tips folded, duplicate *Start your first session* removed. Labels and help text renamed together. | **Not done:** the active workout still lists warm-up before the main sets. Putting sets first means deciding whether warm-up folds by default, which changes how a session is done. Program already led with phase, rotation and targets; only its links were renamed. |
| Delivery | Service worker `v38` precaches both new files; Tauri asset copy verified with the script's own commands; README updated. | Offline start over http and `file://` with the network cut both load Inter and the chosen palette. |

**Measured:** text contrast on every visible text element of the 11 hub views (1440 and 390 px) and every Fitness section, all four Progress subviews and the open picker (1440 and 390 px) — 0 below threshold in either Ochre palette after fixes (163 and 168 at 1440 px before, then 91 more found on the skill ladders, nearly all from `opacity`); 247 outlined controls per palette at 3:1 or better; a 3px focus ring on the first nine Tab stops; 44px phone targets; the countdown face's computed background, ink and clock font identical under Gruvbox, Paper and Charcoal in both OS colour schemes. Fitness: F1–F4 reproduced on the pre-change copy (flex/block, 504px, hit test reaching the *Daily* tab, focus on `<body>`) and gone on the current tree; both layouts at 360, 390, 412, 768, 1024, 1440 and 1920 px; two taps to Running and Phase review; Escape returns focus and leaves a running rest timer alone; Resume reopens the same draft (its `startedISO` unchanged) with sets, notes and the timer intact after Program → Progress → hub → back.

**Not verified:** any physical Android device (overlay, alarm, the face on a real always-on display, the soft keyboard against the action bar); 200% browser zoom itself (768px is the nearest tested width); text inside SVGs and over gradients (2 elements on Phase review); hover and pressed states beyond the pressed-shadow shift; Fitness with months of history, running plans, or phase advancement; populated hub data beyond a synthetic seed of 24 days, 12 vitals and 9 sessions; sync. No data shape changed, so there is no migration to test. At 1440px on this machine the five original palettes still wrap *Training setup* to a second row (the system font resolves to a monospace face here); the Ochre palettes fit one row.
