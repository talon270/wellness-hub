#!/usr/bin/env python3
"""
WELLNESS HUB · WORKOUT REGRESSION HARNESS
  · S1-S5b   the training day: which day a finished workout belongs to
  · S8-S9    data safety: an unreadable or newer-than-the-build BASALT save
  · S12-S21  the training fixes still in force: flags, rep ratio, attendance,
             unrated effort, set count
  · T11-T12  schema v4: a v3 save and a v3 mid-workout draft across the upgrade
  · T14-T18  Stage 2 wiring: equipment, pain swaps to real ids, legacy history,
             preview = workout, points off
  · T19-T21  Stage 2 screens: the Workout card and its Step up, the upgrade
             card, the row offer
  · T22-T24  R2's findings: the no-bar row, a load never set, the end of a path
  · T25-T26  R1's findings: the streak after a merge, edits stamped for sync
  · P1-P3    Stage 3 templates: attendance, the Upper/Lower rest rule, a
             template switch closing the period
  · P5-P6    Stage 3 goals and volume modes: ranges by goal, "max" as +1 set
  · P4, P4b-P4d  Stage 3 step 3.2: the recovery block, when it is offered, and
             the three-section phase report
  · P7-P9    Stage 3 step 3.3: a missed run week asks, a hard run on a squat or
             hinge day is noted on both cards, and the Muscles targets follow
             the template (plus tools/check-muscle-map.js for every template)
  · T27-T31  R3's findings: the streak at two sessions a week, a recovery block
             across a period close, the rest day after a template switch, the
             step while backfilling inside a block, the Settings copy

Retired in step 2.4 (W8), because Stage 2 removed what they measured; each
reason is in plans/PROGRESS-workout-progression.md:
  · S10, S11  points: progression no longer pays points (T18 covers "off")
  · S13, S14  benchmark placement: the assessment replaced it (C4)
  · S15, S16  _adaptTarget: deleted, prescriptions are ranges (C1)
  · S18       deload targets: applyAdvancement writes no targets (T18)

Retired in step 3.2 (W11):
  · S17       the report's rep ratio: the report no longer reads tier targets
              (plan D5), so there is no ratio to measure. P4d covers the report

Plans/PLAN-workout-progression.md, Part E. S6-S7 and T13 (the sync merge) run
in Node: tools/check-syncmerge.js. T11-T12 seed from tools/fixtures/
v3-midworkout.json, which the Stage 1 build wrote.

Run it from anywhere:   python3 tools/check-workout.py [--only S1,S5]
                        HELTH_INDEX=/path/to/other/index.html python3 tools/check-workout.py
Output, one line per case:   S<n> PASS|FAIL|ERROR  <title> -- <measured>
Exit code:   0 all pass · 1 at least one FAIL · 2 at least one ERROR

**A FAIL means the app misbehaved; an ERROR means the harness could not run
the case.** Before a fix lands, every case must FAIL with the numbers in the
plan's "Before" column. An ERROR is never evidence of a bug — it is a defect
in this file, and it exits 2 so it cannot be mistaken for one.

Method: a fresh browser context per case, timezone Asia/Kolkata, the network
aborted, the service worker blocked. Onboarding and every workout are driven
with real clicks. page.evaluate is used only to seed fixtures (settings, past
sessions, tier levels) and to call an engine function the plan names directly.
"""
from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
# HELTH_INDEX points the run at another copy of the app — how a harness case is
# proven able to pass, by running it against a scratch tree with one fix applied.
INDEX_URL = pathlib.Path(os.environ.get("HELTH_INDEX") or ROOT / "index.html").resolve().as_uri()
TZ = "Asia/Kolkata"
VIEWPORT = {"width": 1440, "height": 950}
STORAGE_KEY = "ironframe.state.v1"
UNREADABLE_KEY = re.compile(r"^ironframe\.state\.v1\.unreadable-\d{8}-\d{6}$")

# The wizard's assessment answers, slot -> exercise id. Empty is "Not sure"
# everywhere: every slot starts at its first movement.
NOT_SURE: dict = {}


# ---------------------------------------------------------------------------
# Browser plumbing
# ---------------------------------------------------------------------------
def ist(y, mo, d, h=0, mi=0) -> datetime:
    """A wall-clock time in Asia/Kolkata. Playwright reads a bare number as
    seconds, not milliseconds, so the clock is always given a datetime."""
    return datetime(y, mo, d, h, mi, tzinfo=ZoneInfo(TZ))


class Session:
    """One fresh browser context, with the page errors it has collected."""

    def __init__(self, pw, now=None, seed=None):
        self.browser = pw.chromium.launch()
        self.ctx = self.browser.new_context(
            viewport=VIEWPORT, timezone_id=TZ, locale="en-IN", service_workers="block")
        self.ctx.route("http://**/*", lambda r: r.abort())
        self.ctx.route("https://**/*", lambda r: r.abort())
        self.pg = self.ctx.new_page()
        self.errors: list[str] = []
        self.pg.on("pageerror", lambda e: self.errors.append("PAGEERROR: " + str(e)))
        if now is not None:
            self.pg.clock.install(time=now)
        if seed is not None:
            # Seeded once per tab: sessionStorage survives a reload, so the
            # app's own writes are not overwritten on the second navigation.
            self.pg.add_init_script(
                "if(!sessionStorage.getItem('__seeded')){"
                "localStorage.setItem(%s,%s);sessionStorage.setItem('__seeded','1');}"
                % (json.dumps(STORAGE_KEY), json.dumps(seed)))
        self.pg.goto(INDEX_URL)
        self.pg.wait_for_timeout(700)

    def close(self):
        self.browser.close()

    def ev(self, js, arg=None):
        return self.pg.evaluate(js, arg) if arg is not None else self.pg.evaluate(js)

    def state(self):
        return self.ev("() => JSON.parse(JSON.stringify(App.getState()))")

    def raw(self):
        return self.ev("k => localStorage.getItem(k)", STORAGE_KEY)

    def set_time(self, when):
        self.pg.clock.set_system_time(when)


def set_stepper(s: Session, stepper_id: str, value):
    inp = s.pg.locator('[data-stepper="%s"] input' % stepper_id).first
    inp.fill(str(value))
    inp.press("Tab")  # the stepper commits on `change`, which fires on blur


def to_fitness(s: Session):
    explore = s.pg.get_by_role("button", name="Explore first")
    if explore.count():
        explore.click()
    s.pg.get_by_role("button", name="Fitness").first.click()
    s.pg.wait_for_timeout(500)


def onboard(s: Session, answers=None, template="rotation", goal=None):
    """The real wizard: four Next clicks to reach the assessment, an answer
    per slot given, Next to the program summary, then Finish. On the goal
    step (after two Nexts) it clicks `goal` if given and the `template` card.
    The default is the rotation, so every case written before templates
    measures the schedule it was written against; a tree without template
    cards skips the click, so a "before" run FAILs instead of ERRORing."""
    to_fitness(s)
    for i in range(4):
        if i == 2:
            if goal:
                s.pg.click('#onb-body [data-goal="%s"]' % goal)
            card = s.pg.locator('#onb-body [data-template="%s"]' % template)
            if card.count():
                card.click()
        s.pg.click('#onb-body [data-onb="next"]')
    for slot, val in (answers or NOT_SURE).items():
        s.pg.select_option('[data-assess="%s"]' % slot, val)
    s.pg.click('#onb-body [data-onb="next"]')
    s.pg.click('[data-onb="finish"]')
    s.pg.wait_for_timeout(400)


def open_section(s: Session, section: str):
    nav = s.pg.locator('#nav [data-section="%s"]' % section).first
    if not nav.is_visible():
        s.pg.click("#fit-toggle")
        nav = s.pg.locator('#fit-panel [data-section="%s"]' % section).first
    nav.click()
    s.pg.wait_for_timeout(300)


def open_today(s: Session):
    open_section(s, "today")


def begin(s: Session):
    open_today(s)
    s.pg.click("#begin-session")
    s.pg.wait_for_timeout(300)


def log_set(s: Session, ex: int, st: int, value):
    set_stepper(s, "set-%d-%d" % (ex, st), value)


def complete(s: Session):
    s.pg.click("#complete-session")
    s.pg.wait_for_timeout(400)


def one_set_workout(s: Session, value=30):
    """The smallest real workout: begin, log set 1 of exercise 1, complete."""
    begin(s)
    log_set(s, 0, 0, value)
    complete(s)


def last_session(s: Session):
    return s.state()["sessions"][-1]


def session_day(sess) -> str:
    """The day BASALT files a session on, by the rule every reader should
    share: the saved training day, else the calendar date of its timestamp."""
    if sess.get("dayKey"):
        return sess["dayKey"]
    return datetime.fromisoformat(sess["dateISO"].replace("Z", "+00:00")).astimezone(
        ZoneInfo(TZ)).strftime("%Y-%m-%d")


def set_rollover(s: Session, hour: int):
    s.ev("h => { Hub.state.settings.dayStartHour = h; Hub.save(); }", hour)


def add_sessions(s: Session, sessions: list):
    """Fixture: append finished sessions that already exist in someone's past."""
    s.ev("""list => {
        const st = App.getState();
        list.forEach(x => st.sessions.push(x));
        App.saveState();
    }""", sessions)


def fake_session(i: int, type_: str, exercises: list) -> dict:
    return {"id": "s_fixture_%d" % i, "dateISO": datetime.now(ZoneInfo("UTC")).isoformat(),
            "type": type_, "exercises": exercises, "completed": True, "flags": [],
            "warmupDone": True, "cooldownDone": True, "notes": "", "volume": 0}


def fake_exercise(key, pattern, mode, reps, difficulty="moderate") -> dict:
    return {"key": key, "pattern": pattern, "name": key, "era2": False, "accessory": False,
            "mode": mode, "unit": "sec" if mode == "hold" else "reps",
            "sets": [{"reps": r, "weight": 0} for r in reps],
            "difficulty": difficulty, "flag": None}


def make_save(pw, with_workout: bool) -> str:
    """A real returning user's save, produced by the app itself."""
    s = Session(pw)
    try:
        onboard(s)
        if with_workout:
            one_set_workout(s)
        return s.raw()
    finally:
        s.close()


# ---------------------------------------------------------------------------
# The cases
# ---------------------------------------------------------------------------
CASES = []


def case(cid: str, title: str):
    def deco(fn):
        CASES.append((cid, title, fn))
        return fn
    return deco


# --- S1-S5 · the training day ------------------------------------------------
@case("S1", "Workout finished 05:00 IST, rollover 0")
def s1(pw):
    s = Session(pw, now=ist(2026, 10, 1, 5, 0))
    try:
        onboard(s)
        one_set_workout(s)
        sess = last_session(s)
        done = s.ev("""() => { Hub.gamify.invalidate();
            return !!Hub.gamify.CATEGORIES.fitness.done('2026-10-01'); }""")
        ok = done and sess.get("dayKey") == "2026-10-01"
        return ok, "streak 1 Oct done=%s, dayKey=%s" % (done, sess.get("dayKey")), s.errors
    finally:
        s.close()


