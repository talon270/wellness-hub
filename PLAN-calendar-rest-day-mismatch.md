# Calendar / start-area mismatch — plan

Written 2026-08-27, against `fitness/basalt.js` as of the current on-disk state
(no prior git history for this file beyond the initial import — checked with
`git log --oneline -- fitness/basalt.js`, two commits, neither touching this
logic).

Method: traced every function that decides "what type of day is today" by
grepping `restDayInfo`, `projectUpcoming`, `recommendedDayType`, `ROTATION`,
`trainDows`, and read each in full. Confirmed against you directly: today is
off the old Mon/Tue/Thu/Fri cadence, the app's actual rule is "recalculates
based on missed days and the last session," and the start area's rest day is
because you trained yesterday — which matches `restDayInfo`'s rule exactly.

**Nothing below is implemented — this is the plan.**

## Part A — findings, ranked

### A1 · BUG (high): the calendar runs on a fixed weekday cadence that no longer exists

`projectUpcoming` (`fitness/basalt.js:4964`) hardcodes
`var trainDows = [1, 2, 4, 5]` — Mon/Tue/Thu/Fri — and walks forward
incrementing the Push→Pull→Legs→Full rotation on every calendar day that
matches one of those weekdays, independent of when you actually trained.

The start area uses a different, correct rule:
`engine.restDayInfo` (`fitness/basalt.js:2343`) marks *only the single day
immediately after your last completed session* as rest — "gap 2+: clear to
train, a longer break is your call, not a debt" — and
`engine.recommendedDayType` (`fitness/basalt.js:1940`) picks the next rotation
type from your last completed session's type, with no weekday check at all.

**Concrete failure:** you trained yesterday. `restDayInfo` correctly marks
today as the mandatory rest day, so the start area shows "rest day, full body
tomorrow." But if today happens to also be one of the four fixed weekdays,
`projectUpcoming` ignores the rest gate entirely, advances the rotation index,
and paints today on the calendar as a full-body training day. The two screens
now disagree about both which day is next and what type it is, and they will
keep disagreeing on any week where your actual training days drift off
Mon/Tue/Thu/Fri — which, per your answer, is now the normal case, not an edge
case.

**Fix:** replace `projectUpcoming`'s fixed-weekday walk with the same rule
`restDayInfo` and `recommendedDayType` already use: the next session is the
first day at or after today that isn't the mandatory rest day, typed from
`recommendedDayType()`. One rule, three call sites, instead of two rules that
silently drift apart. Since a rule this loose ("your call" past the one
mandatory rest day) can't honestly predict a *second* future session, the
function stops returning a projected list and returns just the one date it can
actually stand behind — matching what you confirmed you want to see (below).

### A2 · DESIGN RISK (medium): two call sites present a false multi-day forecast

`upcomingDaysCard` (`fitness/basalt.js:5033`) shows 6 "upcoming sessions" and
`buildCalendar`'s planned overlay (`fitness/basalt.js:5077`) paints 12 days
forward — both built by extending the same broken fixed-cadence walk. Even
after A1's fix, projecting *multiple* future days is unfounded: past the one
mandatory rest day, the app cannot know which day you'll actually train next,
by design.

You confirmed: **only show the next session** — days beyond that should read
as open/unscheduled, not guessed.

**Fix:**
- `upcomingDaysCard`: render only the single next-session row (date + type),
  drop the "Projected from your rotation" copy that implies a multi-day
  forecast, and drop the now-meaningless `count` parameter.
- `buildCalendar`: the `planned` overlay marks only the one next-session date,
  not a run of future days. Every other future day on the calendar renders as
  plain/unscheduled.
- `nextSessionBanner`: unaffected in shape (already only ever showed entry
  `[0]`), just now backed by the corrected single-projection function.

## Part B — the build

1. Add `engine.nextSession(s)` (or a module-local equivalent next to
   `restDayInfo`) that returns `{ dateISO, key, type, isToday }` for the one
   date the app can actually stand behind:
   - No completed sessions → today, `ROTATION[0]`.
   - Trained today already → today + 2 (skip the mandatory rest day after
     today).
   - `restDayInfo(s).isRest` → `restDayInfo(s).nextKey` (today + 1).
   - Otherwise (gap ≥ 2, clear to train) → today.
   - Type in every case from `engine.recommendedDayType()`.
2. Replace `projectUpcoming`'s body with a call to that single-date function;
   keep its signature returning an array so the three call sites need minimal
   changes, but it now always returns 0 or 1 entries.
3. Update `upcomingDaysCard` to render one row and reworded copy ("Your next
   session" instead of "Upcoming sessions" / "Projected from your rotation").
4. Update `buildCalendar`'s `planned` map to only ever contain the single
   `nextKey`, not a 12-day spread.
5. Delete the now-dead `trainDows` constant and the stale comment above
   `projectUpcoming` describing the Mon/Tue/Thu/Fri cadence.

## Part C — verification

- Seed `localStorage` with a completed session dated yesterday, load the app,
  confirm: start area shows rest day + tomorrow's type; calendar shows no
  training type painted on today, and only tomorrow marked as the next
  session, matching type.
- Seed with a completed session 3+ days ago (gap ≥ 2), confirm both start area
  and calendar agree today is trainable, same type.
- Empty state (no sessions ever) — confirm both agree on `ROTATION[0]`, today.
- Both themes; the calendar month view specifically, since its color classes
  depend on `plannedType`.

## Out of scope

- Changing `restDayInfo` or `recommendedDayType` themselves — both are already
  correct per your confirmation.
- The running-plan overlay (`runPlanned`/`runDone` in `buildCalendar`) — separate
  system, not implicated in this mismatch.
- Any change to how the mandatory rest day itself is calculated (single fixed
  day vs. a spacing target) — you already confirmed this is intentional.
