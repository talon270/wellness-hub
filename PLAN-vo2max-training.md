# VO2 max training — plan

Written 2026-08-23, against `Helth/` at commit `a3aaf97` plus the uncommitted
VO2 max *tracking* work from earlier today.

Method: read `fitness/basalt.js`'s running module (lines ~6409–7251) in full —
its goal definitions, plan generators, session shape and interval timer — plus
the `vo2max` pill added to `js/views/health.js` this morning. No new subsystem
is proposed; this is mostly an application of machinery that already exists.

**Nothing below is implemented — this is the plan.**

## What went wrong the first time

You asked for "a feature for working on VO2 max". I built a way to *measure*
it: a Cooper calculator, a log, reference bands. That answers "what is my VO2
max", not "how do I raise it". The tracking is still worth having — it's how
you find out whether the training worked — but it was never the ask, and it
shipped as if it were the whole feature.

## Part 0 — shape

1. **Who opens this and when?** Three times a week, on a run day, phone in
   hand, often mid-session with a heart rate climbing. So: the plan must say
   what today's session is without navigation, and the interval player has to
   be readable at a glance while breathing hard.
2. **What must it never get wrong?** It must never push you into 90–95% efforts
   before there's a base under them, and it must never imply the gain is
   guaranteed. Hard intervals on no base is how people get hurt or quit.
   The guard: the plan opens with base weeks, caps hard sessions at two a week,
   and never schedules them back-to-back.
3. **Honest confidence of the central number.** This is the crux, and it's
   where most training apps lie. Individual response to identical VO2 max
   training varies enormously — in the HERITAGE Family Study, 20 weeks of the
   same prescription produced gains ranging from roughly **zero to over 40%**,
   and a meaningful minority are near-non-responders. So the app must never
   print "+15% in 8 weeks". It says: most people gain something, the spread is
   very wide, roughly 5% gain little or nothing, and **your own re-test is the
   only number that applies to you.** That framing is the feature, not a
   disclaimer bolted on the end.
4. **What if the data source dies?** N/A — everything is local.

## Part A — the training content

Four protocols, each with a stated reason it's in the plan. This is the only
genuinely new material; everything else is plumbing that exists.

| Session | Structure | Why it's here |
|---|---|---|
| **Norwegian 4×4** | 4 min hard / 3 min easy × 4, after a 10 min warm-up | The most-studied VO2 max protocol there is. Helgerud et al. (2007) measured about a **7% VO2 max gain over 8 weeks**, beating matched-volume continuous running. This is the plan's engine. |
| **30/30** | 30s hard / 30s easy × 12–20 | Billat's protocol. Accumulates time near VO2 max with far less suffering per rep than 4×4, which makes it the honest *entry* to interval work rather than a lesser version of it. |
| **Threshold / tempo** | 20 min comfortably hard | Raises the fraction of VO2 max you can actually hold. Supports the ceiling; doesn't raise it much on its own. |
| **Zone 2 base** | 45–70 min conversational | The unglamorous 80%. Stroke volume and mitochondrial density are built here, and they're what let the hard sessions be hard enough to matter. A plan that is all intervals stops working by week four. |

**Effort prescription.** By feel first — "hard enough that a sentence is
broken into two or three pieces" — with heart rate as an optional overlay.
If HR is used, HRmax is estimated with **Tanaka (208 − 0.7 × age)** rather
than 220 − age, and the estimate is labelled: individual HRmax scatters about
±10 bpm around any formula, so a zone derived from it is a guide, not a target
to chase. Age comes from the DOB already on the Profile pill.

## Part B — where it lives

**A fourth entry in `GOALS` in `fitness/basalt.js`.** The running module
already provides everything else:

| Need | Already exists |
|---|---|
| Week-by-week progressive plan | `build` fn per goal, returns weeks of sessions |
| Session shape | `{ kind, title, sub, distanceKm, durationSec, intervals[] }` |
| Interval player | `App.startTimer`, driven by `intervals[]` |
| Scheduling around the lifting rotation | runs land Wed/Sat/Sun, avoiding Push/Pull/Legs/Full |
| Logging, streak, calendar | `runLog`, `streak`, Progress calendar |

New code is: one `planVo2max()` generator, two session helpers (`fourByFour`,
`thirtyThirty`), and the goal's copy. That's it.

**Plus a bridge from where you actually looked for it.** The VO2 Max pill in
Health Records gets a card that: links straight into the plan, shows which
week you're on, and — once a plan is running — says when a re-test is due
(8–12 weeks, since that's the window where a real change is detectable above
day-to-day noise). Measurement and training reference each other instead of
sitting in separate tabs pretending the other doesn't exist.

## Part C — the plan shape, 8 weeks

Opens with base, earns the intervals, deloads every fourth week.

| Week | Wed | Sat | Sun |
|---|---|---|---|
| 1–2 | Easy 25–30 min | Zone 2 long, 40–50 min | Easy 25 min |
| 3 | 30/30 × 12 | Zone 2 long 50 min | Easy 25 min |
| 4 *(deload)* | Easy + strides | Zone 2 45 min | Rest |
| 5 | 4×4 | Zone 2 long 55 min | Easy 30 min |
| 6 | 30/30 × 16 | Tempo 20 min | Easy 30 min |
| 7 | 4×4 | Zone 2 long 60 min | Easy 30 min |
| 8 *(test)* | Easy + strides | **Cooper test** → logs to the VO2 Max pill | Rest |

Week 8's test writes straight into the tracking feature built this morning,
with `source: "field"` — which is the whole reason that field exists.

## Out of scope

- **Non-running modalities.** Rowing, cycling and burpee/circuit versions of
  4×4 all work, and BASALT is a calisthenics app, so this is a real gap — but
  the existing plan generator, distance estimates and run log all assume
  running. Doing it properly means a modality concept threaded through that
  module. Flagged as the obvious next step, deliberately not started here.
- **Heart-rate zones as a hard gate.** No chest-strap integration, no live HR.
  HR is an optional overlay on a feel-based prescription.
- **Changing the existing three goals.** `base`, `stamina` and `sprint` are
  untouched.
- **Any change to the tracking feature's data model.** `logs.vo2max` stays as
  it is; the bridge only reads it.