@case("S2", "Finished 00:20 IST on 2 Oct, rollover 4")
def s2(pw):
    s = Session(pw, now=ist(2026, 10, 2, 0, 20))
    try:
        onboard(s)
        set_rollover(s, 4)
        hub_day = s.ev("() => Hub.today()")
        one_set_workout(s)
        basalt_day = session_day(last_session(s))
        s.set_time(ist(2026, 10, 2, 5, 0))   # past the rollover: Hub's day is now 2 Oct
        rest = s.ev("() => App.engine.restDayInfo(App.getState())")
        ok = basalt_day == hub_day == "2026-10-01" and rest.get("isRest") is True
        return ok, "BASALT %s, Hub %s, isRest at 05:00 on 2 Oct=%s" % (
            basalt_day, hub_day, rest.get("isRest")), s.errors
    finally:
        s.close()


@case("S3", "Logged while backfilling 29 Sep")
def s3(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        s.ev("() => Hub.setViewDate('2026-09-29')")
        one_set_workout(s)
        sess = last_session(s)
        day = session_day(sess)
        return day == "2026-09-29" and sess.get("dayKey") == "2026-09-29", \
            "filed on %s, dayKey=%s" % (day, sess.get("dayKey")), s.errors
    finally:
        s.close()


@case("S4", "Rollover 6: the rest-day key after a 03:00 session")
def s4(pw):
    s = Session(pw, now=ist(2026, 10, 2, 3, 0))
    try:
        onboard(s)
        set_rollover(s, 6)
        one_set_workout(s)
        day = session_day(last_session(s))
        s.set_time(ist(2026, 10, 2, 12, 0))
        rest = s.ev("() => App.engine.restDayInfo(App.getState())")
        # lastKey/nextKey are day-key strings: new Date("2026-10-01") is 05:30
        # IST, so a rollover-aware reader would shift them to 30 Sep / 2 Oct.
        ok = (day == "2026-10-01" and rest.get("isRest") is True
              and rest.get("lastKey") == "2026-10-01" and rest.get("nextKey") == "2026-10-03")
        return ok, "filed %s, isRest=%s lastKey=%s nextKey=%s" % (
            day, rest.get("isRest"), rest.get("lastKey"), rest.get("nextKey")), s.errors
    finally:
        s.close()


@case("S5", "Begun 23:50, finished 00:20, rollover 0")
def s5(pw):
    s = Session(pw, now=ist(2026, 10, 1, 23, 50))
    try:
        onboard(s)
        begin(s)
        s.set_time(ist(2026, 10, 2, 0, 20))
        log_set(s, 0, 0, 30)
        complete(s)
        sess = last_session(s)
        day = session_day(sess)
        return day == "2026-10-01", "filed on %s, dayKey=%s" % (day, sess.get("dayKey")), s.errors
    finally:
        s.close()


@case("S5b", "Rollover 4: records logged at 23:00 and 00:30 land on one day")
def s5b(pw):
    # Plan 1.3's second trap. "Today" and the day of a record created now must
    # use the same rule: the calendar date files the 00:30 weigh-in as a second
    # day; switching only "today" makes every 00:30 nutrition call add a new entry.
    s = Session(pw, now=ist(2026, 10, 1, 23, 0))
    try:
        onboard(s)
        set_rollover(s, 4)
        s.ev("() => App.showSection('dashboard')")
        for when, kg in ((ist(2026, 10, 1, 23, 0), "71.5"), (ist(2026, 10, 2, 0, 30), "72")):
            s.set_time(when)
            s.ev("() => App.refresh()")
            s.pg.locator("#bw-input").first.fill(kg)
            s.pg.click("#bw-log")
            s.pg.wait_for_timeout(250)
        nutrition = s.ev("""() => { for (let i = 0; i < 3; i++) App.engine.todayNutrition();
            return App.getState().nutritionLog.length; }""")
        bw = [b["kg"] for b in s.state()["bodyweightLog"]]
        return bw == [72] and nutrition == 1, \
            "bodyweight entries %s, nutrition entries after 3 calls %d" % (bw, nutrition), s.errors
    finally:
        s.close()


# --- S8-S9 · data safety -----------------------------------------------------
BANNER_UNREADABLE = re.compile(r"couldn.t be read", re.I)
BANNER_NEWER = re.compile(r"newer version", re.I)


def banner_visible(s: Session, pattern) -> bool:
    loc = s.pg.get_by_text(pattern).first
    try:
        return loc.is_visible(timeout=1500)
    except PlaywrightError:
        return False


def try_to_log(s: Session):
    """Whatever a user could do to write: open Today, begin, log, complete."""
    try:
        open_today(s)
        if s.pg.locator("#begin-session").count():
            s.pg.click("#begin-session", timeout=2000)
            log_set(s, 0, 0, 30)
            s.pg.click("#complete-session", timeout=2000)
            s.pg.wait_for_timeout(300)
    except PlaywrightError:
        pass  # a read-only app is allowed to have nothing to click


@case("S8", "Truncated save, then finish onboarding")
def s8(pw):
    good = make_save(pw, with_workout=True)
    broken = good[: len(good) * 6 // 10]
    try:
        json.loads(broken)
    except ValueError:
        pass
    else:
        raise RuntimeError("fixture is still valid JSON")
    s = Session(pw, seed=broken)
    try:
        to_fitness(s)
        onboarding = s.pg.locator("#onb-body").count() > 0
        if onboarding:                       # what an unprotected app offers
            for _ in range(4):
                s.pg.click('#onb-body [data-onb="next"]')
            s.pg.click('#onb-body [data-onb="next"]')
            s.pg.click('[data-onb="finish"]')
            s.pg.wait_for_timeout(400)
        else:
            try_to_log(s)
        banner = banner_visible(s, BANNER_UNREADABLE)
        kept = s.raw() == broken
        copies = s.ev("""() => Object.keys(localStorage).filter(k => k.startsWith('ironframe.state.v1.unreadable-'))
            .map(k => [k, localStorage.getItem(k)])""")
        copy_ok = any(UNREADABLE_KEY.match(k) and v == broken for k, v in copies)
        ok = (not onboarding) and kept and copy_ok and banner
        return ok, "onboarding=%s, key unchanged=%s, copy saved=%s, banner=%s" % (
            onboarding, kept, copy_ok, banner), s.errors
    finally:
        s.close()


@case("S9", "A save one version above this build")
def s9(pw):
    save = json.loads(make_save(pw, with_workout=False))
    save["version"] += 1   # was a literal 4 while the build was v3; the guard is version-relative
    raw = json.dumps(save)
    s = Session(pw, seed=raw)
    try:
        to_fitness(s)
        try_to_log(s)
        kept = s.raw() == raw
        banner = banner_visible(s, BANNER_NEWER)
        return kept and banner, "key unchanged=%s, banner=%s" % (kept, banner), s.errors
    finally:
        s.close()


# --- S10-S21 · the training fixes -------------------------------------------
def progress(s: Session) -> dict:
    return {p: t["progress"] for p, t in s.state()["tiers"].items()}


@case("S12", "Sharp wrist flag on push, plank logged")
def s12(pw):
    s = Session(pw)
    try:
        onboard(s)
        before = progress(s)["push"]
        begin(s)
        s.pg.click('[data-flag="0"]')
        s.pg.select_option("#flag-bp-0", "wrist")
        s.pg.select_option("#flag-sev-0", "sharp")
        s.pg.click("#flag-apply-0")
        s.pg.wait_for_timeout(300)
        inputs = s.pg.locator('[data-stepper^="set-0-"]').count()
        log_set(s, 3, 0, 30)                  # the plank: the day's last exercise
        complete(s)
        st = s.state()
        ex0 = st["sessions"][-1]["exercises"][0]
        pushes = [p for p in st["prs"] if p["exerciseId"] == ex0["key"]]
        gain = st["tiers"]["push"]["progress"] - before
        ok = gain == 0 and ex0.get("skipped") is True and inputs == 0 and not pushes
        return ok, "push +%d, skipped=%s, set inputs shown=%d, PRs under %s=%d" % (
            gain, ex0.get("skipped"), inputs, ex0["key"], len(pushes)), s.errors
    finally:
        s.close()


@case("S19", "28 days at one session every other day")
def s19(pw):
    s = Session(pw)
    try:
        onboard(s)
        res = s.ev("""() => {
            const day = 86400000;
            for (let back = 24; back <= 32; back++) {
                const phase = Object.assign({}, App.getState().currentPhase, {
                    startISO: new Date(Date.now() - back * day).toISOString(), lengthDays: 28 });
                if (App.util.phaseDayInfo(phase).day === 28)
                    return { expected: App.engine.expectedSessions(phase, 14) };
            }
            return null;
        }""")
        if res is None:
            raise RuntimeError("could not build a phase on day 28")
        rate = 14 / res["expected"]
        return res["expected"] == 14 and rate == 1.0, \
            "%d expected, %.1f%%" % (res["expected"], rate * 100), s.errors
    finally:
        s.close()


@case("S20", "Nothing rated, one set logged")
def s20(pw):
    s = Session(pw)
    try:
        onboard(s)
        one_set_workout(s)
        diffs = [e["difficulty"] for e in last_session(s)["exercises"]]
        return all(d is None for d in diffs), "difficulty " + json.dumps(diffs), s.errors
    finally:
        s.close()


@case("S21", "Two all-easy push sessions")
def s21(pw):
    s = Session(pw)
    try:
        onboard(s)
        easy = lambda: [fake_exercise("push_1", "push", "reps", [12, 12, 12], "easy")]
        add_sessions(s, [fake_session(1, "push", easy()), fake_session(2, "push", easy())])
        res = s.ev("""() => ({ sets: App.engine.buildWorkout('push').exercises[0].sets.length,
                               adaptSets: typeof App.engine._adaptSets })""")
        return res["sets"] == 3 and res["adaptSets"] == "undefined", \
            "%d sets, _adaptSets is %s" % (res["sets"], res["adaptSets"]), s.errors
    finally:
        s.close()


# --- T11-T12 · schema v4 ------------------------------------------------------
FIXTURE = ROOT / "tools" / "fixtures" / "v3-midworkout.json"


def v3_fixture() -> dict:
    """localStorage as the Stage 1 build left it, mid-workout: the two keys."""
    fx = json.loads(FIXTURE.read_text())
    return {k: v for k, v in fx.items() if not k.startswith("_")}


def seed_and_reload(s: Session, items: dict):
    """Fixture: write whole localStorage keys, then boot the app on them."""
    s.ev("o => { for (const k in o) localStorage.setItem(k, JSON.stringify(o[k])); }", items)
    s.pg.reload()
    s.pg.wait_for_timeout(700)


def without(d: dict, key: str) -> dict:
    return {k: v for k, v in d.items() if k != key}


@case("T11", "v3 save migrated twice, rollover 4")
def t11(pw):
    fx = v3_fixture()
    v3 = fx["ironframe.state.v1"]
    # Sessions a pre-Stage 1 build saved: no dayKey. 05:00 IST on 26 Sep is 25 Sep
    # in UTC; 00:30 IST on 24 Sep belongs to 23 Sep under rollover 4.
    for sid, when in (("s_legacy_0500", "2026-09-25T23:30:00.000Z"),
                      ("s_legacy_0030", "2026-09-23T19:00:00.000Z")):
        v3["sessions"].append(dict(fake_session(0, "push", [fake_exercise("push_1", "push", "reps", [8, 8, 8])]),
                                   id=sid, dateISO=when))
    # A hold and a loaded movement, so every kind of slot is built.
    v3["tiers"]["core"]["level"] = 4    # L-Sit
    v3["tiers"]["dip"]["level"] = 6     # Weighted Dip
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        set_rollover(s, 4)
        seed_and_reload(s, {STORAGE_KEY: v3})
        st = s.state()
        twice = s.ev("""raw => { const a = App.migrate(JSON.parse(raw));
            const b = App.migrate(JSON.parse(JSON.stringify(a)));
            return { same: JSON.stringify(a) === JSON.stringify(b), slots: (a.training || {}).slots || {} }; }""",
                     json.dumps(v3))
        slots = st.get("training", {}).get("slots", {})   # absent before v4: FAIL, not ERROR
        slot = lambda p: slots.get(p, {})
        days = {x["id"]: x.get("dayKey") for x in st["sessions"]}
        want_days = {"s_legacy_0500": "2026-09-26", "s_legacy_0030": "2026-09-23"}
        want_days.update({x["id"]: x["dayKey"] for x in v3["sessions"] if x.get("dayKey")})
        checks = {
            "version 4": st["version"] == 4,
            # The fixture owns no bar, so its pull day trains the row and the row
            # gets a record (R2-1); with a bar it would be offered instead (T21).
            "one slot per tier, plus the row it trains without a bar": sorted(slots) == sorted(list(v3["tiers"]) + ["row"])
                and slot("row").get("exerciseId") == "pull_alt_tabledoor" and slot("row").get("acceptedAt", 0) is None,
            "each tier's slot is its tier's exercise": all(
                slot(p).get("exerciseId") == "%s_%d" % (p, t["level"]) and slot(p).get("acceptedAt", 0) is None
                and slot(p).get("why") == "carried over from Level %d" % t["level"] for p, t in v3["tiers"].items()),
            "hold range": slot("core").get("range") == [10, 20] and slot("core").get("unit") == "sec",
            "loaded setup": slot("dip").get("setup") == {"loadKg": None, "loadMode": "total"},
            "every session has its dayKey": days == want_days,
            "sessions otherwise unchanged": [without(x, "dayKey") for x in st["sessions"]] ==
                                            [without(x, "dayKey") for x in v3["sessions"]],
            "PRs, tiers, phases, benchmarks unchanged": all(
                st[k] == v3[k] for k in ("prs", "tiers", "phaseHistory", "currentPhase", "benchmarks")),
            "migrated twice is identical": twice["same"] and twice["slots"] == slots,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "slots " + ", ".join("%s %s" % (p, slots[p]["exerciseId"]) for p in sorted(slots)) + \
            "; legacy dayKeys %s, %s" % (days.get("s_legacy_0500"), days.get("s_legacy_0030")), s.errors
    finally:
        s.close()


@case("T12", "v3 draft in ironframe.ui across the upgrade")
def t12(pw):
    fx = v3_fixture()
    draft = fx["ironframe.ui"]["today.workout"]
    logged = [[st.get("value") for st in ex["sets"]] for ex in draft["exercises"]]
    s = Session(pw, now=ist(2026, 10, 1, 8, 0))
    try:
        seed_and_reload(s, fx)
        to_fitness(s)
        open_today(s)
        shown = s.ev("""() => [0, 1].map(e => [0, 1, 2].map(i => {
            const el = document.querySelector('[data-stepper="set-' + e + '-' + i + '"] input');
            return el ? el.value : null; }))""")
        complete(s)
        st = s.state()
        sess = st["sessions"][-1]
        reps = [[x["reps"] for x in ex["sets"]] for ex in sess["exercises"]]
        want_reps = [[v or 0 for v in row] for row in logged]
        checks = {
            "resumed with its sets": shown == [[str(v) if v is not None else "" for v in row] for row in logged[:2]],
            "saved as logged": reps == want_reps,
            "no rx": not any("rx" in ex for ex in sess["exercises"]),
            "draft's day": sess.get("dayKey") == draft["dayKey"],
            "saved at v4": json.loads(s.raw())["version"] == 4 and len(st["sessions"]) == 2,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "inputs %s, saved reps %s, rx on %d exercises, dayKey %s" % (
                shown, reps[:2], sum("rx" in ex for ex in sess["exercises"]), sess.get("dayKey")), s.errors
    finally:
        s.close()


# --- T14-T18 · Stage 2 wiring ------------------------------------------------
ALL_DAYS_IDS = """() => { const out = {};
    App.engine.ROTATION.forEach(d => ['focused', 'full'].forEach(len => {
        out[d + '/' + len] = App.engine.buildWorkout(d, 'standard', len).exercises.map(e => e.slot + ':' + e.id);
    }));
    return out; }"""


def draft(s: Session):
    return s.ev("() => JSON.parse(JSON.stringify(App.util.uiGet('today.workout', null)))")


def pick_day(s: Session, day: str):
    s.pg.click('#day-seg [data-day="%s"]' % day)
    s.pg.wait_for_timeout(200)


@case("T14", "No pull-up bar: the row carries pulling, Dead Hang never prescribed")
def t14(pw):
    s = Session(pw)
    try:
        onboard(s)                                   # the default equipment owns no bar
        open_today(s)
        pick_day(s, "pull")
        shown = s.ev("() => [...document.querySelectorAll('[data-pv-ex]')].map(e => e.dataset.pvEx)")
        pv_note = s.ev("() => (document.querySelector('[data-pv-note]') || {}).textContent || ''")
        s.pg.click("#begin-session")
        s.pg.wait_for_timeout(300)
        w = draft(s)
        note = s.pg.locator("[data-ex-note]")
        card_note = note.first.inner_text() if note.count() else ""
        fresh = s.ev(ALL_DAYS_IDS)
        fresh_errors = s.errors
    finally:
        s.close()
    # The same, for a v3 user whose pull tier is Dead Hang and who owns no bar.
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        seed_and_reload(s, {STORAGE_KEY: v3_fixture()[STORAGE_KEY]})
        legacy = s.ev(ALL_DAYS_IDS)
    finally:
        s.close()
    hang = [k for k, ids in list(fresh.items()) + list(legacy.items()) if any(i.endswith(":pull_1") for i in ids)]
    checks = {
        "preview: row from the table row": shown[:1] == ["pull_alt_tabledoor"],
        "workout: row slot, same exercise": w["exercises"][0].get("slot") == "row"
            and w["exercises"][0]["id"] == "pull_alt_tabledoor",
        "the bar is explained": "pull-up bar" in pv_note and "pull-up bar" in card_note,
        "legacy pull day starts with the row": legacy["pull/focused"][:1] == ["row:pull_alt_tabledoor"],
        "Dead Hang in no day, either profile": not hang,
    }
    bad = [k for k, ok in checks.items() if not ok]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
        "pull day %s; legacy pull day %s; note %r" % (fresh["pull/focused"], legacy["pull/focused"], card_note[:60]), \
        fresh_errors + s.errors


@case("T15", "Moderate shoulder flag on Push-up: swaps to Wall Push-up at the bottom of its range")
def t15(pw):
    s = Session(pw)
    try:
        onboard(s, {"push": "push_2"})
        begin(s)
        s.pg.click('[data-flag="0"]')
        s.pg.select_option("#flag-bp-0", "shoulder")
        s.pg.select_option("#flag-sev-0", "moderate")
        s.pg.click("#flag-apply-0")
        s.pg.wait_for_timeout(300)
        ex = draft(s)["exercises"][0]
        inputs = s.pg.locator('[data-stepper^="set-0-"]').count()
        log_set(s, 0, 0, 6)
        complete(s)
        st = s.state()
        saved = st["sessions"][-1]["exercises"][0]
        hist = s.ev("""() => ['push_1', 'push_2'].map(id =>
            Training.exposures(App.getState().sessions, id).length)""")
        checks = {
            "swapped to push_1": ex["id"] == "push_1" and ex["rx"]["exerciseId"] == "push_1",
            "bottom of its range": ex["rx"]["range"] == [6, 12] and ex["target"] == 6 and inputs == 3,
            "saved as push_1": saved["key"] == "push_1" and saved["rx"]["exerciseId"] == "push_1",
            "history belongs to push_1": hist == [1, 0],
            "the flag names push_2": st["flagsHistory"][-1]["exerciseKey"] == "push_2",
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "now %s %s target %s, %d inputs; saved %s; exposures push_1/push_2 %s; flag on %s" % (
                ex["id"], ex["rx"]["range"], ex["target"], inputs, saved["key"], hist,
                st["flagsHistory"][-1]["exerciseKey"]), s.errors
    finally:
        s.close()


@case("T16", "Upgrade with existing history: no step from legacy sessions")
def t16(pw):
    fx = v3_fixture()
    v3 = fx[STORAGE_KEY]
    # Two legacy push sessions at the top of the range, rated easy, on different
    # days: evidence by every rule except that they carry no prescription.
    for i, day in ((1, "2026-09-24"), (2, "2026-09-27")):
        v3["sessions"].append(dict(fake_session(i, "push", [fake_exercise("push_2", "push", "reps", [12, 12, 12], "easy")]),
                                   id="s_legacy_%d" % i, dayKey=day))
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        seed_and_reload(s, {STORAGE_KEY: v3})
        legacy = s.ev("() => { const r = App.engine.recommendFor('push'); return { action: r.action, why: r.why, slot: App.getState().training.slots.push.exerciseId }; }")
        # Control: the same two sessions with the prescription saved on them must
        # be ready, or the case above proves nothing.
        control = s.ev("""() => { const st = App.getState(), rx = st.training.slots.push;
            ['2026-09-29', '2026-09-30'].forEach((d, i) => st.sessions.push({ id: 's_rx_' + i, dayKey: d,
                dateISO: d + 'T06:00:00.000Z', type: 'push', completed: true, flags: [],
                exercises: [{ key: rx.exerciseId, pattern: 'push', slot: 'push', rx: rx,
                              sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }], difficulty: 'easy', flag: null }] }));
            const r = App.engine.recommendFor('push'); return { action: r.action, why: r.why }; }""")
        ok = legacy["slot"] == "push_2" and legacy["action"] == "repeat" and control["action"] == "ready"
        return ok, "legacy only: %s (%s); with two rx sessions: %s" % (
            legacy["action"], legacy["why"], control["action"]), s.errors
    finally:
        s.close()


@case("T17", "Preview vs active workout: the same prescription object")
def t17(pw):
    s = Session(pw)
    try:
        onboard(s)
        open_today(s)
        # "Max effort" (+2 sets) became "+1 set" in step 3.1 (plan D4), so the
        # swapped push is 3 + 1 = 4 sets where it was 5.
        s.pg.click('[data-volmode="extended"]')
        s.pg.click('[data-pvswap="push"]')
        s.pg.click('[data-pvswapto="push_incline"]')
        s.pg.wait_for_timeout(200)
        shown = s.ev("() => [...document.querySelectorAll('[data-pv-rx]')].map(e => JSON.parse(e.dataset.pvRx))")
        s.pg.click("#begin-session")
        s.pg.wait_for_timeout(300)
        active = [e.get("rx") for e in draft(s)["exercises"]]
        first = active[0] or {}
        ok = bool(shown) and shown == active and first.get("exerciseId") == "push_incline" and first.get("sets") == 4
        return ok, "%d prescriptions shown, %d in the workout, identical=%s; first %s × %s" % (
            len(shown), len(active), shown == active, first.get("exerciseId"), first.get("sets")), s.errors
    finally:
        s.close()


@case("T18", "Points off: a workout and closing a period move no tier; an accepted step does")
def t18(pw):
    s = Session(pw)
    try:
        onboard(s, {"push": "push_3"})
        before = s.state()["tiers"]
        one_set_workout(s, 12)
        after_workout = s.state()["tiers"]
        s.ev("() => { App.evaluation.closePeriod('report'); App.evaluation.closePeriod('report'); }")
        after_phases = s.ev("() => App.getState().tiers")
        stepped = s.ev("""() => { const st = App.getState(), rx = st.training.slots.push;
            // After the workout just logged, so these two are the latest evidence.
            [1, 3].map(n => App.lib.dayKey(App.lib.addDays(Hub.today(), n))).forEach((d, i) => st.sessions.push({ id: 's_top_' + i, dayKey: d,
                dateISO: d + 'T06:00:00.000Z', type: 'push', completed: true, flags: [],
                exercises: [{ key: rx.exerciseId, pattern: 'push', slot: 'push', rx: rx,
                              sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }], difficulty: 'moderate', flag: null }] }));
            const key = App.engine.recommendFor('push').key, slot = App.engine.decide('push', 'step') || {};
            return { slot: slot.exerciseId, accepted: !!slot.acceptedAt, level: App.getState().tiers.push.level,
                     decision: (App.getState().training.decisions[key] || {}).choice }; }""")
        checks = {
            "workout moved no tier": after_workout == before,
            "closing two periods wrote no target": after_phases == before,
            "step accepted": stepped["slot"] == "push_4" and stepped["accepted"] and stepped["decision"] == "step",
            "level follows the step": before["push"]["level"] == 3 and stepped["level"] == 4,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "push L%d -> step -> %s, L%d, decision %s" % (before["push"]["level"], stepped["slot"],
                                                         stepped["level"], stepped["decision"]), s.errors
    finally:
        s.close()


# --- T19-T21 · Stage 2 screens -----------------------------------------------
def click_if(s: Session, sel: str) -> bool:
    """Click a control if it is there. A tree from before 3.2 has none of the
    recovery controls, and its cases must FAIL with numbers, not ERROR."""
    loc = s.pg.locator(sel)
    if not loc.count():
        return False
    loc.first.click()
    s.pg.wait_for_timeout(300)
    return True


def n_visible(s: Session, sel: str) -> int:
    """Matches on screen: a section left behind keeps its DOM, hidden."""
    return s.ev("sel => [...document.querySelectorAll(sel)].filter(x => x.offsetParent !== null).length", sel)


def text_of(s: Session, sel: str) -> str:
    """The first visible match's text, or "" — absent before 2.5, so a FAIL."""
    return s.ev("""sel => { const e = [...document.querySelectorAll(sel)].find(x => x.offsetParent !== null);
        return e ? e.innerText : ''; }""", sel)


def rx_sessions(s: Session, slot: str, days: list, reps: list, effort: str):
    """Fixture: finished sessions done at the slot's current prescription."""
    s.ev("""a => { const st = App.getState(), rx = st.training.slots[a.slot];
        a.days.forEach((d, i) => st.sessions.push({ id: 's_rx_' + a.slot + '_' + i, dayKey: d,
            dateISO: d + 'T06:00:00.000Z', type: 'push', completed: true, flags: [],
            exercises: [{ key: rx.exerciseId, pattern: a.slot, slot: a.slot, rx: rx,
                          sets: a.reps.map(r => ({ reps: r, weight: 0 })), difficulty: a.effort, flag: null }] }));
        App.saveState(); App.refresh(); }""", {"slot": slot, "days": days, "reps": reps, "effort": effort})


@case("T19", "Workout card: last sets, the reason, a step taken by click, Not sure, the finished counts")
def t19(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s, {"push": "push_incline"})
        open_today(s)
        pick_day(s, "push")
        unverified = text_of(s, "[data-pv-reason]")
        rx_sessions(s, "push", ["2026-09-24", "2026-09-27"], [12, 12, 12], "moderate")
        open_today(s)
        pick_day(s, "push")
        s.pg.click("#begin-session")
        s.pg.wait_for_timeout(300)
        card = s.ev("""() => { const b = document.querySelector('[data-block="0"]');
            const strip = document.querySelector('.ms-strip'), list = document.getElementById('ex-list');
            return { text: b ? b.innerText : '', era: b ? b.querySelectorAll('.badge--era1, .badge--era2').length : -1,
                     efforts: b ? [...b.querySelectorAll('[data-d]')].map(x => x.innerText) : [],
                     stripBelow: !!(strip && list && (list.compareDocumentPosition(strip) & Node.DOCUMENT_POSITION_FOLLOWING)) }; }""")
        last, reason, rule = text_of(s, "[data-rx-last]"), text_of(s, "[data-rx-reason]"), text_of(s, "[data-rx-rule]")
        step = s.pg.locator('[data-block="0"] [data-decide="push"][data-choice="step"]')
        if step.count():
            step.click()
            s.pg.wait_for_timeout(300)
        slot = s.state()["training"]["slots"]["push"]
        ex0 = draft(s)["exercises"][0]
        unsure = s.pg.locator('[data-diff="0"][data-d="unsure"]')
        if unsure.count():
            unsure.click()
        log_set(s, 0, 0, 7)
        complete(s)
        saved = last_session(s)["exercises"][0]
        open_today(s)
        counts = text_of(s, "[data-done-counts]")
        checks = {
            "unverified before any session": unverified.startswith("Unverified"),
            "last sets with their date": last.startswith("Last: 12 / 12 / 12") and "27" in last,
            "ready with both dates and the step": reason.startswith("Ready: 3 × 12 on 24") and "27" in reason
                and "table height" in reason,
            "the rule, with its limit": rule.startswith("Step up after two days at 3 × 12") and "can't see your form" in rule,
            "no readiness prose, no Era badge": "Ready to advance" not in card["text"] and "Advance at" not in card["text"]
                and card["era"] == 0,
            "five efforts": card["efforts"] == ["Easy", "Just right", "Hard", "Failed", "Not sure"],
            "muscle share below the exercises": card["stripBelow"],
            "step taken": slot.get("setup") == {"surface": "table"} and bool(slot.get("acceptedAt")),
            "today's draft follows the step": (ex0.get("rx") or {}).get("setup") == {"surface": "table"},
            "not sure saved as unknown": saved.get("difficulty") == "unsure",
            "finished card counts": counts == "0 complete · 1 partial · 3 skipped",
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "reason %r; last %r; slot %s %s; effort %s; counts %r" % (
                reason[:90], last, slot.get("exerciseId"), slot.get("setup"), saved.get("difficulty"), counts), s.errors
    finally:
        s.close()


@case("T20", "Upgrade card: once per device after a v3 upgrade, honest about Era II")
def t20(pw):
    out, errors = {}, []
    for label, era in (("era1", 1), ("era2", 2)):
        v3 = v3_fixture()[STORAGE_KEY]
        v3["era"] = era
        s = Session(pw, now=ist(2026, 10, 1, 12, 0))
        try:
            seed_and_reload(s, {STORAGE_KEY: v3})
            to_fitness(s)
            open_today(s)
            out[label] = text_of(s, "[data-upgrade-card]")
            if label == "era1":
                ok_btn = s.pg.locator("[data-upgrade-ok]")
                if ok_btn.count():
                    ok_btn.click()
                out["after_ok"] = text_of(s, "[data-upgrade-card]")
                s.pg.reload()
                s.pg.wait_for_timeout(700)
                to_fitness(s)
                open_today(s)
                out["after_reload"] = text_of(s, "[data-upgrade-card]")
            errors += s.errors
        finally:
            s.close()
    s = Session(pw)
    try:
        onboard(s)
        open_today(s)
        out["fresh"] = text_of(s, "[data-upgrade-card]")
        errors += s.errors
    finally:
        s.close()
    checks = {
        "shown after upgrade": "ranges" in out["era1"] and "evidence" in out["era1"]
            and "Nothing in your program changed" in out["era1"],
        "Era II told what changed": "One thing did change" in out["era2"]
            and "Nothing in your program changed" not in out["era2"],
        "gone once dismissed, and after reload": out.get("after_ok") == "" and out.get("after_reload") == "",
        "never for a new profile": out["fresh"] == "",
    }
    bad = [k for k, ok in checks.items() if not ok]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
        "era1 %d chars, era2 %d chars, after dismiss %d, fresh %d" % (
            len(out["era1"]), len(out["era2"]), len(out.get("after_reload") or ""), len(out["fresh"])), errors


@case("T21", "Row slot offered on a pull day, applied only if ticked, reversible in Program")
def t21(pw):
    res, errors = {}, []
    for label, tick in (("unticked", False), ("ticked", True)):
        v3 = v3_fixture()[STORAGE_KEY]
        v3["equipment"]["pullupBar"] = True
        s = Session(pw, now=ist(2026, 10, 1, 12, 0))
        try:
            seed_and_reload(s, {STORAGE_KEY: v3})
            to_fitness(s)
            open_today(s)
            pick_day(s, "push")
            on_push = text_of(s, "[data-row-offer]")
            pick_day(s, "pull")
            offer = text_of(s, "[data-row-offer]")
            before = s.state()["training"]["slots"].get("row")
            box = s.pg.locator("#row-offer-tick")
            if box.count():
                box.set_checked(tick)
                s.pg.click("#row-offer-save")
                s.pg.wait_for_timeout(300)
            row = s.state()["training"]["slots"].get("row") or {}
            ids = s.ev("() => [...document.querySelectorAll('[data-pv-ex]')].map(e => e.dataset.pvEx)")
            res[label] = {"on_push": on_push, "offer": offer, "before": before, "row": row, "ids": ids,
                          "after": text_of(s, "[data-row-offer]")}
            if tick:
                open_section(s, "program")
                tog = s.pg.locator('[data-slot-toggle="row"]')
                if tog.count():
                    tog.click()
                    s.pg.wait_for_timeout(300)
                res["program_off"] = s.state()["training"]["slots"].get("row") or {}
            errors += s.errors
        finally:
            s.close()
    u, t = res["unticked"], res["ticked"]
    checks = {
        "offered on pull, not push": u["offer"] != "" and u["on_push"] == "" and u["before"] is None,
        "unticked: a stamped off record": u["row"].get("off") is True and bool(u["row"].get("acceptedAt"))
            and "pull_alt_tabledoor" not in u["ids"] and u["after"] == "",
        "ticked: the row joins pull days": t["row"].get("exerciseId") == "pull_alt_tabledoor"
            and "pull_alt_tabledoor" in t["ids"] and t["after"] == "",
        "Program leaves it out again": res.get("program_off", {}).get("off") is True,
    }
    bad = [k for k, ok in checks.items() if not ok]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
        "unticked row %s; ticked row %s, pull day %s; Program -> off=%s" % (
            {k: u["row"].get(k) for k in ("off", "exerciseId")}, t["row"].get("exerciseId"), t["ids"],
            res.get("program_off", {}).get("off")), errors


# --- T22-T23 · R2's findings, by clicks end to end ----------------------------
def workout_at_top(s: Session, day: str, slot: str, reps: int, kg=None):
    """Begin `day`, log every set of `slot` at `reps` (and `kg`), rate it Just
    right, 5 on every other set, complete. All by clicks — the card's whole
    loop, where T19 seeds its evidence."""
    open_today(s)
    pick_day(s, day)
    s.pg.click("#begin-session")
    s.pg.wait_for_timeout(300)
    for i, ex in enumerate(draft(s)["exercises"]):
        for j in range(len(ex["sets"])):
            log_set(s, i, j, reps if ex.get("slot") == slot else 5)
            if ex.get("slot") == slot and kg is not None:
                inp = s.pg.locator('[data-wt="%d-%d"] input' % (i, j)).first
                inp.fill(str(kg))
                inp.press("Tab")
        if ex.get("slot") == slot:
            s.pg.click('[data-diff="%d"][data-d="moderate"]' % i)
    complete(s)


def card_after_two(pw, v3_mut, day: str, slot: str, kg=None) -> tuple:
    """A v3 user upgraded, two workouts at the top on 1 and 3 Oct, the card
    read on 5 Oct: (reason lines, Step up buttons, slot record, errors, the
    slot's Program/Progress status)."""
    v3 = v3_fixture()[STORAGE_KEY]
    v3_mut(v3)
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        seed_and_reload(s, {STORAGE_KEY: v3})
        to_fitness(s)
        for d in (1, 3):
            s.set_time(ist(2026, 10, d, 12, 0))
            workout_at_top(s, day, slot, 12, kg)
        s.set_time(ist(2026, 10, 5, 12, 0))
        open_today(s)
        pick_day(s, day)
        reasons = s.ev("() => [...document.querySelectorAll('[data-pv-reason]')].map(e => e.innerText.split('\\n')[0])")
        steps = s.pg.locator('[data-decide="%s"][data-choice="step"]' % slot).count()
        status = s.ev("(slot) => App.ui.slotStatus(slot)", slot)
        return reasons, steps, s.state()["training"]["slots"].get(slot), s.errors, status
    finally:
        s.close()


@case("T22", "Upgraded, no pull-up bar: the row it trains steps up like any slot")
def t22(pw):
    reasons, steps, row, errors, _ = card_after_two(pw, lambda v: None, "pull", "row")
    ok = steps == 1 and any(r.startswith("Ready: 3 × 12 on 1 Oct and 3 Oct — step up to body straight") for r in reasons)
    return ok, "row record %s; reasons %s; Step up buttons %d" % (
        row and (row.get("exerciseId"), row.get("setup")), reasons, steps), errors


@case("T23", "Weighted Dip with no load set: the logged weight sets it; a blank weight never counts")
def t23(pw):
    dip6 = lambda v: v["tiers"]["dip"].update(level=6)
    r_kg, s_kg, slot_kg, e1, _ = card_after_two(pw, dip6, "push", "dip", kg=10)
    r_bl, s_bl, slot_bl, e2, _ = card_after_two(pw, dip6, "push", "dip")
    dip_kg = [r for r in r_kg if "kg" in r or "Ready" in r]
    checks = {
        "logged weight becomes the slot's load": (slot_kg or {}).get("setup", {}).get("loadKg") == 10,
        "10 kg twice: ready, step to 12.5 kg": s_kg == 1 and any("12.5 kg" in r for r in r_kg),
        "blank weight: no step, says to log it": s_bl == 0 and (slot_bl or {}).get("setup", {}).get("loadKg") is None
            and any(r.startswith("Log the weight you use") for r in r_bl)
            and not any("end of this path" in r for r in r_bl),
    }
    bad = [k for k, ok in checks.items() if not ok]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
        "10 kg: slot load %s, %s, %d buttons; blank: %r" % (
            (slot_kg or {}).get("setup", {}).get("loadKg"), dip_kg[:1], s_kg,
            [r for r in r_bl if "weight" in r or "end of" in r or "no session" in r][:1]), e1 + e2


@case("T24", "At the end of a main path, Program and Progress don't promise a step")
def t24(pw):
    push4 = lambda v: v["tiers"]["push"].update(level=4)
    reasons, steps, rec, errors, status = card_after_two(pw, push4, "push", "push")
    ok = steps == 0 and any("end of this path" in r for r in reasons) and status == "at the top — end of the path"
    return ok, "slot %s; reasons %s; %d Step up buttons; status %r" % (
        (rec or {}).get("exerciseId"), [r for r in reasons if "end of" in r][:1], steps, status), errors


# --- T25-T26 · R1-2 and R1-3, by clicks --------------------------------------
@case("T25", "Streak recounts from session days after a merge (R1-2)")
def t25(pw):
    """Workouts on Mon 28 and Wed 30 Sep, then the streak put back the way a
    merge leaves the phone's — local wins field-wise, so it still reads one
    session on 28 Sep. Read on Fri 2 Oct after a reload."""
    s = Session(pw, now=ist(2026, 9, 28, 12, 0))
    try:
        onboard(s)
        one_set_workout(s)
        s.set_time(ist(2026, 9, 30, 12, 0))
        one_set_workout(s)
        s.ev("""k => { const st = JSON.parse(localStorage.getItem(k));
            st.streak = { count: 1, lastISO: '2026-09-28', best: 1 };
            localStorage.setItem(k, JSON.stringify(st)); }""", STORAGE_KEY)
        s.set_time(ist(2026, 10, 2, 12, 0))
        s.pg.reload()
        s.pg.wait_for_timeout(700)
        to_fitness(s)
        open_section(s, "dashboard")
        tile = s.ev("""() => { const t = [...document.querySelectorAll('.stat')].find(e => /^streak$/i.test(e.querySelector('.stat__label').innerText.trim()));
            return t ? t.querySelector('.stat__value').innerText.trim() : null; }""")
        st = s.state()["streak"]
        days = sorted({x.get("dayKey") for x in s.state()["sessions"]})
        ok = st.get("count") == 2 and st.get("lastISO") == "2026-09-30" and bool(tile) and tile == "2"
        return ok, "sessions on %s; streak %s; tile %r" % (days, st, tile), s.errors
    finally:
        s.close()


@case("T26", "Session edit, goal toggle and a re-logged run carry updatedAt (R1-3)")
def t26(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        one_set_workout(s)
        open_section(s, "progress")
        s.pg.click('[data-progtab="log"]')
        s.pg.locator("[data-sedit]").first.click()
        s.pg.locator('textarea[id^="se-notes-"]').first.fill("felt strong")
        s.pg.locator("[data-ssave]").first.click()
        s.pg.wait_for_timeout(200)
        open_section(s, "dashboard")
        s.pg.fill("#goal-input", "10 pull-ups")
        s.pg.click("#goal-add")
        s.pg.wait_for_timeout(200)
        s.pg.locator('[data-gtoggle="done"]').first.click()
        s.pg.wait_for_timeout(200)
        open_section(s, "running")
        s.pg.locator("[data-rungoal]").first.click()   # "Log a run" shows once a plan is picked
        s.pg.get_by_role("button", name="Start plan").click()
        s.pg.wait_for_timeout(300)
        for km in ("5", "6"):
            s.pg.locator("#run-log-free").first.click()
            s.pg.fill("#rl-km", km)
            s.pg.click("#rl-save")
            s.pg.wait_for_timeout(300)
        st = s.state()
        sess, goal = st["sessions"][-1], st["goals"][-1]
        runs = st["running"]["runLog"]
        checks = {
            "session edit stamped": sess.get("notes") == "felt strong" and bool(sess.get("updatedAt")),
            "goal toggle stamped": goal.get("done") is True and bool(goal.get("updatedAt")),
            "re-logged run: one record, stamped": len(runs) == 1 and runs[0].get("distanceKm") == 6 and bool(runs[0].get("updatedAt")),
        }
        bad = [k for k, v in checks.items() if not v]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "session %r @%s; goal done=%s @%s; runs %s" % (sess.get("notes"), sess.get("updatedAt"),
            goal.get("done"), goal.get("updatedAt"), [(r.get("distanceKm"), r.get("updatedAt")) for r in runs]), s.errors
    finally:
        s.close()


# --- P1-P6 · Stage 3 step 3.1: templates, rest rule, attendance, goals, modes --
def phase_attendance(s: Session) -> dict:
    """What the period's report reads: attended, planned, rate."""
    return s.ev("""() => { const ev = App.evaluation.evaluate(App.getState());
        return { attended: ev.sampleSize, planned: ev.expected, rate: (ev.adherence || ev.metrics).rate || (ev.metrics || {}).completionRate,
                 day: ev.dayInfo.day }; }""")


@case("P1", "Full body x3 followed exactly for 28 days: attendance 100%")
def p1(pw):
    # Mon 5 Oct 2026. Mon / Wed / Fri for four weeks is the template exactly.
    s = Session(pw, now=ist(2026, 10, 5, 9, 0))
    try:
        onboard(s, template="fullbody3")
        for week in range(4):
            for off in (0, 2, 4):
                s.set_time(ist(2026, 10, 5 + week * 7 + off, 10, 0))
                one_set_workout(s)
        s.set_time(ist(2026, 11, 1, 20, 0))           # day 28 of the period
        att = phase_attendance(s)
        types = [x["type"] for x in s.state()["sessions"]]
        alternates = types == ["fullA", "fullB"] * 6
        ok = att["day"] == 28 and att["attended"] == 12 and att["planned"] == 12 and att["rate"] == 1.0 and alternates
        return ok, "day %d: %d of %d planned, %.1f%%; types %s" % (
            att["day"], att["attended"], att["planned"], att["rate"] * 100,
            "A/B alternating" if alternates else types), s.errors
    finally:
        s.close()


@case("P2", "Upper/lower: Upper then Lower on consecutive days, no rest-day block")
def p2(pw):
    s = Session(pw, now=ist(2026, 10, 1, 9, 0))
    try:
        onboard(s, template="upperlower")
        s.set_time(ist(2026, 10, 1, 10, 0))
        one_set_workout(s)
        open_today(s)
        done_text = text_of(s, "#view-today .hero p, .hero p")
        s.set_time(ist(2026, 10, 2, 10, 0))
        open_today(s)
        day2_begin = s.pg.locator("#begin-session").count() > 0
        day2_title = text_of(s, "#today-title")
        if day2_begin:
            s.pg.click("#begin-session")
            s.pg.wait_for_timeout(300)
            log_set(s, 0, 0, 30)
            complete(s)
        s.set_time(ist(2026, 10, 3, 10, 0))
        open_today(s)
        day3_rest = s.pg.locator("#rest-train-anyway").count() > 0
        day3_text = text_of(s, ".hero p")
        types = [x["type"] for x in s.state()["sessions"]]
        checks = {
            "day 2 trains, no rest block": day2_begin and day2_title == "Lower",
            "Upper then Lower saved": types == ["upper", "lower"],
            "day 3 rests before Upper again": day3_rest and "back to back" in day3_text,
            "day 1 says Lower is tomorrow": "Lower tomorrow" in done_text,
        }
        bad = [k for k, v in checks.items() if not v]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "day 2 begin=%s title=%r; types %s; day 3 rest=%s %r" % (
                day2_begin, day2_title, types, day3_rest, day3_text[:70]), s.errors
    finally:
        s.close()


@case("P3", "Template changed mid-period: a new period starts, the old keeps its denominator")
def p3(pw):
    s = Session(pw, now=ist(2026, 10, 1, 9, 0))
    try:
        onboard(s, template="rotation")
        for d in (1, 3, 5, 7, 9):                     # every other day, 5 sessions
            s.set_time(ist(2026, 10, d, 10, 0))
            one_set_workout(s)
        s.set_time(ist(2026, 10, 10, 12, 0))          # day 10 of the period
        before = phase_attendance(s)
        open_section(s, "program")
        pick = s.pg.locator('[data-tpl-pick="fullbody3"]')
        preview = ""
        if pick.count():
            pick.click()
            preview = text_of(s, "[data-tpl-close]")
            s.pg.click('[data-tpl-apply="fullbody3"]')
            s.pg.wait_for_timeout(300)
        for d in (11, 13):                            # two sessions in the new period
            s.set_time(ist(2026, 10, d, 10, 0))
            one_set_workout(s)
        st = s.state()
        hist = (st.get("phaseHistory") or [{}])[-1] if st.get("phaseHistory") else {}
        now = phase_attendance(s)
        ph = st["currentPhase"]
        checks = {
            "old period closed with its denominator": hist.get("template") == "rotation" and hist.get("planned") == 5
                and hist.get("attended") == 5 and hist.get("closedBy") == "template",
            "new period under the new template": ph.get("number") == 2 and ph.get("template") == "fullbody3"
                and st["prefs"].get("template") == "fullbody3",
            "new period counts only its own sessions": now["attended"] == 2 and now["planned"] == 2,
            "preview named what closes": "5 of 5" in preview,
        }
        bad = [k for k, v in checks.items() if not v]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "before switch %d/%d; closed %s; phase %s %s, now %d/%d" % (
                before["attended"], before["planned"],
                {k: hist.get(k) for k in ("template", "attended", "planned", "closedBy")},
                ph.get("number"), ph.get("template"), now["attended"], now["planned"]), s.errors
    finally:
        s.close()


def open_settings(s: Session):
    s.pg.click("#btn-settings")
    s.pg.wait_for_timeout(300)


@case("P5", "Strength vs size on the same slot: different ranges")
def p5(pw):
    out, errors = {}, []
    for goal in ("strength", "size"):
        s = Session(pw, now=ist(2026, 10, 1, 12, 0))
        try:
            onboard(s, answers={"push": "push_incline"}, template="rotation", goal=goal)
            sl = s.state()["training"]["slots"]
            out[goal] = {k: sl[k]["range"] for k in ("push", "squat", "core")}
            out[goal + "_rest"] = s.state()["prefs"]["restDefaultSec"]
            if goal == "strength":
                # The same profile, goal changed in Settings by clicks.
                open_settings(s)
                s.pg.click('#set-goal [data-goal="size"]')
                s.pg.click("#btn-settings-save")
                s.pg.wait_for_timeout(300)
                sl = s.state()["training"]["slots"]
                out["switched"] = {k: sl[k]["range"] for k in ("push", "squat", "core")}
            errors += s.errors
        finally:
            s.close()
    st, sz, sw = out["strength"], out["size"], out.get("switched", {})
    checks = {
        "Incline Push-up: strength 4-8, size 8-15": st["push"] == [4, 8] and sz["push"] == [8, 15],
        "Squat (no setup or load): strength 6-12, size 8-15": st["squat"] == [6, 12] and sz["squat"] == [8, 15],
        "Plank hold unchanged": st["core"] == sz["core"] == [30, 60],
        "Settings Strength -> Size re-ranges": sw.get("push") == [8, 15] and sw.get("squat") == [8, 15],
        "rest by goal for a new profile": out["strength_rest"] == 150 and out["size_rest"] == 120,
    }
    bad = [k for k, v in checks.items() if not v]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
        "strength %s rest %s; size %s rest %s; switched %s" % (
            st, out["strength_rest"], sz, out["size_rest"], sw), errors


@case("P6", "Saved volumeMode max reads as +1 set, rest unchanged")
def p6(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s, template="rotation")
        s.ev("""() => { const st = App.getState();
            st.prefs.volumeMode = 'max'; st.prefs.sessionLength = 'full';
            st.prefs.restDefaultSec = 90; st.prefs.restHoldSec = 60;
            st.currentPhase.action = 'consolidate'; App.saveState(); }""")
        open_today(s)
        active = text_of(s, "#vol-mode-grid .is-active .vol-mode-btn__label")
        pick_day(s, "push")
        s.pg.click("#begin-session")
        s.pg.wait_for_timeout(300)
        w = draft(s)
        rows = [(e["id"], len(e["sets"]), e["restSec"], e.get("accessory", False), e["mode"]) for e in w["exercises"]]
        main = [r for r in rows if not r[3]]
        acc = [r for r in rows if r[3]]
        checks = {
            "reads as +1 set": active.lower() == "+1 set",   # the label is uppercased by CSS
            "main movements 4 sets": bool(main) and all(r[1] == 4 for r in main),
            "accessory keeps 3": bool(acc) and all(r[1] == 3 for r in acc),
            "rest unchanged, consolidation included": all(r[2] == (60 if r[4] == "hold" else 90) for r in rows),
        }
        bad = [k for k, v in checks.items() if not v]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "active %r; %s" % (active, ", ".join("%s %d sets %ds%s" % (r[0], r[1], r[2], " acc" if r[3] else "") for r in rows)), \
            s.errors
    finally:
        s.close()


# --- P4, P4b-P4d · Stage 3 step 3.2: recovery block and phase report ---------
def seed_declining(s: Session, slot: str, days: list, per_set: list):
    """Fixture: sessions at the slot's current prescription whose totals fall
    (every set the same value on a day), so recommend() answers Reduce."""
    s.ev("""a => { const st = App.getState(), rx = st.training.slots[a.slot];
        a.days.forEach((d, i) => st.sessions.push({ id: 's_dn_' + a.slot + '_' + i, dayKey: d,
            dateISO: d + 'T06:00:00.000Z', type: 'push', completed: true, flags: [],
            exercises: [{ key: rx.exerciseId, pattern: a.slot, slot: a.slot, rx: rx,
                          sets: Array.from({ length: rx.sets }, () => ({ reps: a.per[i], weight: 0 })),
                          difficulty: 'moderate', flag: null }] }));
        App.saveState(); App.refresh(); }""", {"slot": slot, "days": days, "per": per_set})


def sharp_flag_workout(s: Session):
    """A real push workout with a sharp wrist flag on exercise 0, plank logged.
    Push is picked: the rotation would otherwise move on to Pull."""
    open_today(s)
    pick_day(s, "push")
    s.pg.click("#begin-session")
    s.pg.wait_for_timeout(300)
    s.pg.click('[data-flag="0"]')
    s.pg.select_option("#flag-bp-0", "wrist")
    s.pg.select_option("#flag-sev-0", "sharp")
    s.pg.click("#flag-apply-0")
    s.pg.wait_for_timeout(300)
    log_set(s, 3, 0, 30)
    complete(s)


def push_preview(s: Session) -> dict:
    """What a push workout would be right now: set counts, rest, ranges."""
    return s.ev("""() => { const w = App.engine.buildWorkout('push', 'standard', 'focused');
        return { sets: w.exercises.map(e => e.sets.length), rest: w.exercises.map(e => e.restSec),
                 ranges: w.exercises.map(e => e.range), recovery: w.recovery || null }; }""")


@case("P4", "Recovery block: 3 sets -> 2; ranges and rest unchanged; nothing counted as evidence; nothing raised")
def p4(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s, {"push": "push_incline"})
        rx_sessions(s, "push", ["2026-09-24", "2026-09-27"], [12, 12, 12], "moderate")
        base = push_preview(s)
        open_today(s)
        pick_day(s, "push")
        step_before = s.pg.locator('[data-decide="push"][data-choice="step"]').count()
        slot_before = s.state()["training"]["slots"]["push"]
        open_section(s, "evaluation")
        click_if(s, "#ev-rb-now")                     # "when you ask"
        open_today(s)
        banner = n_visible(s, "[data-rb-banner]")
        pick_day(s, "push")
        step_during = s.pg.locator('[data-decide="push"][data-choice="step"]').count()
        reason_during = text_of(s, "[data-pv-reason]")
        s.pg.click("#begin-session")
        s.pg.wait_for_timeout(300)
        w = draft(s)
        during = {"sets": [len(e["sets"]) for e in w["exercises"]], "rest": [e["restSec"] for e in w["exercises"]],
                  "ranges": [e["range"] for e in w["exercises"]]}
        log_set(s, 0, 0, 7)
        complete(s)
        st = s.state()
        saved = st["sessions"][-1]
        comparable = s.ev("""() => Training.comparable(App.getState().sessions, App.getState().training.slots.push).length""")
        s.set_time(ist(2026, 10, 9, 12, 0))           # day 9: the 7-day block is over
        after = push_preview(s)
        open_today(s)
        pick_day(s, "push")
        banner_after = n_visible(s, "[data-rb-banner]")
        step_after = s.pg.locator('[data-decide="push"][data-choice="step"]').count()
        checks = {
            "baseline is 3 sets": all(n == 3 for n in base["sets"]),
            "block cuts every count to 2": bool(during["sets"]) and all(n == 2 for n in during["sets"]),
            "ranges unchanged": during["ranges"] == base["ranges"],
            "rest unchanged": during["rest"] == base["rest"],
            "session stamped with the block": bool(saved.get("recovery")) and saved["exercises"][0]["rx"]["sets"] == 2,
            "block session is not evidence": comparable == 2,
            "nothing steps up inside it": step_before == 1 and step_during == 0 and "waits" in reason_during
                and st["training"]["slots"]["push"] == slot_before,
            "banner while on": banner == 1,
            "normal again on day 9": all(n == 3 for n in after["sets"]) and banner_after == 0,
            "the step comes back after it": step_after == 1,
        }
        bad = [k for k, v in checks.items() if not v]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "sets %s -> %s -> %s; rest same=%s; ranges same=%s; step buttons %d/%d/%d; comparable %d; block %s" % (
                base["sets"], during["sets"], after["sets"], during["rest"] == base["rest"],
                during["ranges"] == base["ranges"], step_before, step_during, step_after, comparable,
                saved.get("recovery")), s.errors
    finally:
        s.close()


@case("P4b", "Recovery block offered after a sharp flag: Not now holds, Start applies, End returns to normal")
def p4b(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        open_today(s)
        offer_none = s.pg.locator("[data-rb-offer]").count()
        sharp_flag_workout(s)
        s.set_time(ist(2026, 10, 3, 12, 0))
        open_today(s)
        offer = text_of(s, "[data-rb-offer]")
        click_if(s, "[data-rb-no]")
        open_today(s)
        gone = s.pg.locator("[data-rb-offer]").count()
        blocks_after_no = len(s.state().get("recoveryBlocks") or [])
        # A second sharp flag is something new: the offer comes back.
        s.set_time(ist(2026, 10, 5, 12, 0))
        sharp_flag_workout(s)
        s.set_time(ist(2026, 10, 6, 12, 0))
        open_today(s)
        back = s.pg.locator("[data-rb-offer]").count()
        click_if(s, "[data-rb-start]")
        blocks = s.state().get("recoveryBlocks") or []
        banner = n_visible(s, "[data-rb-banner]")
        during = push_preview(s)
        click_if(s, "[data-rb-end]")
        ended = (s.state().get("recoveryBlocks") or [{}])[0]
        after = push_preview(s)
        checks = {
            "no offer with nothing flagged": offer_none == 0,
            "offer names the flag": "wrist" in offer.lower() and "sharp" in offer.lower() and "7-day" in offer,
            "Not now holds across a re-render": gone == 0 and blocks_after_no == 0,
            "a new sharp flag offers again": back == 1,
            "Start writes one block, reason flag": len(blocks) == 1 and blocks[0]["reason"] == "flag"
                and blocks[0]["startKey"] == "2026-10-06" and blocks[0]["days"] == 7,
            "banner while on, sets cut": banner == 1 and all(n == 2 for n in during["sets"]),
            "End stamps endedKey and updatedAt": ended.get("endedKey") == "2026-10-06" and bool(ended.get("updatedAt")),
            "normal sets after End": all(n == 3 for n in after["sets"]),
        }
        bad = [k for k, v in checks.items() if not v]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "offer %r; blocks %s; sets %s -> %s" % (offer[:60], [(b["startKey"], b["reason"], b.get("endedKey")) for b in (s.state().get("recoveryBlocks") or [])],
                                                    during["sets"], after["sets"]), s.errors
    finally:
        s.close()


@case("P4c", "Recovery block offered when two slots' totals fall; one slot is not enough")
def p4c(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s, {"push": "push_incline", "squat": "squat_2"})
        seed_declining(s, "push", ["2026-09-26", "2026-09-28", "2026-09-30"], [10, 9, 8])
        open_today(s)
        one = s.pg.locator("[data-rb-offer]").count()
        recs = s.ev("() => ['push', 'squat'].map(k => (App.engine.recommendFor(k) || {}).action)")
        seed_declining(s, "squat", ["2026-09-27", "2026-09-29", "2026-09-30"], [10, 9, 8])
        open_today(s)
        two = text_of(s, "[data-rb-offer]")
        recs2 = s.ev("() => ['push', 'squat'].map(k => (App.engine.recommendFor(k) || {}).action)")
        click_if(s, "[data-rb-start]")
        b = (s.state().get("recoveryBlocks") or [{}])[0]
        checks = {
            "one falling slot offers nothing": recs[0] == "reduce" and one == 0,
            "two falling slots offer a block": recs2 == ["reduce", "reduce"] and "7-day" in two,
            "the offer shows the totals": "30 → 27 → 24" in two,
            "Start writes the block, reason reduce": b.get("reason") == "reduce",
        }
        bad = [k for k, v in checks.items() if not v]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "actions %s then %s; offer %r; block reason %s" % (recs, recs2, two[:90], b.get("reason")), s.errors
    finally:
        s.close()


@case("P4d", "Phase report: three sections with sample counts, no grade; closing it changes no prescription")
def p4d(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s, {"push": "push_incline"})
        one_set_workout(s)
        open_section(s, "evaluation")
        click_if(s, "#ev-rb-now")
        s.set_time(ist(2026, 10, 3, 12, 0))
        one_set_workout(s)                            # inside the block, at reduced sets
        s.set_time(ist(2026, 10, 10, 12, 0))
        open_section(s, "evaluation")
        screen = text_of(s, "#ev-live")
        s.pg.click("#ev-open")
        s.pg.wait_for_timeout(500)
        modal = s.ev("""() => { const m = document.getElementById('modal-report');
            return { text: m.innerText, sections: [...m.querySelectorAll('[data-ev-section]')].map(e => ({
                key: e.dataset.evSection, sample: (e.querySelector('[data-ev-sample]') || {}).innerText || '' })),
                grade: m.querySelectorAll('.rc-grade, .ring, #rc-score-num, [data-rc-act]').length }; }""")
        before = s.state()
        s.pg.click("#rc-apply")
        s.pg.wait_for_timeout(400)
        st = s.state()
        entry = (st["phaseHistory"] or [{}])[-1]
        keys = [x["key"] for x in modal["sections"]]
        checks = {
            "three sections in order": keys == ["adherence", "performance", "recovery"],
            "each carries a count": all(re.search(r"\d", x["sample"]) for x in modal["sections"]),
            "no grade, ring or recommendation": modal["grade"] == 0 and "Recommended" not in modal["text"],
            "the review screen shows the same three": all(screen.lower().count(w) >= 1 for w in ("adherence", "performance", "recovery")),
            "recovery names the block and its sessions": "1 recovery block" in modal["text"].lower() or
                re.search(r"Recovery blocks\s*1", modal["text"]) is not None,
            "closed with counts, no grade": entry.get("attended") == 2 and entry.get("blocks") == 1
                and "grade" not in entry and "score" not in entry,
            "next phase opened": st["currentPhase"]["number"] == 2 and st["currentPhase"].get("volumeFactor") == 1,
            "no prescription or tier changed": st["training"]["slots"] == before["training"]["slots"] and st["tiers"] == before["tiers"],
        }
        bad = [k for k, v in checks.items() if not v]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "samples %s; closed %s" % ([x["sample"] for x in modal["sections"]],
            {k: entry.get(k) for k in ("attended", "planned", "steps", "flags", "failed", "rated", "blocks")}), s.errors
    finally:
        s.close()


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------
# --- P7-P9 · Stage 3 step 3.3: running and muscles ---------------------------
def start_run_plan(s: Session, goal: str):
    """The real gesture: Running tab, a goal card, the confirm dialog."""
    open_section(s, "running")
    s.pg.click('[data-rungoal="%s"]' % goal)
    s.pg.click("#cf-ok")
    s.pg.wait_for_timeout(300)


def click_visible(s: Session, sel: str) -> bool:
    """click_if for a control that also exists, hidden, in a view left behind
    (the Today tab keeps its DOM when you open Running)."""
    loc = s.pg.locator(sel + ":visible")
    if not loc.count():
        return False
    loc.first.click()
    s.pg.wait_for_timeout(300)
    return True


def run_state(s: Session) -> dict:
    return s.ev("""() => { const r = App.getState().running;
        return { week: App.run.currentWeek(), offset: r.weekOffset, asked: r.askedWeek,
                 missed: !!(App.run.missedWeek && App.run.missedWeek()) }; }""")


@case("P7", "A missed run week asks Repeat / Move on; elapsed time alone advances nothing")
def p7(pw):
    s = Session(pw, now=ist(2026, 10, 5, 9, 0))      # Mon 5 Oct
    try:
        onboard(s)
        start_run_plan(s, "base")
        # Week 1 (5-11 Oct): the two runs of the Couch-to-5K plan, only one logged.
        s.ev("() => App.run.logRun({ dateISO: '2026-10-07T07:00:00+05:30', kind: 'walkrun', distanceKm: 2, durationSec: 1500 })")
        s.set_time(ist(2026, 10, 12, 9, 0))           # Mon of week 2, Sat 10 never logged
        open_section(s, "running")
        asks = n_visible(s, "[data-run-missed]")
        text = text_of(s, "[data-run-missed]")
        before = run_state(s)
        click_visible(s, "[data-run-repeat]")
        after = run_state(s)
        asks_after = n_visible(s, "[data-run-missed]")
        # A week later, still nothing logged: the calendar says week 3.
        s.set_time(ist(2026, 10, 19, 9, 0))
        open_section(s, "running")
        later = run_state(s)
        asks_later = n_visible(s, "[data-run-missed]")
        click_visible(s, "[data-run-moveon]")
        moved_on = run_state(s)
        footer = s.pg.locator("#run-unrepeat").count()
        # Control: a week with every run logged asks nothing.
        c = Session(pw, now=ist(2026, 10, 5, 9, 0))
        try:
            onboard(c)
            start_run_plan(c, "base")
            for d in ("2026-10-07", "2026-10-10"):
                c.ev("d => App.run.logRun({ dateISO: d + 'T07:00:00+05:30', kind: 'walkrun', distanceKm: 2, durationSec: 1500 })", d)
            c.set_time(ist(2026, 10, 12, 9, 0))
            open_section(c, "running")
            control = (n_visible(c, "[data-run-missed]"), run_state(c)["week"])
            errors = s.errors + c.errors
        finally:
            c.close()
        checks = {
            "week 2 asks, naming week 1 and the unlogged day": asks == 1 and "Week 1" in text and "10 Oct" in text,
            "before answering, the plan is on week 2 (index 1)": before["week"] == 1 and before["offset"] == 0,
            "Repeat puts the plan back on week 1 and stops asking": after["week"] == 0 and after["offset"] == 1 and asks_after == 0,
            "a week on, with nothing logged, the plan is on week 2, not 3, and asks again":
                later["week"] == 1 and asks_later == 1,
            "Move on keeps the plan where it is and stops asking": moved_on["week"] == 1 and moved_on["offset"] == 1 and not moved_on["missed"],
            "the repeat can be undone from the page": footer == 1,
            "a fully logged week asks nothing": control == (0, 1),
        }
        bad = [k for k, v in checks.items() if not v]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "asks %s; before %s; after repeat %s (asks %s); 19 Oct %s (asks %s); moved on %s; control %s" % (
                asks, before, after, asks_after, later, asks_later, moved_on, control), errors
    finally:
        s.close()


def week3_wednesday(pw, template: str):
    """A user on `template`, the VO2 plan started 5 Oct, a session logged
    Monday 19 Oct, and now Wednesday 21 Oct: week 3's first run is VO2 max."""
    s = Session(pw, now=ist(2026, 10, 5, 9, 0))
    onboard(s, template=template)
    start_run_plan(s, "vo2max")
    s.set_time(ist(2026, 10, 19, 9, 0))
    one_set_workout(s)
    s.set_time(ist(2026, 10, 21, 9, 0))
    return s


@case("P8", "A hard run and a squat or hinge session on one day: a note on both cards")
def p8(pw):
    s = week3_wednesday(pw, "fullbody3")        # Full body B on Wednesday: it hinges
    try:
        open_today(s)
        today_notes = n_visible(s, "[data-run-clash]")
        preview_note = s.pg.locator("#today-preview [data-run-clash]").count()
        text = text_of(s, "#today-preview [data-run-clash]")
        open_section(s, "running")
        running_notes = n_visible(s, "[data-run-clash]")
        click_visible(s, "[data-run-move]")
        st = s.state()["running"]
        after_notes = n_visible(s, "[data-run-clash]")
        moved_row = s.pg.locator("[data-run-unmove]").count()
        open_today(s)
        today_after = n_visible(s, "[data-run-clash]")
        run_card_after = s.pg.get_by_text("Also scheduled today").count()
        # Put it back, from the row.
        open_section(s, "running")
        click_visible(s, "[data-run-unmove]")
        restored = s.state()["running"].get("moved")
        errors = s.errors
    finally:
        s.close()
    # Controls: a push day is no clash, and an easy run on a hinge day is none.
    c = Session(pw, now=ist(2026, 10, 5, 9, 0))
    try:
        onboard(c, template="rotation")         # no sessions yet: Push is up next
        start_run_plan(c, "vo2max")
        c.set_time(ist(2026, 10, 21, 9, 0))
        open_today(c)
        push_day = n_visible(c, "[data-run-clash]")
        errors = errors + c.errors
    finally:
        c.close()
    e = Session(pw, now=ist(2026, 10, 5, 9, 0))
    try:
        onboard(e, template="fullbody3")
        start_run_plan(e, "vo2max")
        e.set_time(ist(2026, 10, 7, 9, 0))      # week 1, Wednesday: an easy run
        open_today(e)
        easy_run = n_visible(e, "[data-run-clash]")
        errors = errors + e.errors
    finally:
        e.close()
    checks = {
        "Today shows the note on the run card and on the lifting card": today_notes == 2 and preview_note == 1,
        "the note names the hinge and the run": "hinge" in text and "30/30" in text,
        "the Running tab shows it once": running_notes == 1,
        "Move run to tomorrow moves 21 Oct to 22 Oct": st.get("moved") == {"2026-10-21": "2026-10-22"},
        "after the move no note remains, on Running or Today": after_notes == 0 and today_after == 0 and run_card_after == 0,
        "the moved row says so and can be put back": moved_row == 1 and restored == {},
        "control: a push day has no note": push_day == 0,
        "control: an easy run on a hinge day has no note": easy_run == 0,
    }
    bad = [k for k, v in checks.items() if not v]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
        "Today notes %s (preview %s) \"%s\"; Running %s; moved %s; after %s/%s/%s; restored %s; push %s; easy %s" % (
            today_notes, preview_note, text[:60], running_notes, st.get("moved"), after_notes, today_after,
            run_card_after, restored, push_day, easy_run), errors


# Hand-derived, not read from the app. A slot's weekly units are sets (3) x reps
# per set (muscles.data.js MUSCLE_WEEK) x sessions of its day type a week
# (perWeek / day types). The default profile owns no pull-up bar, so the pull
# slot rows and every day has one pulling slot, at 8 reps and the pull profile
# (lats primary 1.0):
#   Full body x3  A, B     3/wk  -> 3 x 8 x 1.5 x 2 days   = 72
#   Full body x2  A, B     2/wk  -> 3 x 8 x 1.0 x 2 days   = 48
#   Upper / lower U, L     4/wk  -> 3 x 8 x 2.0 x 1 day    = 48  (U rows once without a bar)
#   Rotation      4 types  3.5/wk-> 3 x 8 x 0.875 x 2 days = 42  (pull day, full-body day)
# and with a bar, Upper rows AND pulls, so its lats double to 96.
P9_LATS = {"fullbody3": 72, "fullbody2": 48, "upperlower": 48, "rotation": 42}


@case("P9", "Muscle-map targets follow the template, and check-muscle-map.js passes for each")
def p9(pw):
    import subprocess
    root = pathlib.Path(INDEX_URL[len("file://"):]).parent
    tool = subprocess.run(["node", str(root / "tools" / "check-muscle-map.js")], capture_output=True, text=True, cwd=str(root))
    tool_lines = [l for l in tool.stdout.splitlines() if re.search(r"^\s+\u2713 \w+\s+[\d.]+/wk", l)]
    got, errors = {}, []
    for tpl in P9_LATS:
        s = Session(pw, now=ist(2026, 10, 1, 12, 0))
        try:
            onboard(s, template=tpl)
            read = lambda: s.ev("() => { const m = App.muscles.model(7).find(r => r.key === 'lats'); return m && m.target; }")
            got[tpl] = read()
            if tpl == "upperlower":
                s.ev("() => { App.getState().equipment.pullupBar = true; App.saveState(); }")
                got["upperlower+bar"] = read()
            errors += s.errors
        finally:
            s.close()
    want = dict(P9_LATS, **{"upperlower+bar": 96})
    checks = {
        "check-muscle-map.js exits 0": tool.returncode == 0,
        "it audits all four templates": len(tool_lines) == 4,
        "lats target per template, no pull-up bar, and Upper with one": got == want,
    }
    bad = [k for k, v in checks.items() if not v]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
        "tool exit %s, %d template lines; lats %s, wanted %s" % (tool.returncode, len(tool_lines), got, want), errors


# --- T27-T31 · R3's findings ---------------------------------------------------
def live_streak(s: Session) -> int:
    return s.ev("() => App.engine.liveStreak(App.getState())")


@case("T27", "Full body x2 followed exactly keeps its streak; the rotation's gap is unchanged (R3-1)")
def t27(pw):
    s = Session(pw, now=ist(2026, 10, 5, 9, 0))
    c = None
    try:
        onboard(s, template="fullbody2")
        trace = []
        for d in (5, 8, 12, 15):                       # Mon / Thu, two weeks
            s.set_time(ist(2026, 10, d, 9, 0))
            open_section(s, "dashboard")
            before = live_streak(s)
            one_set_workout(s)
            trace.append((d, before, live_streak(s)))
        st = s.state()["streak"]
        # Control: the rotation still breaks at a 4-day gap.
        c = Session(pw, now=ist(2026, 10, 5, 9, 0))
        onboard(c)
        one_set_workout(c)
        c.set_time(ist(2026, 10, 9, 9, 0))
        open_section(c, "dashboard")
        ctl_before = live_streak(c)
        one_set_workout(c)
        ctl = c.state()["streak"]["count"]
        errors = s.errors + c.errors
    finally:
        s.close()
        if c:
            c.close()
    checks = {
        "never 0 before a planned session": all(b > 0 for _, b, _ in trace[1:]),
        "four sessions, streak 4": st["count"] == 4 and st["best"] == 4,
        "control: the rotation resets after a 4-day gap": ctl_before == 0 and ctl == 1,
    }
    bad = [k for k, v in checks.items() if not v]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
        "trace (day, before, after) %s; streak %s; rotation control before %s, count %s" % (trace, st, ctl_before, ctl), errors


@case("T28", "A recovery block running when the period closes counts in the new period (R3-2)")
def t28(pw):
    s = Session(pw, now=ist(2026, 10, 5, 12, 0))
    try:
        onboard(s)
        open_section(s, "evaluation")
        click_if(s, "#ev-rb-now")                       # block from 5 Oct
        s.set_time(ist(2026, 10, 6, 12, 0))
        open_section(s, "program")
        click_visible(s, '[data-tpl-pick="fullbody3"]')
        click_visible(s, "[data-tpl-apply]")            # Phase 2 starts 6 Oct
        s.set_time(ist(2026, 10, 7, 12, 0))
        one_set_workout(s)
        saved = s.state()["sessions"][-1]
        open_section(s, "dashboard")
        open_section(s, "evaluation")
        row = s.ev("""() => { const r = [...document.querySelectorAll('#ev-live [data-ev-section="recovery"] .rc-diff__row')]
            .find(x => /Recovery blocks/.test(x.innerText)); return r ? r.innerText.replace(/\\s+/g, ' ') : ''; }""")
        ev = s.ev("() => { const r = App.evaluation.evaluate(App.getState()).recovery; return [r.blocks.length, r.blocks.map(b => b.days), r.blockSessions]; }")
        phase = s.state()["currentPhase"]["number"]
        errors = s.errors
    finally:
        s.close()
    checks = {
        "the workout ran at reduced sets": bool(saved.get("recovery")),
        "Phase 2 counts the block, its 2 days so far, and the session": phase == 2 and ev == [1, [2], 1],
        "the row says so": row.startswith("Recovery blocks 1") and "1 session at reduced sets" in row,
    }
    bad = [k for k, v in checks.items() if not v]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
        "phase %s; blocks, days, sessions %s; row '%s'" % (phase, ev, row), errors


@case("T29", "Switching to Upper/Lower the day after a rotation session keeps the rest day (R3-3)")
def t29(pw):
    s = Session(pw, now=ist(2026, 10, 5, 9, 0))
    try:
        onboard(s)
        one_set_workout(s)                              # Push, 5 Oct
        s.set_time(ist(2026, 10, 6, 9, 0))
        open_section(s, "program")
        click_visible(s, '[data-tpl-pick="upperlower"]')
        click_visible(s, "[data-tpl-apply]")
        info = s.ev("() => { const r = App.engine.restDayInfo(App.getState()); return [r.isRest, r.rule || null]; }")
        open_today(s)
        why = text_of(s, ".hero p")
        begin_btn = n_visible(s, "#begin-session")
        s.set_time(ist(2026, 10, 7, 9, 0))
        open_section(s, "dashboard")
        next_day = s.ev("() => [App.engine.restDayInfo(App.getState()).isRest, App.engine.recommendedDayType()]")
        errors = s.errors
    finally:
        s.close()
    checks = {
        "6 Oct is a rest day after the switch": info == [True, "switched"] and begin_btn == 0,
        "the reason names the switch, not a back-to-back pair": "previous template" in why and "back to back" not in why,
        "7 Oct trains Upper": next_day == [False, "upper"],
    }
    bad = [k for k, v in checks.items() if not v]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
        "6 Oct %s, begin buttons %s, '%s'; 7 Oct %s" % (info, begin_btn, why[:90], next_day), errors


@case("T30", "Backfilling inside a recovery block: full sets for the earlier day, no step offered today (R3-4)")
def t30(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s, {"push": "push_incline"})
        rx_sessions(s, "push", ["2026-09-24", "2026-09-27"], [12, 12, 12], "moderate")
        open_section(s, "evaluation")
        click_if(s, "#ev-rb-now")                       # block from 1 Oct
        s.ev("() => Hub.setViewDate('2026-09-30')")
        open_section(s, "dashboard")
        open_today(s)
        pick_day(s, "push")
        steps = s.pg.locator('[data-decide="push"][data-choice="step"]:visible').count()
        reason = text_of(s, "[data-pv-reason]")
        sets = [len(e["sets"]) for e in s.ev("() => App.engine.buildWorkout('push').exercises")]
        decided = s.ev("() => App.engine.decide('push', 'step')")
        slot = s.state()["training"]["slots"]["push"]["setup"]
        errors = s.errors
    finally:
        s.close()
    checks = {
        "no Step up button, and the card says it waits": steps == 0 and "waits" in reason,
        "the backfilled day keeps its full sets": sets and all(n == 3 for n in sets),
        "a step can't be taken": decided is None and slot == {"surface": "counter"},
    }
    bad = [k for k, v in checks.items() if not v]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
        "steps %s; reason '%s'; sets %s; decide %s; setup %s" % (steps, reason[:80], sets, decided, slot), errors


@case("T31", "Settings: bodyweight direction no longer mentions a phase grade (R3-5)")
def t31(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        open_settings(s)
        note = s.ev("() => { const e = document.getElementById('set-weightdir'); return e ? e.parentElement.innerText.replace(/\\s+/g, ' ') : ''; }")
        errors = s.errors
    finally:
        s.close()
    ok = "phase grade" not in note and "phase report doesn't use it" in note
    return ok, "note '%s'" % note[-80:], errors


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--only", help="comma-separated case ids, e.g. S1,S5")
    args = ap.parse_args()
    only = {x.strip().upper() for x in args.only.split(",")} if args.only else None
    # A mistyped id would otherwise run nothing and exit 0, which reads as a pass.
    unknown = (only or set()) - {cid.upper() for cid, _, _ in CASES}
    if unknown:
        print("unknown case id: " + ", ".join(sorted(unknown)))
        return 2

    counts = {"PASS": 0, "FAIL": 0, "ERROR": 0}
    with sync_playwright() as pw:
        for cid, title, fn in CASES:
            if only and cid.upper() not in only:
                continue
            try:
                ok, measured, errors = fn(pw)
                if errors:
                    ok, measured = False, measured + " | " + "; ".join(errors)
                verdict = "PASS" if ok else "FAIL"
            except Exception as e:  # the case could not run: a harness defect
                verdict, measured = "ERROR", "%s: %s" % (type(e).__name__, str(e).splitlines()[0])
            counts[verdict] += 1
            print("%-4s %-5s %s -- %s" % (cid, verdict, title, measured), flush=True)
    print("\n%d pass, %d fail, %d error" % (counts["PASS"], counts["FAIL"], counts["ERROR"]))
    return 2 if counts["ERROR"] else (1 if counts["FAIL"] else 0)


if __name__ == "__main__":
    sys.exit(main())
