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

  · H1b, H6  the fitness plan's Stage 1 fixes (plans/PLAN-fitness-control-and-
             coverage.md): the weight you log is the weight that counts, and a
             swap badge that agrees with what you own. Their Node halves are
             in tools/check-training.js
  · K9       Stage 2's schema v5: the v4 fixture upgrades with its slots
             unchanged and the new equipment inferred (tools/fixtures/
             v4-midworkout.json). The sync half, K10, is in check-syncmerge.js
  · K11-K18  Stage 2's engine wiring (step 2.4): choose and keep, knuckles
             and the wrist pain swap, the dip-bar gap, exclusions in the
             workout and Swap, joint limits, custom sets/range and Hold, an
             option step, the weights you own. Step 2.5 gave K11, K12 and K17
             their controls, so they click; K14-K16 and K18 still call the
             engine to set up, and K19-K22 cover those controls by clicks
  · K19-K22  Stage 2's screens (step 2.5): Program (Hold, Sets & range,
             Exclude and the Excluded card), Today (Knuckles today, the
             holding copy), Settings (new equipment, weights, joint limits)
             and setup's equipment step
  · V3-V5, V8  Stage 3's sessions and schema v6 (step 3.4): a mini-session
             on a rest day moves no schedule or attendance, the finisher's
             picks and their evidence, the v5 fixture upgrading, and the
             report's own line for mini-sessions. The sync half, V6, is in
             check-syncmerge.js. Step 3.5 gave them their controls, so V3, V4
             and V8 now tick the finisher and press the Accessory session
             card's button; everything is clicks
  · V7, V9-V12  Stage 3's screens (step 3.5): the Muscles screen counts direct
             sets against a floor (V7), Program's Coverage card and its pins
             (V9), the finisher's tick, Remove, Swap and Add back (V10), the
             Accessory session card on all three Today screens (V11), and the
             badges over 22 groups (V12, a guard). V9-V12 are this step's
             own: Part F lists only V7
  · R3a-R3c  R3's findings: a pain flag on coverage work, no coverage record
             for an untouched pick, the Coverage row naming a joint limit
  · B1-B3    Stage 4's body map (step 4.2): tiers for a movement without
             authored phases, the 7-day heat map on Muscles (lit by direct
             sets, tapped by click and by key), and the map at 390 and 1920 px
             in two themes. B1 read the guide modal until step 4.8 made "How
             to do this" open the exercise page; it now reads the page
  · D3-D7    Stage 4's Exercises section (step 4.8): search and the muscle
             filter (D3), Train this in my slot / Exclude (D4), How to do this
             from a workout and the 14 animated pages (D5), 390 and 1920 px in
             two themes (D6), and offline from the service worker's cache (D7,
             the one case that serves the app over localhost, since a worker
             can't register from file://)
  · R4a-R4f  R4's findings: Train this on a left-out slot, Back after a page
             was left by the nav, a loaded movement's history and best, one
             render per row click, the nav bar's one row at 1440 px, and the
             muscle filter's screen-reader labels
  · Y6-Y8    plans/PLAN-yellow-dude.md step 1.2, schema v7: the v6 fixture
             (tools/fixtures/v6-midworkout.json) upgrades with the ankle
             anchor inferred from a Nordic session or slot, everything else
             byte-identical, and the Equipment check card naming the six
             (Y6); a v7 save opened by the v6 build, b0bae7a, extracted with
             git archive, is read-only (Y7); Settings and setup list the six
             (Y8). The sync half, Y5, is in check-syncmerge.js
  · Y9-Y10   R1's findings: a v5 card not yet shown survives the v7 upgrade,
             and a device that showed it gets only the six (Y9); every
             Settings equipment tile is one line (Y10)
  · Y11-Y14  plans/PLAN-yellow-dude.md step 4.1: the Skills tabs and their
             rung order, with the two new tracks, at 390 and 1440 px (Y11);
             a muscle-up reads 1-5 reps and a jump rope "for 30-60 s" on the
             page you reach by Train this in my slot (Y12); Conditioning pinned
             to today runs in the finisher and unpinned never does (Y13); the
             Hip Rotation routine is listed, played through and logged once (Y14)
  · Y15      the v7 fixture (tools/fixtures/v7-midworkout.json, written by the
             v7 build): a save that holds a Muscle-up slot, a pinned
             Conditioning slot, a finished session with Jump Rope in its
             finisher and a Pull workout half logged opens in this tree with
             every one of them intact (Y15)
  · Y16      R4's fixes: the Mobility routines and flexibility holds fill even
             rows at 1440 and 1920 px, and every per-side Hip Rotation step
             chimes at its midpoint

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
import subprocess
import sys
import tempfile
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

    def __init__(self, pw, now=None, seed=None, url=None):
        self.browser = pw.chromium.launch()
        self.ctx = self.browser.new_context(
            viewport=VIEWPORT, timezone_id=TZ, locale="en-IN", service_workers="block")
        self.ctx.route("http://**/*", lambda r: r.abort())
        self.ctx.route("https://**/*", lambda r: r.abort())
        self.pg = self.ctx.new_page()
        self.errors: list[str] = []
        self.absent: list[str] = []
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
        self.pg.goto(url or INDEX_URL)
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

    # A control a tree doesn't have (or one that isn't on screen) is recorded, not waited for: a "before" run
    # of a screen case then FAILs with numbers instead of timing out into an
    # ERROR, which would read as a harness defect. Controls that exist are
    # driven exactly as pg.click / fill / check / select_option would.
    def _first(self, sel):
        loc = self.pg.locator(sel).first
        if loc.count() == 0 or not loc.is_visible():
            self.absent.append(sel)
            return None
        return loc

    def tap(self, sel):
        loc = self._first(sel)
        if loc:
            loc.click()
        return bool(loc)

    def put(self, sel, value):
        loc = self._first(sel)
        if loc:
            loc.fill(value)
        return bool(loc)

    def tick(self, sel):
        loc = self._first(sel)
        if loc:
            loc.check()
        return bool(loc)

    def choose(self, sel, value):
        loc = self._first(sel)
        if loc:
            loc.select_option(value)
        return bool(loc)


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
        schema = s.ev("() => App.SCHEMA_VERSION")
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
            # The build's version, not a literal: a v3 save runs every migration since (K9 is v5's).
            "version %s" % schema: st["version"] == schema and schema >= 4,
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
            "saved at the build's version": json.loads(s.raw())["version"] == s.ev("() => App.SCHEMA_VERSION")
                and len(st["sessions"]) == 2,
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
    # Weighted Dip needs dip bars as well as a weight (F5, plan C5): the v3
    # fixture has none, so this user gets them, or the slot falls back to an
    # owned unloaded dip and there's no weight to log.
    dip6 = lambda v: (v["tiers"]["dip"].update(level=6), v["equipment"].update(dipBars=True))
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
# Lats target with no pull-up bar: 3 sets x 8 reps per row, perWeek split evenly
# across the template's day types, one row per day that names row or pull (a
# barless pull becomes the row it duplicates). Worked by hand, not read from the
# app: fullbody1 1 x 24; split5 upper + splitpull, 1 each; split6 splitpull x 2.
P9_LATS = {"fullbody3": 72, "fullbody2": 48, "upperlower": 48, "rotation": 42,
           "fullbody1": 24, "split5": 48, "split6": 48}


@case("P9", "Muscle-map targets follow the template, and check-muscle-map.js passes for each")
def p9(pw):
    import subprocess
    root = pathlib.Path(INDEX_URL[len("file://"):]).parent
    tool = subprocess.run(["node", str(root / "tools" / "check-muscle-map.js")], capture_output=True, text=True, cwd=str(root))
    tool_lines = [l for l in tool.stdout.splitlines() if re.search(r"^\s+\u2713 \w+\s+[\d.]+/wk", l)]
    got, errors, offered = {}, [], None
    for tpl in P9_LATS:
        s = Session(pw, now=ist(2026, 10, 1, 12, 0))
        try:
            onboard(s, template=tpl)
            read = lambda: s.ev("() => { const m = App.muscles.model(7).find(r => r.key === 'lats'); return m && m.target; }")
            got[tpl] = read()
            offered = offered or s.ev("() => App.engine.TEMPLATE_ORDER.slice()")
            if tpl == "upperlower":
                s.ev("() => { App.getState().equipment.pullupBar = true; App.saveState(); }")
                got["upperlower+bar"] = read()
            errors += s.errors
        finally:
            s.close()
    want = dict(P9_LATS, **{"upperlower+bar": 96})
    checks = {
        "check-muscle-map.js exits 0": tool.returncode == 0,
        # Counted against the app's own list, not a literal: a new template must
        # be audited by the tool and given a hand-worked value above.
        "it audits every template the app offers": offered is not None and len(tool_lines) == len(offered),
        "P9_LATS covers every template the app offers": offered is not None and set(P9_LATS) == set(offered),
        "lats target per template, no pull-up bar, and Upper with one": got == want,
    }
    bad = [k for k, v in checks.items() if not v]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
        "tool exit %s, %d template lines, app offers %s; lats %s, wanted %s" % (
            tool.returncode, len(tool_lines), offered, got, want), errors


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


# --- H1b, H6 · Stage 1 fixes (plans/PLAN-fitness-control-and-coverage.md, Part F) --
# Written before the fixes: each FAILs on the tree it was written against, with
# the numbers in Part F's "Before" column. The Node halves (H1a, H2a-c, H5, H9)
# are in tools/check-training.js.
@case("H1b", "Seeded 10 kg slot, 5 kg logged by clicks: the saved rx load (F1)")
def h1b(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        s.ev("""() => { const st = App.getState();
            st.equipment.dumbbells = true;
            st.training.slots.shoulder = Training.startOf('shoulder_e2_ohp',
                { loadKg: 10, goal: st.profile.goal, at: new Date().toISOString(), why: 'fixture' });
            App.saveState(); }""")
        open_today(s)
        pick_day(s, "push")
        s.pg.click("#begin-session")
        s.pg.wait_for_timeout(300)
        i = next((n for n, ex in enumerate(draft(s)["exercises"]) if ex.get("slot") == "shoulder"), None)
        if i is None:
            raise RuntimeError("the push day has no shoulder exercise")
        for j in range(len(draft(s)["exercises"][i]["sets"])):
            log_set(s, i, j, 12)
            wt = s.pg.locator('[data-wt="%d-%d"] input' % (i, j)).first
            wt.fill("5")
            wt.press("Tab")
        s.pg.click('[data-diff="%d"][data-d="moderate"]' % i)
        complete(s)
        ex = next((e for e in last_session(s)["exercises"]
                   if (e.get("rx") or {}).get("exerciseId") == "shoulder_e2_ohp"), None)
        if ex is None:
            raise RuntimeError("the saved session has no Dumbbell Overhead Press with an rx")
        weights = [st.get("weight") for st in ex["sets"]]
        if weights != [5] * len(weights):
            raise RuntimeError("the clicks did not log 5 kg on every set: %s" % weights)
        load = ex["rx"]["setup"].get("loadKg")
        return load == 5, "logged %s kg on every set; saved rx load %s kg (prescribed 10)" % (weights[0], load), s.errors
    finally:
        s.close()


@case("H6", "Dumbbells only: Goblet Squat's swap badge (F6)")
def h6(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        s.ev("""() => { const st = App.getState();
            Object.keys(st.equipment).forEach(k => { st.equipment[k] = false; });
            st.equipment.dumbbells = true; App.saveState(); }""")
        open_today(s)
        pick_day(s, "legs")
        s.pg.click('[data-pvswap="squat"]')
        s.pg.wait_for_timeout(300)
        row = s.pg.locator('[data-pvswapto="squat_e2_goblet"]')
        if not row.count():
            raise RuntimeError("Goblet Squat is not in the squat swap list")
        badge = row.locator(".badge").first.inner_text().strip()
        return badge.lower() == "ready", "Goblet Squat's badge reads '%s' (dumbbells owned, no kettlebells)" % badge, s.errors
    finally:
        s.close()


# --- K9 · schema v5 (plans/PLAN-fitness-control-and-coverage.md, C6) ----------
FIXTURE_V4 = ROOT / "tools" / "fixtures" / "v4-midworkout.json"
V5_TOKENS = ("bands", "parallettes", "dipBars", "lowBar")
V7_TOKENS = ("vest", "abWheel", "jumpRope", "box", "barbell", "nordicAnchor")


def v4_fixture() -> dict:
    """localStorage as the Stage 1 build (v4) left it, mid-workout: the two keys."""
    fx = json.loads(FIXTURE_V4.read_text())
    return {k: v for k, v in fx.items() if not k.startswith("_")}


def drop_dips(v4: dict):
    for x in v4["sessions"]:
        x["exercises"] = [e for e in x["exercises"] if e.get("key") != "dip_3"]


@case("K9", "v4 save -> v5: slots unchanged, new equipment inferred, the check queued")
def k9(pw):
    # Step 2.3 checks the migration and the record the Equipment check card
    # reads; step 2.5 adds the card itself (Program, once per device).
    # Each leg is the fixture with one change; `want` is what toV5 infers.
    # A slot alone infers a token only when its v4 stand-in was owned: without
    # a pull-up bar the dip slot was never trainable, and turning dip bars on
    # would change the workout.
    legs = [
        ("as saved", lambda v: None, {"dipBars": {"id": "dip_3", "from": "session"}}, True),
        ("no logged dip, bar owned", drop_dips, {"dipBars": {"id": "dip_3", "from": "slot"}}, True),
        ("no logged dip, no bar", lambda v: (drop_dips(v), v["equipment"].update(pullupBar=False)), {}, False),
    ]
    checks, shown, errors = {}, [], []
    for label, mutate, want, dip_owned in legs:
        fx = v4_fixture()
        v4 = fx[STORAGE_KEY]
        mutate(v4)
        s = Session(pw, now=ist(2026, 10, 1, 8, 0))
        try:
            seed_and_reload(s, fx)
            st = s.state()
            schema = s.ev("() => App.SCHEMA_VERSION")
            owned = s.ev("() => Training.owns(App.getState().equipment, 'dip_3')")
            eq, tr = st["equipment"], st.get("training", {})
            inferred = (tr.get("equipmentCheck") or {}).get("inferred")
            new_on = {k: eq.get(k) for k in V5_TOKENS}
            want_on = {k: k in want for k in V5_TOKENS}
            checks[label + ": version %s" % schema] = st["version"] == schema and schema >= 5
            checks[label + ": tokens"] = new_on == want_on and all(eq.get(k) == v4["equipment"][k] for k in v4["equipment"]) \
                and all(eq.get(k) is False for k in V7_TOKENS)     # v7's six: no Nordic in this fixture
            checks[label + ": the check records why"] = inferred == want
            checks[label + ": dip slot owned %s" % dip_owned] = owned is dip_owned
            if label == "as saved":
                twice = s.ev("""raw => { const a = App.migrate(JSON.parse(raw));
                    return JSON.stringify(a) === JSON.stringify(App.migrate(JSON.parse(JSON.stringify(a)))); }""",
                             json.dumps(v4))
                checks["slots unchanged"] = tr.get("slots") == v4["training"]["slots"]
                checks["history unchanged"] = all(st[k] == v4[k] for k in (
                    "sessions", "prs", "tiers", "phaseHistory", "currentPhase", "benchmarks", "flagsHistory"))
                checks["decisions, assessment unchanged"] = all(
                    tr.get(k) == v4["training"][k] for k in ("decisions", "assessment"))
                checks["v5 defaults"] = tr.get("exclusions") == {} and tr.get("limitations", 0) is None \
                    and tr.get("grip", 0) is None and st.get("equipmentLoads") == {}
                checks["migrated twice is identical"] = twice
                to_fitness(s)
                open_section(s, "program")
                shown_n = s.pg.locator("[data-eqcheck]").count()
                ticks = s.ev("() => Object.fromEntries([...document.querySelectorAll('[data-eqcheck-tok]')].map(b => [b.dataset.eqcheckTok, b.checked]))")
                s.tap("[data-eqcheck-ok]")
                s.pg.reload()
                s.pg.wait_for_timeout(700)
                to_fitness(s)
                open_section(s, "program")
                again_n = s.pg.locator("[data-eqcheck]").count()
                # v4 -> v7 runs both upgrades in one load, so one card names v5's four and v7's six
                checks["the card shows once, v5's four and v7's six listed"] = shown_n == 1 and ticks == dict({
                    "dipBars": True, "lowBar": False, "bands": False, "parallettes": False},
                    **{k: False for k in V7_TOKENS}) and again_n == 0
                shown.append("card: %d, ticks %s, after Looks right %d" % (shown_n, json.dumps(ticks), again_n))
            shown.append("%s: %s, dip owned %s" % (label, json.dumps(inferred), owned))
            errors += s.errors
        finally:
            s.close()
    bad = [k for k, ok in checks.items() if not ok]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + "; ".join(shown), errors


# --- K11-K18 · Stage 2's engine wiring (step 2.4) -----------------------------
# The engine calls (chooseExercise, setExcluded, setLimitations, setGrip,
# setHold, setCustom, decide "option") are named by the plan, so they are
# called directly; their Program and Settings controls are step 2.5's, which
# swaps these calls for clicks. Everything after the call is driven by
# clicks: the Today preview, Swap, the workout, the pain flag. A tree without
# a call returns its absence, so a "before" run FAILs with numbers.
def eng(s: Session, call: str, *args):
    """App.engine.<call>(...args), or the string 'absent' on a tree without it."""
    return s.ev("""a => { const f = App.engine[a.call];
        if (!f) return 'absent';
        const r = f.apply(App.engine, a.args);
        return r === undefined ? null : JSON.parse(JSON.stringify(r)); }""", {"call": call, "args": list(args)})


def preview_rows(s: Session) -> dict:
    """The Today preview's rows, slot -> {id, rx, text}, read from its DOM."""
    return s.ev("""() => { const out = {};
        document.querySelectorAll('#today-preview [data-pv-ex]').forEach(r => {
            const b = r.querySelector('[data-pvswap]'); if (!b) return;
            out[b.dataset.pvswap] = { id: r.dataset.pvEx, rx: JSON.parse(r.dataset.pvRx), text: r.innerText };
        }); return out; }""")


def preview_note(s: Session, slot: str) -> str:
    return s.ev("""slot => { const b = document.querySelector('#today-preview [data-pvswap="' + slot + '"]');
        const row = b && b.closest('[data-pv-ex]'), n = row && row.nextElementSibling;
        return n && n.hasAttribute('data-pv-note') ? n.innerText : ''; }""", slot)


def push_today(s: Session) -> dict:
    open_today(s)
    pick_day(s, "push")
    return preview_rows(s).get("push") or {}


def onboard_push(pw, at: str, now=None) -> Session:
    s = Session(pw, now=now or ist(2026, 10, 1, 12, 0))
    onboard(s, {"push": at})
    return s


@case("K11", "Choose and keep: Archer Push-up in the push slot persists and the workout trains it")
def k11(pw):
    s = onboard_push(pw, "push_2")
    try:
        open_section(s, "program")
        s.tap('[data-pg-change="push"]')
        s.pg.wait_for_timeout(200)
        panel = '[data-pg-panel="push"]'
        # a skill attempt is kind "skill"; the id prefix isn't one (the planche push-up is reps)
        skills = s.pg.locator(panel + ' [data-pick]').evaluate_all(
            "els => els.filter(e => TRAINING_DATA.EXERCISES[e.dataset.pick].kind === 'skill').length")
        groups = s.ev("() => [...document.querySelectorAll('[data-pg-panel=\"push\"] .field__label')].map(e => e.textContent.trim())")
        s.tap(panel + ' [data-pick="push_5"]')
        s.tap(panel + " [data-pk-use]")
        s.pg.wait_for_timeout(300)
        s.pg.reload()
        s.pg.wait_for_timeout(700)
        to_fitness(s)
        row = push_today(s)
        s.tap("#begin-session")
        s.pg.wait_for_timeout(300)
        trained = [e["id"] for e in draft(s)["exercises"] if e.get("slot") == "push"]
        st = s.state()
        rec = st["training"]["slots"]["push"]
        refused = eng(s, "chooseExercise", "push", "skill_planche_1")
        checks = {
            "slot is Archer after a reload": rec.get("exerciseId") == "push_5" and rec.get("why") == "chosen by you",
            "preview and workout train it": row.get("id") == "push_5" and trained == ["push_5"],
            "the Progress level follows": st["tiers"]["push"]["level"] == 5,
            "the picker lists no skill attempt": skills == 0,
            "grouped as path, branches, weighted": [g for g in groups if g in ("On your path", "Branches", "Weighted")] == ["On your path", "Branches", "Weighted"],
            "a skill is refused inline": isinstance(refused, dict) and bool(refused.get("error")),
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "slot %s (%s); preview %s; workout %s; level %s; %d skills listed; groups %s; skill call %r" % (
                rec.get("exerciseId"), rec.get("why"), row.get("id"), trained,
                st["tiers"]["push"]["level"], skills, groups[:5], refused), s.errors
    finally:
        s.close()


def push_sets_and_complete(s: Session, reps=8, flag=None):
    """Begin the push day, log every push set, rate it, optionally pain-flag
    it by clicks, complete. Returns the saved push exercise."""
    open_today(s)
    pick_day(s, "push")
    s.pg.click("#begin-session")
    s.pg.wait_for_timeout(300)
    i = next(n for n, ex in enumerate(draft(s)["exercises"]) if ex.get("slot") == "push")
    if flag:
        s.pg.click('[data-flag="%d"]' % i)
        s.pg.select_option("#flag-bp-%d" % i, flag[0])
        s.pg.select_option("#flag-sev-%d" % i, flag[1])
        s.pg.click("#flag-apply-%d" % i)
        s.pg.wait_for_timeout(300)
    for j in range(len(draft(s)["exercises"][i]["sets"])):
        log_set(s, i, j, reps)
    s.pg.click('[data-diff="%d"][data-d="moderate"]' % i)
    complete(s)
    return next(e for e in last_session(s)["exercises"] if e.get("slot") == "push")


@case("K12", "Push-ups on knuckles: the saved rx says knuckles, no pain flag; a wrist pain swap is knuckles, flagged")
def k12(pw):
    s = onboard_push(pw, "push_2")
    try:
        open_section(s, "program")
        s.tap('[data-grip-set="knuckles"]')
        s.pg.wait_for_timeout(300)
        a = push_sets_and_complete(s)
        flags_a = len(s.state()["flagsHistory"])
        slot_grip = s.state()["training"]["slots"]["push"].get("setup", {}).get("grip")
        errors = list(s.errors)
    finally:
        s.close()
    s = onboard_push(pw, "push_2")
    try:
        b = push_sets_and_complete(s, flag=("wrist", "mild"))
        flags_b = len(s.state()["flagsHistory"])
        errors += s.errors
    finally:
        s.close()
    grip = lambda e: ((e.get("rx") or {}).get("setup") or {}).get("grip")
    checks = {
        "standing knuckles: rx grip knuckles": grip(a) == "knuckles" and slot_grip == "knuckles",
        "standing knuckles: no pain flag": flags_a == 0 and not (a.get("flag") or {}).get("bodyPart"),
        "wrist pain swap: same exercise on knuckles": b.get("key") == "push_2" and grip(b) == "knuckles",
        "wrist pain swap: still flagged": flags_b == 1 and (b.get("flag") or {}).get("bodyPart") == "wrist",
    }
    bad = [k for k, ok in checks.items() if not ok]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
        "knuckles: %s grip %s, slot grip %s, %d flags; pain swap: %s (%s) grip %s, %d flags" % (
            a.get("key"), grip(a), slot_grip, flags_a,
            b.get("key"), b.get("name"), grip(b), flags_b), errors


@case("K13", "Doorway bar only, Two-Chair Dip ready: no Parallel Bar Dip, says it needs dip bars")
def k13(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s, {"dip": "dip_alt_twochair"})
        s.ev("""() => { const st = App.getState();
            Object.keys(st.equipment).forEach(k => { st.equipment[k] = false; });
            st.equipment.pullupBar = true; App.saveState(); }""")
        for d in (1, 3):
            s.set_time(ist(2026, 10, d, 12, 0))
            workout_at_top(s, "push", "dip", 12)
        s.set_time(ist(2026, 10, 5, 12, 0))
        open_today(s)
        pick_day(s, "push")
        reasons = s.ev("() => [...document.querySelectorAll('[data-pv-reason]')].map(e => e.innerText.split('\\n')[0])")
        dip = [r for r in reasons if r.startswith("Ready")]
        steps = s.pg.locator('[data-decide="dip"][data-choice="step"]').count()
        rec = s.ev("() => App.engine.recommendFor('dip')")
        ok = steps == 0 and rec["step"] is None and any("Parallel Bar Dip needs dip bars" in r for r in dip)
        return ok, "dip reason %s; %d Step up buttons; step %s" % (dip[:1], steps, rec["step"]), s.errors
    finally:
        s.close()


@case("K14", "Exclude the current exercise: the workout falls back; Swap hides it behind Show excluded")
def k14(pw):
    s = onboard_push(pw, "push_2")
    try:
        got = eng(s, "setExcluded", "push_2", "excluded")
        row = push_today(s)
        note = preview_note(s, "push")
        s.pg.click('[data-pvswap="push"]')
        s.pg.wait_for_timeout(300)
        listed = s.pg.locator('[data-pvswapto="push_2"]').count()
        shown = click_if(s, "[data-pvswap-excluded]")
        after = s.pg.locator('[data-pvswapto="push_2"]')
        badge = after.locator(".badge").first.inner_text().strip().lower() if after.count() else ""
        if after.count():
            after.click()
            s.pg.wait_for_timeout(300)
        swapped = preview_rows(s).get("push") or {}
        eng(s, "setExcluded", "push_2", "none")
        back = push_today(s)
        rec = s.state()["training"]["exclusions"].get("push_2") or {}
        checks = {
            "falls back to Incline Push-up": row.get("id") == "push_incline" and "exclu" in note.lower(),
            "Swap hides it": listed == 0 and shown,
            "Show excluded lists it, marked": badge == "excluded",
            "a one-off swap to it still works": swapped.get("id") == "push_2" and "swapped" in swapped.get("text", "").lower(),
            "included again: back to Push-up, record re-stamped": back.get("id") == "push_2" and rec.get("state") == "none",
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "call %s; excluded: preview %s, note %r; listed %d, shown %s, badge %r; swap %s; included: %s, record %s" % (
                "absent" if got == "absent" else "ok", row.get("id"), note[:60], listed, shown, badge,
                swapped.get("id"), back.get("id"), rec.get("state")), s.errors
    finally:
        s.close()


@case("K15", "Wrists: avoid falls back, knuckles bring Push-up back, Allow anyway too; careful only warns")
def k15(pw):
    s = onboard_push(pw, "push_2")
    try:
        got = eng(s, "setLimitations", {"wrist": "avoid"})
        avoid = push_today(s)
        eng(s, "setGrip", "push", "knuckles")
        knuck = push_today(s)
        eng(s, "setGrip", "push", "palms")
        palms = push_today(s)
        eng(s, "setExcluded", "push_2", "allowed")
        anyway = push_today(s)
        eng(s, "setExcluded", "push_2", "none")
        eng(s, "setLimitations", {"wrist": "careful"})
        careful = push_today(s)
        s.pg.click('[data-pvswap="push"]')
        s.pg.wait_for_timeout(300)
        cur = s.pg.locator('[data-pvswapto="push_2"] .badge').all_inner_texts()
        bad_joint = eng(s, "setLimitations", {"toes": "avoid"})
        lim = s.state()["training"]["limitations"] or {}
        checks = {
            "avoid: falls back": avoid.get("id") == "push_incline",
            "knuckles: Push-up on knuckles": knuck.get("id") == "push_2" and knuck["rx"]["setup"].get("grip") == "knuckles",
            "palms again: falls back": palms.get("id") == "push_incline",
            "Allow anyway: Push-up": anyway.get("id") == "push_2",
            "careful: Push-up, marked in Swap": careful.get("id") == "push_2" and any("careful" in t.lower() for t in cur),
            "an unknown joint is refused, nothing written": isinstance(bad_joint, dict) and bool(bad_joint.get("error"))
                and lim.get("wrist") == "careful" and "toes" not in lim,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "call %s; avoid %s; knuckles %s %s; palms %s; allowed %s; careful %s, badges %s; toes %r" % (
                "absent" if got == "absent" else "ok", avoid.get("id"), knuck.get("id"),
                (knuck.get("rx") or {}).get("setup", {}).get("grip"), palms.get("id"), anyway.get("id"),
                careful.get("id"), cur, bad_joint), s.errors
    finally:
        s.close()


@case("K16", "Custom 4 x 8-10 and Hold: the preview, +1 set, a goal change, an inline error, no Step up")
def k16(pw):
    s = onboard_push(pw, "push_2")
    try:
        got = eng(s, "setCustom", "push", {"sets": 4, "range": [8, 10]})
        std = push_today(s)
        s.pg.click('[data-volmode="extended"]')
        s.pg.wait_for_timeout(200)
        plus = preview_rows(s).get("push") or {}
        s.pg.click('[data-volmode="standard"]')
        err = eng(s, "setCustom", "push", {"range": [8, 9]})
        s.ev("() => { App.engine.setGoal('strength'); App.saveState(); }")
        rng = s.state()["training"]["slots"]["push"].get("range")
        eng(s, "setHold", "push", True)
        rx_sessions(s, "push", ["2026-09-26", "2026-09-28"], [10, 10, 10, 10], "moderate")
        push_today(s)
        steps = s.pg.locator('[data-decide="push"][data-choice="step"]').count()
        why = s.ev("() => (App.engine.recommendFor('push') || {}).why")
        eng(s, "setHold", "push", False)
        push_today(s)
        steps_off = s.pg.locator('[data-decide="push"][data-choice="step"]').count()
        checks = {
            "preview 4 x 8-10": "4 × 8–10" in std.get("text", ""),
            "+1 set adds to it": "5 × 8–10" in plus.get("text", ""),
            "a bad range is refused inline": isinstance(err, dict) and "at least 2 above" in (err.get("error") or ""),
            "the custom range survives a goal change": rng == [8, 10],
            "held: no Step up": steps == 0 and why == "hold",
            "unheld: Step up": steps_off == 1,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "call %s; preview %r; +1 %r; error %r; range after Strength %s; held %d steps (%s); unheld %d" % (
                "absent" if got == "absent" else "ok", re.findall(r"\d+ × [\d–]+", std.get("text", ""))[:1],
                re.findall(r"\d+ × [\d–]+", plus.get("text", ""))[:1], err, rng, steps, why, steps_off), s.errors
    finally:
        s.close()


@case("K17", "Decline at the top: step into Archer Push-up as an option, stored as an option decision")
def k17(pw):
    s = onboard_push(pw, "push_4")
    try:
        rx_sessions(s, "push", ["2026-09-26", "2026-09-28"], [12, 12, 12], "moderate")
        wrong = eng(s, "decide", "push", "option", "skill_planche_1")
        push_today(s)
        btns = s.ev("() => [...document.querySelectorAll('[data-decide=\"push\"][data-choice=\"option\"]')].map(b => b.dataset.to + ': ' + b.innerText.trim())")
        s.tap('[data-decide="push"][data-choice="option"][data-to="push_5"]')
        s.pg.wait_for_timeout(300)
        st = s.state()
        rec = st["training"]["slots"]["push"]
        dec = [d for d in st["training"]["decisions"].values() if d.get("choice") == "option"]
        steps = s.ev("() => App.evaluation.evaluate(App.getState()).performance.steps")
        row = push_today(s)
        checks = {
            "a skill is not an option": wrong is None,
            "one button, Step into Archer Push-up": btns == ["push_5: Step into Archer Push-up"],
            "slot is Archer, stamped": rec.get("exerciseId") == "push_5" and bool(rec.get("acceptedAt")),
            "stored as an option decision": len(dec) == 1 and dec[0].get("to") == "push_5",
            "the level and the workout follow": st["tiers"]["push"]["level"] == 5 and row.get("id") == "push_5",
            "the period report counts it as a step": steps == 1,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "skill %r; buttons %s; slot %s (%s); decisions %s; level %s; preview %s; report steps %s" % (
                wrong, btns, rec.get("exerciseId"), rec.get("why"), dec, st["tiers"]["push"]["level"], row.get("id"), steps), s.errors
    finally:
        s.close()


@case("K18", "Weighted Dip at 10 kg, dumbbells listed as 10 and 15 kg: the step is 15 kg")
def k18(pw):
    def dip6(v):
        v["tiers"]["dip"].update(level=6)
        v["equipment"].update(dipBars=True)
        v["equipmentLoads"] = {"dumbbells": {"mode": "fixed", "kg": [10, 15]}}
    reasons, steps, slot, errors, _ = card_after_two(pw, dip6, "push", "dip", kg=10)
    ready = [r for r in reasons if r.startswith("Ready")]
    ok = steps == 1 and any("15 kg" in r for r in ready)
    return ok, "slot load %s; reason %s; %d Step up buttons" % (
        (slot or {}).get("setup", {}).get("loadKg"), ready[:1], steps), errors


# --- K19-K22 · Stage 2's screens (step 2.5), all by clicks ---------------------
def pg_text(s: Session, sel: str) -> str:
    return s.ev("sel => { const e = document.querySelector(sel); return e ? e.innerText : ''; }", sel)


@case("K19", "Program: Hold, Sets & range, and Exclude from the picker, each by its own control")
def k19(pw):
    s = onboard_push(pw, "push_2")
    try:
        open_section(s, "program")
        # Hold
        s.tap('[data-pg-hold="push"]')
        s.pg.wait_for_timeout(300)
        held = s.state()["training"]["slots"]["push"].get("hold")
        status = pg_text(s, '[data-pg-slot="push"] [data-pg-status]')
        btn = pg_text(s, '[data-pg-hold="push"]')
        s.tap('[data-pg-hold="push"]')
        s.pg.wait_for_timeout(300)
        unheld = s.state()["training"]["slots"]["push"].get("hold")
        # Sets & range: a bad range is an inline sentence, a good one is saved
        s.tap('[data-pg-custom="push"]')
        s.put('[data-cu="sets"]', "4")
        s.put('[data-cu="lo"]', "8")
        s.put('[data-cu="hi"]', "9")
        s.tap("[data-cu-save]")
        s.pg.wait_for_timeout(300)
        err = pg_text(s, "[data-pg-err]")
        wrote_bad = s.state()["training"]["slots"]["push"].get("custom")
        s.put('[data-cu="hi"]', "10")
        s.tap("[data-cu-save]")
        s.pg.wait_for_timeout(300)
        slot = s.state()["training"]["slots"]["push"]
        row = pg_text(s, '[data-pg-slot="push"]')
        # Exclude the exercise the slot trains, from the picker
        s.tap('[data-pg-change="push"]')
        s.tap('[data-pk-exclude="push_2"]')
        s.pg.wait_for_timeout(300)
        preselected = s.ev("() => { const b = document.querySelector('[data-pg-panel=\"push\"] .swap-opt.is-current'); return b ? b.dataset.pick : null; }")
        s.tap('[data-pick="push_2"]')
        s.tap("[data-pk-use]")
        s.pg.wait_for_timeout(300)
        refuse = pg_text(s, "[data-pg-err]")
        excl = s.state()["training"]["exclusions"].get("push_2") or {}
        listed = pg_text(s, "#pg-excluded")
        s.tap('[data-pk-cancel]')
        s.pg.wait_for_timeout(300)
        s.tap('[data-excl-undo="push_2"]')
        s.pg.wait_for_timeout(300)
        back = s.state()["training"]["exclusions"].get("push_2") or {}
        after = pg_text(s, "#pg-excluded")
        checks = {
            "Hold stamps the slot and the row says so": held is True and "step-ups paused" in status.lower() and btn.strip() == "Resume step-ups",
            "Resume clears it": not unheld,
            "a range under 2 apart is an inline sentence, nothing written": "at least 2 above" in err and not wrote_bad,
            "4 x 8-10 is saved, the row shows it": slot.get("sets") == 4 and slot.get("range") == [8, 10] and "4 × 8–10" in row,
            "excluding the current movement preselects the one it falls back to": preselected == "push_incline",
            "choosing an excluded movement says why": "excluded list" in refuse,
            "the Excluded card lists it": "Push-up" in listed and excl.get("state") == "excluded",
            "Include again re-stamps, never deletes": back.get("state") == "none" and "None." in after,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "hold %s, status %r, button %r, cleared %s; error %r; slot %s x %s; preselected %s; refusal %r; card %r -> %r" % (
                held, status, btn.strip(), unheld, err, slot.get("sets"), slot.get("range"), preselected,
                refuse[:50], listed.replace("\n", " ")[:60], after.replace("\n", " ")[-12:]), s.errors
    finally:
        s.close()


@case("K20", "Today: Knuckles today builds the workout on knuckles; a careful wrist says why; a held slot says so")
def k20(pw):
    s = onboard_push(pw, "push_2")
    try:
        row = push_today(s)
        before = row.get("rx", {}).get("setup", {}).get("grip")
        s.tick('[data-knuckles-today="push"]')
        s.pg.wait_for_timeout(300)
        on = preview_rows(s).get("push") or {}
        text_on = on.get("text", "")
        # a careful wrist says why knuckles help
        eng(s, "setLimitations", {"wrist": "careful"})
        careful_row = push_today(s)
        hint = pg_text(s, "[data-pv-grip]")
        # a held slot at the top: the card says holding and offers nothing
        eng(s, "setLimitations", {})
        eng(s, "setHold", "push", True)
        rx_sessions(s, "push", ["2026-09-26", "2026-09-28"], [12, 12, 12], "moderate")
        push_today(s)
        reason = s.ev("() => [...document.querySelectorAll('[data-pv-reason]')].map(e => e.innerText.split('\\n')[0])[0] || ''")
        steps = s.pg.locator('[data-decide="push"]').count()
        # the workout itself, for one session only
        s.tick('[data-knuckles-today="push"]')
        s.tap("#begin-session")
        s.pg.wait_for_timeout(300)
        d = draft(s)
        trained = next(e for e in d["exercises"] if e.get("slot") == "push")
        block = pg_text(s, '[data-block="%d"] .exq__meta' % d["exercises"].index(trained))
        standing = s.state()["training"].get("grip")
        checks = {
            "palms until ticked": before in (None, "palms"),
            "ticking builds the same movement on knuckles": on.get("id") == "push_2" and (on.get("rx", {}).get("setup", {}) or {}).get("grip") == "knuckles" and "knuckles" in text_on.lower(),
            "a careful wrist says why knuckles help": "wrist" in hint.lower() and careful_row.get("id") == "push_2",
            "held: the card says holding, no buttons": reason.startswith("Holding") and steps == 0,
            "the workout's exercise line says knuckles": "knuckles" in block.lower() and (trained.get("rx", {}).get("setup", {}) or {}).get("grip") == "knuckles",
            "today only: no standing grip written": not standing,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "grip before %s, ticked %s; hint %r; held reason %r with %d buttons; line %r; standing %s" % (
                before, (on.get("rx", {}).get("setup", {}) or {}).get("grip"), hint.strip()[:70], reason[:70], steps,
                block.strip()[:50], standing), s.errors
    finally:
        s.close()


@case("K21", "Settings: the four new items, weights you have, joint limits; a bad weight list stays inline")
def k21(pw):
    s = onboard_push(pw, "push_2")
    try:
        s.tap("#btn-settings")
        s.pg.wait_for_timeout(300)
        items = s.ev("() => [...document.querySelectorAll('#set-equip [data-equip]')].map(b => b.dataset.equip)")
        # a fixed dumbbell list that is not a list of numbers: refused inline, nothing saved
        s.tap('[data-w-mode="dumbbells"] [data-wm="fixed"]')
        s.put("#set-w-dumbbells-list", "five, ten")
        s.tap("#btn-settings-save")
        s.pg.wait_for_timeout(300)
        err = pg_text(s, "#set-err")
        open_still = s.pg.locator("#modal-settings.is-open, #modal-settings[aria-hidden=false]").count() or \
            s.ev("() => getComputedStyle(document.getElementById('modal-settings')).display !== 'none' && document.getElementById('set-err').hidden === false")
        wrote = s.state().get("equipmentLoads")
        # a real list, a wrist limit, dip bars on
        s.put("#set-w-dumbbells-list", "12.5, 5, 7.5, 5")
        s.choose('[data-limit="wrist"]', "avoid")
        s.choose('[data-limit="knee"]', "careful")
        s.tap('#set-equip [data-equip="dipBars"]')
        s.tap("#btn-settings-save")
        s.pg.wait_for_timeout(400)
        st = s.state()
        loads, lim, eq = st.get("equipmentLoads"), st["training"].get("limitations") or {}, st["equipment"]
        # reopened, the form shows what was saved
        s.tap("#btn-settings")
        s.pg.wait_for_timeout(300)
        shown = s.ev("""() => { const v = q => { const e = document.querySelector(q); return e ? e.value : null; };
            return { list: v('#set-w-dumbbells-list'), wrist: v('[data-limit=wrist]'), knee: v('[data-limit=knee]') }; }""")
        s.pg.keyboard.press("Escape")
        # an untouched kettlebell form wrote no record; the avoid took Push-up off the plan
        row = push_today(s)
        checks = {
            "equipment lists the four new items": all(k in items for k in V5_TOKENS),
            "a bad weight list is an inline sentence": "kilograms" in err,
            "and nothing was saved": not wrote,
            "the real list is sorted and de-duplicated": (loads or {}).get("dumbbells") == {"mode": "fixed", "kg": [5, 7.5, 12.5]},
            "an untouched implement writes no record": "kettlebells" not in (loads or {}),
            "limits are saved, stamped": lim.get("wrist") == "avoid" and lim.get("knee") == "careful" and bool(lim.get("at")),
            "dip bars are on": eq.get("dipBars") is True,
            "reopened, the form shows them": shown == {"list": "5, 7.5, 12.5", "wrist": "avoid", "knee": "careful"},
            "avoid wrist takes Push-up off the plan": row.get("id") == "push_incline",
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "items %s; error %r; loads %s; limits %s; form %s; push now %s" % (
                [i for i in items if i in V5_TOKENS], err[:50], json.dumps(loads), json.dumps(lim), shown, row.get("id")), s.errors
    finally:
        s.close()


@case("K22", "Setup lists the four new items; picking one reaches the saved equipment")
def k22(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        to_fitness(s)
        for _ in range(3):
            s.tap('#onb-body [data-onb="next"]')
        items = s.ev("() => [...document.querySelectorAll('#onb-body [data-equip]')].map(b => b.dataset.equip)")
        s.tap('#onb-body [data-equip="dipBars"]')
        s.tap('#onb-body [data-equip="bands"]')
        s.tap('#onb-body [data-onb="next"]')
        s.tap('#onb-body [data-onb="next"]')
        s.tap('[data-onb="finish"]')
        s.pg.wait_for_timeout(400)
        eq = s.state()["equipment"]
        ok = all(k in items for k in V5_TOKENS) and eq.get("dipBars") is True and eq.get("bands") is True \
            and eq.get("parallettes") is False and eq.get("lowBar") is False
        return ok, "items %s; saved dipBars %s bands %s parallettes %s lowBar %s" % (
            [i for i in items if i in V5_TOKENS], eq.get("dipBars"), eq.get("bands"), eq.get("parallettes"), eq.get("lowBar")), s.errors
    finally:
        s.close()


# --- V3-V5, V8 · Stage 3's sessions and schema v6 (step 3.4) ------------------
# The finisher toggle and the mini-session's entry points are step 3.5's, so
# these cases set prefs.finisher and start a mini-session the way those
# controls will: engine.buildWorkout("mini") into the draft key. Every set,
# rating and Complete after that is a click. A tree without the builder
# builds whatever it builds, and the case FAILs on what it measures.
FIXTURE_V5 = ROOT / "tools" / "fixtures" / "v5-midworkout.json"
COVERAGE_SLOTS = "() => Object.keys(TRAINING_DATA.SLOTS).filter(k => TRAINING_DATA.SLOTS[k].coverage)"


def v5_fixture() -> dict:
    """localStorage as the Stage 2 build (v5) left it, mid-workout: the two keys."""
    fx = json.loads(FIXTURE_V5.read_text())
    return {k: v for k, v in fx.items() if not k.startswith("_")}


def mini_workout(s: Session, reps=10, n=4) -> dict:
    """Start a mini-session with the Accessory session card (n from its
    select, 4 by default), log every set at `reps`, rate each Just right and
    complete, by clicks. Returns the draft; with no card, an empty one."""
    open_today(s)
    if n != 4:
        s.choose("[data-mini-n]", str(n))
    s.tap("[data-mini-start]")
    s.pg.wait_for_timeout(300)
    w = draft(s)
    if not w:
        return {"exercises": [], "warmup": [], "cooldown": []}
    for i, ex in enumerate(w["exercises"]):
        for j in range(len(ex["sets"])):
            log_set(s, i, j, reps)
        s.pg.click('[data-diff="%d"][data-d="moderate"]' % i)
    complete(s)
    return w


def preview_order(s: Session) -> list:
    """The Today preview's rows in screen order, as [slot, exercise id]."""
    return s.ev("""() => [...document.querySelectorAll('#today-preview [data-pv-ex]')].map(r => {
        const b = r.querySelector('[data-pvswap]'); return [b ? b.dataset.pvswap : null, r.dataset.pvEx]; })""")


def stat_tile(s: Session, label: str) -> str:
    return s.ev("""l => { const t = [...document.querySelectorAll('.stat')].find(e =>
        e.querySelector('.stat__label').innerText.trim().toLowerCase() === l);
        return t ? t.querySelector('.stat__value').innerText.trim() : null; }""", label.lower())


@case("V3", "Mini-session on a rest day: still a rest day, next main day and attendance unchanged; streak and Hub habit count it")
def v3(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        one_set_workout(s)                          # Thu 1 Oct: Push, so Fri rests
        s.set_time(ist(2026, 10, 2, 12, 0))
        read = """() => { const e = App.engine, st = App.getState(), ev = App.evaluation.evaluate(st);
            Hub.gamify.invalidate();
            return { rest: e.restDayInfo(st).isRest, next: e.recommendedDayType(), nextKey: e.nextSession(st).key,
                     attended: ev.sampleSize, planned: ev.expected, streak: e.liveStreak(st),
                     habit: !!Hub.gamify.CATEGORIES.fitness.done('2026-10-02') }; }"""
        a = s.ev(read)
        w = mini_workout(s)
        b = s.ev(read)
        week = stat_tile(s, "This week")             # complete() lands on the dashboard
        open_today(s)
        rest_card = n_visible(s, "#rest-train-anyway")
        sess = last_session(s)
        cov = s.ev(COVERAGE_SLOTS)
        checks = {
            "still a rest day, on the screen too": a["rest"] and b["rest"] and rest_card == 1,
            "next main day unchanged": b["next"] == a["next"] == "pull" and b["nextKey"] == a["nextKey"] == "2026-10-03",
            "attendance unchanged": (b["attended"], b["planned"]) == (a["attended"], a["planned"]) and b["attended"] == 1 and week == "1",
            "saved as a mini-session of coverage work": sess.get("type") == "mini" and sess.get("kind") == "mini"
                and sess.get("dayKey") == "2026-10-02" and len(sess["exercises"]) == 4
                and all(e.get("slot") in cov for e in sess["exercises"]),
            "a short warm-up and cool-down": 0 < len(w.get("warmup", [])) < 5 and 0 < len(w.get("cooldown", [])) < 5,
            "the streak counts it": b["streak"] == a["streak"] + 1,
            "the Hub's fitness habit counts it": not a["habit"] and b["habit"],
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "before %s; after %s; This week %r; rest card %d; saved type %s kind %s, %d exercises %s; warm-up %d, cool-down %d" % (
                json.dumps(a), json.dumps(b), week, rest_card, sess.get("type"), sess.get("kind"), len(sess["exercises"]),
                [e.get("slot") for e in sess["exercises"]], len(w.get("warmup", [])), len(w.get("cooldown", []))), s.errors
    finally:
        s.close()


def finisher_session(s: Session, day: str) -> dict:
    """Begin `day` with the finisher on; main sets at 5, every finisher set at
    the top of its range, each rated Just right; complete. Returns the draft."""
    open_today(s)
    pick_day(s, day)
    s.pg.click("#begin-session")
    s.pg.wait_for_timeout(300)
    w = draft(s)
    for i, ex in enumerate(w["exercises"]):
        top = ex["rx"]["range"][1] if ex.get("finisher") else 5
        for j in range(len(ex["sets"])):
            log_set(s, i, j, top)
        s.pg.click('[data-diff="%d"][data-d="moderate"]' % i)
    complete(s)
    return w


@case("V4", "Finisher on: four coverage picks after the main slots; two sessions at the top -> ready")
def v4(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        cov = s.ev(COVERAGE_SLOTS)
        open_today(s)
        pick_day(s, "push")
        off = preview_order(s)
        s.tick("[data-finisher]")
        s.pg.wait_for_timeout(200)
        on = preview_order(s)
        w1 = finisher_session(s, "push")
        st = s.state()
        made = {k: v.get("why") for k, v in st["training"]["slots"].items() if k in cov}
        saved = [e.get("finisher") for e in st["sessions"][-1]["exercises"]]
        pinned = eng(s, "setPins", "curl", [6])     # Saturday, so curl is picked again
        s.set_time(ist(2026, 10, 3, 12, 0))
        w2 = finisher_session(s, "pull")
        rec = s.ev("() => JSON.parse(JSON.stringify(App.engine.recommendFor('curl')))") or {}
        fin1 = [e for e in w1["exercises"] if e.get("finisher")]
        fin2 = [e for e in w2["exercises"] if e.get("finisher")]
        checks = {
            "main slots unchanged by the finisher": on[:len(off)] == off and all(x[0] not in cov for x in off),
            "four coverage picks after them": len(on) == len(off) + 4 and all(x[0] in cov for x in on[len(off):]),
            "the workout is the preview": [[e["slot"], e["id"]] for e in w1["exercises"]] == on,
            "picks at the base set count": len(fin1) == 4 and all(len(e["sets"]) == 3 for e in fin1),
            "saved as finisher work": saved[-4:] == [True] * 4 and not any(saved[:-4]),
            "each picked slot gets its record": sorted(made) == sorted(e["slot"] for e in fin1)
                and set(made.values()) == {"added for coverage"},
            "a pin puts curl first": isinstance(pinned, dict) and not pinned.get("error")
                and [e["slot"] for e in fin2][:1] == ["curl"] and len(fin2) == 4,
            "two sessions at the top: ready": rec.get("action") == "ready" and len(rec.get("history") or []) == 2,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "off %s; on +%s; finisher sets %s; records %s; pin %s; 3 Oct picks %s; curl %s/%s, %d comparable" % (
                [x[0] for x in off], [x[0] for x in on[len(off):]], [len(e["sets"]) for e in fin1], made, pinned,
                [e["slot"] for e in fin2], rec.get("action"), rec.get("why"), len(rec.get("history") or [])), s.errors
    finally:
        s.close()


@case("V5", "v5 fixture -> v6: the main program unchanged, no coverage slot until one is picked")
def v5(pw):
    fx = v5_fixture()
    v5s = fx[STORAGE_KEY]
    s = Session(pw, now=ist(2026, 10, 1, 8, 0))
    try:
        seed_and_reload(s, fx)
        st = s.state()
        schema = s.ev("() => App.SCHEMA_VERSION")
        cov = s.ev(COVERAGE_SLOTS)
        tr = st["training"]
        twice = s.ev("""raw => { const a = App.migrate(JSON.parse(raw));
            return JSON.stringify(a) === JSON.stringify(App.migrate(JSON.parse(JSON.stringify(a)))); }""", json.dumps(v5s))
        to_fitness(s)
        open_section(s, "program")
        open_today(s)
        w = draft(s)
        complete(s)                                 # the Legs draft, finisher off
        after = s.state()
        checks = {
            "version %s" % schema: st["version"] == schema and schema >= 6,
            "v6 defaults: finisher off, no pins": st["prefs"].get("finisher") == "off" and tr.get("pins") == {},
            # weeklyDays is v8's default, added unset; Y6 checks the same on the v6 fixture
            "other prefs unchanged": {k: v for k, v in st["prefs"].items() if k not in ("finisher", "weeklyDays")} == v5s["prefs"],
            "v8 leaves the weekly target unset": schema < 8 or st["prefs"].get("weeklyDays", "absent") is None,
            "slots unchanged": tr["slots"] == v5s["training"]["slots"],
            # equipmentCheck and v7's six equipment keys are the v6 -> v7 step's, which Y6 checks
            "decisions, exclusions, limits, grip unchanged": all(tr.get(k) == v5s["training"][k] for k in (
                "decisions", "assessment", "exclusions", "limitations", "grip")),
            "history and equipment unchanged": all(st[k] == v5s[k] for k in (
                "sessions", "prs", "tiers", "phaseHistory", "currentPhase", "benchmarks", "flagsHistory",
                "equipmentLoads", "recoveryBlocks")) and all(st["equipment"][k] == v for k, v in v5s["equipment"].items()),
            "migrated twice is identical": twice,
            "the draft resumes": w and w["dayType"] == "legs" and [e["id"] for e in w["exercises"]] == ["squat_2", "hinge_2", "core_2"],
            "no coverage slot after Program, Today and a main workout":
                not [k for k in after["training"]["slots"] if k in cov] and len(after["sessions"]) == 3,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "version %s; finisher %r; pins %r; slots %s; coverage records after a workout %s" % (
                st["version"], st["prefs"].get("finisher"), tr.get("pins"), sorted(tr["slots"]),
                [k for k in after["training"]["slots"] if k in cov]), s.errors
    finally:
        s.close()


@case("V8", "Phase report with two mini-sessions: adherence unchanged, 'Accessory sessions 2'")
def v8(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        one_set_workout(s)                          # Thu 1 Oct, the one main session
        for d in (2, 3):
            s.set_time(ist(2026, 10, d, 18, 0))
            mini_workout(s)
        ev = s.ev("""() => { const st = App.getState(), ev = App.evaluation.evaluate(st);
            return { attended: ev.sampleSize, planned: ev.expected, ref: App.engine.expectedSessions(st.currentPhase, 1) }; }""")
        open_section(s, "evaluation")
        s.pg.click("#ev-open")
        s.pg.wait_for_timeout(500)
        rows = s.ev("""() => [...document.querySelectorAll('#modal-report [data-ev-section="adherence"] .rc-diff__row')]
            .map(r => [...r.querySelectorAll('span')].map(x => x.innerText.trim()))""")
        checks = {
            "attendance counts the main session only": ev["attended"] == 1 and ev["planned"] == ev["ref"],
            "Sessions attended reads 1 of %s" % ev["ref"]: ["Sessions attended", "1 of %s" % ev["ref"]] in rows,
            "its own line: Accessory sessions 2": ["Accessory sessions", "2"] in rows,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "attended %s of %s (one main session would plan %s); rows %s" % (
                ev["attended"], ev["planned"], ev["ref"], rows), s.errors
    finally:
        s.close()


def seed_rows(s: Session, n=3):
    """Fixture: n finished sessions of rows alone, so no group's primary is
    biceps and nothing trains a curl."""
    add_sessions(s, [dict(fake_session(i, "pull", [fake_exercise("pull_alt_row", "row", "reps", [10, 10, 10])]),
                          dayKey="2026-10-0%d" % (i + 1)) for i in range(n)])


@case("V7", "Muscles: rows only, no curls for 7 days -> Biceps neglected, 0 of 6 direct; the template column renamed")
def v7(pw):
    s = Session(pw, now=ist(2026, 10, 3, 12, 0))
    try:
        onboard(s)
        seed_rows(s)
        open_section(s, "muscles")
        cov = s.ev("() => Coverage.status(App.getState().sessions, App.lib.today(), [])")
        below = sorted(k for k, g in cov.items() if g["direct"] < g["floor"])
        neg = s.ev("""() => [...document.querySelectorAll('.ms-neg__item')].map(e => [e.dataset.msDetail, e.innerText.replace(/\\s+/g, ' ')])""")
        bi = s.ev("""k => { const e = document.querySelector('.ms-row[data-ms-detail="' + k + '"] .ms-row__direct');
            return e ? e.innerText.replace(/\\s+/g, ' ').trim() : null; }""", "biceps")
        la = s.ev("""k => { const e = document.querySelector('.ms-row[data-ms-detail="' + k + '"] .ms-row__direct');
            return e ? e.innerText.replace(/\\s+/g, ' ').trim() : null; }""", "lats")
        head = text_of(s, ".ms-row--head")
        tile = stat_tile(s, "Neglected")
        note = text_of(s, ".ms-table + p")
        s.tap('.ms-row[data-ms-detail="biceps"]')
        s.pg.wait_for_timeout(300)
        modal = s.ev("() => { const m = document.getElementById('wh-modal'); return m && !m.hidden ? m.innerText.replace(/\\s+/g, ' ') : ''; }")
        biceps_neg = [x for x in neg if x[0] == "biceps"]
        checks = {
            "biceps is in Neglected with '0 of 6 direct'": len(biceps_neg) == 1 and "0 of 6 direct" in biceps_neg[0][1],
            "Neglected lists exactly the groups below their floor": sorted(x[0] for x in neg) == below and len(below) > 0,
            "the tile counts them": tile == str(len(below)),
            "biceps's row reads 0 of 6, lats' 9 of 3": bi is not None and bi.startswith("0 of 6") and la is not None and la.startswith("9 of 3"),
            "lats (9 of 3) is not neglected": "lats" not in [x[0] for x in neg],
            "headers: Direct sets (7 d) and Vs. your template": "DIRECT SETS (7 D)" in head.upper() and "VS. YOUR TEMPLATE" in head.upper(),
            "the footnote says the floors aren't validated minimums": "validated minimum" in note,
            "the detail shows Direct sets (7 d)": "DIRECT SETS (7 D)" in modal.upper() and "0 of 6" in modal,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "below floor %d groups (tile %r); neglected %s; biceps %r, lats %r; header %r" % (
                len(below), tile, [x[0] for x in neg][:6], bi, la, head.replace("\n", " ")), s.errors
    finally:
        s.close()


def coverage_rows(s: Session) -> list:
    return s.ev("""() => [...document.querySelectorAll('#pg-coverage [data-pg-slot]')].map(r => [r.dataset.pgSlot, r.innerText.replace(/\\s+/g, ' ')])""")


def pin_state(s: Session, slot: str):
    return s.ev("slot => { const p = App.getState().training.pins || {}; return p[slot] ? JSON.parse(JSON.stringify(p[slot])) : null; }", slot)


@case("V9", "Program's Coverage card: 15 slots, a pin by click persists, clears as a stamped record and puts the slot first")
def v9(pw):
    s = Session(pw, now=ist(2026, 10, 3, 12, 0))      # a Saturday: weekday 6
    try:
        onboard(s)
        cov = s.ev(COVERAGE_SLOTS)
        open_section(s, "program")
        rows = coverage_rows(s)
        before = n_visible(s, "#pg-coverage")
        s.tap('[data-pin-day="backext:6"]')
        s.pg.wait_for_timeout(200)
        pinned = pin_state(s, "backext")
        s.pg.reload()
        s.pg.wait_for_timeout(700)
        open_section(s, "program")
        pressed = s.ev("""() => { const b = document.querySelector('[data-pin-day="backext:6"]'); return b ? b.getAttribute('aria-pressed') : null; }""")
        s.tap('[data-pg-change="curl"]')
        s.pg.wait_for_timeout(200)
        panel = n_visible(s, '[data-pg-panel="curl"]')
        s.tap('[data-pk-cancel]')
        open_today(s)
        pick_day(s, "push")
        s.tick("[data-finisher]")
        s.pg.wait_for_timeout(200)
        first = [x[0] for x in preview_order(s) if x[0] in cov][:1]
        open_section(s, "program")
        s.tap('[data-pin-day="backext:6"]')
        s.pg.wait_for_timeout(200)
        cleared = pin_state(s, "backext")
        open_today(s)
        pick_day(s, "push")
        after = [x[0] for x in preview_order(s) if x[0] in cov]
        names = {k: txt for k, txt in rows}
        checks = {
            "the card lists all 15 slots": sorted(k for k, _ in rows) == sorted(cov) and before == 1,
            "each shows a movement, not a dash": all(len(txt.split(" ")) > 3 and not txt.strip().endswith("—") for _, txt in rows),
            "an unpicked slot says it hasn't started": all("not started" in txt for _, txt in rows),
            "the pin is stored for Saturday": bool(pinned) and pinned.get("days") == [6] and bool(pinned.get("at")),
            "and survives a reload, shown pressed": pressed == "true",
            "Change exercise opens its picker on a coverage slot": panel == 1,
            "with the finisher on, the pinned slot goes first": first == ["backext"],
            "clicking it again leaves a stamped record, days []": bool(cleared) and cleared.get("days") == [] and bool(cleared.get("at")),
            "and it is no longer first": after[:1] != ["backext"] and "backext" not in after[:1],
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "%d rows (card visible %d); curl row %r; pin %s -> %s; pressed %r; picker %d; first with pin %s, after %s" % (
                len(rows), before, names.get("curl", ""), pinned, cleared, pressed, panel, first, after[:4]), s.errors
    finally:
        s.close()


def finisher_rows(s: Session) -> list:
    """The preview's finisher rows as [slot, id, reason text]."""
    return s.ev("""() => [...document.querySelectorAll('#today-preview [data-pv-fin]')].map(r => {
        const n = r.nextElementSibling;
        return [r.dataset.pvFin, r.dataset.pvEx, n && n.hasAttribute('data-pv-cover') ? n.innerText.trim() : '']; })""")


@case("V10", "Finisher controls: tick adds four reasoned picks; Remove, Swap and Add back change what Begin starts; untick removes them")
def v10(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        cov = s.ev(COVERAGE_SLOTS)
        open_today(s)
        pick_day(s, "push")
        main = [x for x in preview_order(s)]
        s.tick("[data-finisher]")
        s.pg.wait_for_timeout(200)
        on = finisher_rows(s)
        pref_on = s.state()["prefs"].get("finisher")
        main_on = [x for x in preview_order(s) if x[0] not in cov]
        s.tap("[data-finisher]")                    # a ticked box: this unticks it
        s.pg.wait_for_timeout(200)
        off = finisher_rows(s)
        pref_off = s.state()["prefs"].get("finisher")
        s.tick("[data-finisher]")
        s.pg.wait_for_timeout(200)
        gone = on[0][0] if on else None
        s.tap('[data-pv-remove="%s"]' % gone)
        s.pg.wait_for_timeout(200)
        removed = finisher_rows(s)
        back_btn = n_visible(s, '[data-pv-addback="%s"]' % gone)
        s.tap('[data-pv-addback="%s"]' % gone)
        s.pg.wait_for_timeout(200)
        restored = finisher_rows(s)
        swap_slot = on[1][0] if len(on) > 1 else None
        s.tap('[data-pvswap="%s"]' % swap_slot)
        s.pg.wait_for_timeout(200)
        s.tap('#pvswap-body [data-pvswapto]:not(.is-current)')
        s.pg.wait_for_timeout(200)
        swapped = {r[0]: r[1] for r in finisher_rows(s)}
        s.tap('[data-pv-remove="%s"]' % gone)
        s.pg.wait_for_timeout(200)
        planned = [r[0] for r in finisher_rows(s)]
        s.pg.click("#begin-session")
        s.pg.wait_for_timeout(300)
        w = draft(s)
        fin = [e for e in w["exercises"] if e.get("finisher")] if w else []
        heads = n_visible(s, "[data-finisher-head]")
        reasons = n_visible(s, "[data-ex-reason]")
        checks = {
            "ticking adds four coverage picks after the main slots": len(on) == 4 and all(r[0] in cov for r in on)
                and main_on == main and pref_on == "on",
            "each carries its reason": all("direct sets this week" in r[2] for r in on),
            "unticking removes them and saves 'off'": off == [] and pref_off == "off",
            "Remove drops one, with an Add back": len(removed) == 3 and gone not in [r[0] for r in removed] and back_btn == 1,
            "Add back restores it": [r[0] for r in restored] == [r[0] for r in on],
            "Swap changes that pick's movement": swap_slot in swapped and swapped[swap_slot] != on[1][1],
            "Begin starts exactly the three kept, swap included":
                [e["slot"] for e in fin] == planned and len(fin) == 3 and any(e["id"] == swapped.get(swap_slot) for e in fin),
            "the workout screen has a Finisher heading and a reason per pick": heads == 1 and reasons == 3,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "ticked %s (pref %r); reasons %s; unticked %s (pref %r); removed %s (add back %d); restored %s; swap %s -> %s; begun %s; headings %d, reasons %d" % (
                [r[0] for r in on], pref_on, [r[2][:40] for r in on][:1], [r[0] for r in off], pref_off, [r[0] for r in removed],
                back_btn, [r[0] for r in restored], swap_slot, swapped.get(swap_slot), [e["slot"] for e in fin], heads, reasons), s.errors
    finally:
        s.close()


def mini_rows(s: Session) -> list:
    return s.ev("""() => [...document.querySelectorAll('#mini-card [data-mini-pick]')].map(r => r.dataset.miniPick)""")


@case("V11", "Accessory session card: on the ready, done-today and rest screens; its count select sizes it; empty when every group is covered")
def v11(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        open_today(s)
        ready = n_visible(s, "[data-mini-start]")
        four = mini_rows(s)
        reasons = s.ev("() => [...document.querySelectorAll('#mini-card [data-mini-pick]')].every(r => /direct sets this week/.test(r.innerText))")
        s.choose("[data-mini-n]", "2")
        two = mini_rows(s)
        s.choose("[data-mini-n]", "6")
        six = mini_rows(s)
        s.choose("[data-mini-n]", "4")
        one_set_workout(s)                          # Thu 1 Oct, Push: done today
        open_today(s)
        done = n_visible(s, "[data-mini-start]")
        s.set_time(ist(2026, 10, 2, 12, 0))
        open_today(s)
        rest = n_visible(s, "[data-mini-start]") + 10 * n_visible(s, "#rest-train-anyway")
        s.tap("[data-mini-start]")
        s.pg.wait_for_timeout(300)
        w = draft(s) or {}
        title = text_of(s, ".page-head h1, .page-head .display")
        main_head = text_of(s, ".page-head h2")
        # The empty state: one finished session that gave every group its floor.
        s.ev("() => App.util.uiSet('today.workout', null)")
        s.set_time(ist(2026, 10, 3, 12, 0))
        ids = s.ev("() => Object.keys(TRAINING_DATA.EXERCISES)")
        add_sessions(s, [dict(fake_session(900, "push", [fake_exercise(i, "accessory", "reps", [10] * 6) for i in ids]),
                              dayKey="2026-10-03")])
        open_today(s)
        empty = n_visible(s, "[data-mini-empty]"), n_visible(s, "[data-mini-start]")
        checks = {
            "on the ready screen": ready == 1,
            "on the done-today screen": done == 1,
            "on the rest-day screen (beside Train anyway)": rest == 11,
            "four picks by default, each with its reason": len(four) == 4 and reasons is True,
            "the select sizes it: 2 and 6": len(two) == 2 and len(six) == 6,
            "start builds a mini-session of the picks": w.get("kind") == "mini" and len(w.get("exercises", [])) == 4
                and not any(e.get("finisher") for e in w.get("exercises", [])),
            "the workout screen is titled for it": "ACCESSORY" in (title + main_head).upper(),
            "when every group has its floor: a message and no Start": empty == (1, 0),
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "start buttons: ready %d, done %d, rest %d (rest card 10 each); picks %d / %d / %d; draft kind %r, %d exercises; title %r; empty state %s" % (
                ready, done, rest % 10, len(four), len(two), len(six), w.get("kind"), len(w.get("exercises", [])),
                (title + " | " + main_head).replace("\n", " "), empty), s.errors
    finally:
        s.close()


@case("V12", "Badges: Balanced Build and Full Sweep span 22 groups, and an earned badge keeps its date (a guard, not a fix)")
def v12(pw):
    s = Session(pw, now=ist(2026, 10, 3, 12, 0))
    try:
        onboard(s)
        s.ev("() => { Hub.state.badges['muscle-balanced'] = '2026-09-01T00:00:00.000Z'; Hub.gamify.recompute({ silent: true }); }")
        got = s.ev("""() => { const m = {}; Hub.gamify.badgeState().forEach(b => { m[b.badge.id] = { at: b.at, progress: b.progress }; });
            return { groups: App.muscles.GROUPS.length, balanced: m['muscle-balanced'], sweep: m['muscle-full-week'] }; }""")
        checks = {
            "22 groups": got["groups"] == 22,
            "Full Sweep reads x/22": got["sweep"]["progress"].endswith("/22 this week"),
            "an earned Balanced Build keeps its stored date": got["balanced"]["at"] == "2026-09-01T00:00:00.000Z",
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + "groups %d; sweep %r; balanced %r" % (
            got["groups"], got["sweep"]["progress"], got["balanced"]["at"]), s.errors
    finally:
        s.close()


# --- R3a-R3c · R3's findings (plans/PROGRESS-fitness-control-and-coverage.md)
def finisher_begun(pw) -> tuple:
    """Onboarded on Thu 1 Oct, the finisher ticked, the push workout begun.
    Returns the session and the finisher exercises' indexes in the draft."""
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    onboard(s)
    open_today(s)
    pick_day(s, "push")
    s.tick("[data-finisher]")
    s.pg.wait_for_timeout(200)
    s.pg.click("#begin-session")
    s.pg.wait_for_timeout(300)
    w = draft(s)
    return s, [i for i, e in enumerate(w["exercises"]) if e.get("finisher")]


@case("R3a", "A coverage exercise takes a pain flag: mild is flagged and kept, sharp skips it; both reach the flag history")
def r3a(pw):
    s, fin = finisher_begun(pw)
    try:
        a, b = fin[0], fin[1]
        s.pg.click('[data-flag="%d"]' % a)
        s.pg.wait_for_timeout(200)
        parts = s.ev("i => { const e = document.getElementById('flag-bp-' + i); return e ? [...e.options].map(o => o.value) : []; }", a)
        label = text_of(s, "#flag-apply-%d" % a)
        s.tap("#flag-apply-%d" % a)
        s.pg.wait_for_timeout(300)
        s.tap('[data-flag="%d"]' % b)
        s.pg.wait_for_timeout(200)
        s.choose("#flag-sev-%d" % b, "sharp")
        s.pg.wait_for_timeout(200)
        s.tap("#flag-apply-%d" % b)
        s.pg.wait_for_timeout(300)
        w = draft(s)
        log_set(s, 0, 0, 8)
        complete(s)
        st = s.state()
        ex = st["sessions"][-1]["exercises"]
        hist = [(f.get("exerciseKey"), f.get("severity")) for f in st.get("flagsHistory", [])]
        ids = [f.get("id") for f in st.get("flagsHistory", [])]
        checks = {
            "the panel lists the joints it loads": len(parts) > 0 and all(p in ("wrist", "elbow", "shoulder", "neck", "lowerBack", "hip", "knee", "ankle") for p in parts),
            "mild offers a flag, not a swap": label.strip().lower() == "flag it",
            "mild keeps the movement, flagged": (w["exercises"][a].get("flag") or {}).get("severity") == "mild"
                and w["exercises"][a]["name"] == s.ev("id => DB.getExercise(id).name", w["exercises"][a]["id"]),
            "sharp skips it": ex[b].get("skipped") is True,
            "both in the flag history": (ex[a]["key"], "mild") in hist and (ex[b]["key"], "sharp") in hist,
            "with two different ids (a sync unions by id)": len(ids) == 2 and len(set(ids)) == 2,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "parts %s; button %r; flags %s; skipped %s; history %s; ids distinct %s" % (
                parts, label.strip(), [(e.get("flag") or {}).get("severity") for e in w["exercises"]],
                [e.get("skipped") for e in ex], hist, len(set(ids)) == len(ids)), s.errors
    finally:
        s.close()


@case("R3b", "A finisher pick with no set logged gets no coverage record; a trained one does")
def r3b(pw):
    s, fin = finisher_begun(pw)
    try:
        cov = s.ev(COVERAGE_SLOTS)
        w = draft(s)
        trained = w["exercises"][fin[0]]["slot"]
        log_set(s, 0, 0, 8)                         # one main set
        log_set(s, fin[0], 0, 10)                   # one set on the first pick only
        complete(s)
        made = sorted(k for k in s.state()["training"]["slots"] if k in cov)
        ok = made == [trained]
        return ok, "picks %s; logged on %s; records %s" % (
            [w["exercises"][i]["slot"] for i in fin], trained, made), s.errors
    finally:
        s.close()


@case("R3c", "Neck on avoid: the Coverage row names the limit, not equipment, and promises no start")
def r3c(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        open_settings(s)
        s.choose('#set-limits [data-limit="neck"]', "avoid")
        s.tap("#btn-settings-save")
        s.pg.wait_for_timeout(300)
        open_section(s, "program")
        row = s.ev("""() => { const r = document.querySelector('#pg-coverage [data-pg-slot="neck"]');
            return r ? r.innerText.replace(/\\s+/g, ' ') : ''; }""")
        checks = {
            "names the neck limit": "avoiding your neck" in row.lower(),
            "doesn't blame equipment": "equipment" not in row.lower(),
            "doesn't promise a start": "starts it" not in row,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + "neck row %r" % row[:160], s.errors
    finally:
        s.close()


MODAL_TEXT = """() => { const m = document.getElementById('wh-modal'); return m && !m.hidden ? m.innerText.replace(/\\s+/g, ' ') : ''; }"""


def lit_regions(s: Session, host: str) -> list:
    """[(group, aria-label)] for every region drawn in colour inside `host`."""
    return s.ev("""h => [...document.querySelectorAll(h + ' .bm-r:not(.bm-r--off)')]
        .map(e => [e.dataset.g, e.getAttribute('aria-label')])""", host)


@case("B1", "Exercise page (opened by How to do this): a movement without phases shows the body map in tiers; one with phases keeps its animation")
def b1(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        begin(s)
        ids = s.ev("() => [...document.querySelectorAll('[data-guide]')].map(b => b.dataset.exid)")
        has = s.ev("ids => ids.map(id => !!(window.PHASE_MAP && window.PHASE_MAP[id]))", ids)
        plain = [i for i, h in zip(ids, has) if not h]
        phased = [i for i, h in zip(ids, has) if h]
        if not plain:
            return False, "no movement without phases in today's workout: %s" % ids, s.errors
        s.tap('[data-guide][data-exid="%s"]' % plain[0])
        s.pg.wait_for_timeout(300)
        prof = s.ev("id => { const p = MUSCLE_MAP[id] || MUSCLE_FALLBACK[(EXERCISE_DB[id] || {}).pattern]; return p; }", plain[0])
        lit = lit_regions(s, "[data-dx-pmap]")
        figs = s.ev("() => document.querySelectorAll('[data-dx-pmap] .bm-fig').length")
        rows = s.ev("() => document.querySelectorAll('.dx-tiers li').length")
        legend = text_of(s, "[data-dx-pmap] .bm-legend")
        want = {}
        for tier in ("primary", "secondary", "stabiliser"):
            for g in prof[tier]:
                want[g] = tier
        got = {}
        for g, label in lit:
            got.setdefault(g, set()).add(label.rsplit(" — ", 1)[1])
        tab = s.ev("() => document.querySelectorAll('[data-dx-phases] .phz-tab').length")
        if not s.tap("[data-dx-back]"):
            s.tap("#modal-guide .modal__close")   # a tree without the page still has the modal
        s.pg.wait_for_timeout(300)
        phased_info = "no phased movement in today's workout"
        phased_ok = True
        if phased:
            s.tap('[data-guide][data-exid="%s"]' % phased[0])
            s.pg.wait_for_timeout(300)
            tabs = s.ev("() => document.querySelectorAll('[data-dx-phases] .phz-tab').length")
            phased_ok = tabs > 0
            phased_info = "%s: %d phase tabs" % (phased[0], tabs)
        checks = {
            "two figures": figs == 2,
            "lit groups are exactly the profile's": set(got) == set(want),
            "every lit region names its tier": all(got[g] == {want[g]} for g in got),
            "the tier legend names all three": all(w in legend.lower() for w in ("primary", "secondary", "stabiliser")),
            "the muscle list is still there, one row per tier": rows == len([t for t in ("primary", "secondary", "stabiliser") if prof[t]]),
            "no phase tabs on this one": tab == 0,
            "a phased movement keeps its animation": phased_ok,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "%s: %d figures, lit %s, %d rows | %s" % (plain[0], figs, sorted(got), rows, phased_info), s.errors
    finally:
        s.close()


@case("B2", "Muscles: the 7-day map is lit by direct sets against the floor, and a click or Enter opens that group's detail")
def b2(pw):
    s = Session(pw, now=ist(2026, 10, 3, 12, 0))
    try:
        onboard(s)
        seed_rows(s)
        open_section(s, "muscles")
        if not s.ev("() => !!document.querySelector('#ms-map .bm-fig')"):
            return False, "no body map on the Muscles screen", s.errors
        cov = s.ev("() => Coverage.status(App.getState().sessions, App.lib.today(), [])")
        lit = dict(lit_regions(s, "#ms-map"))
        off_biceps = s.ev("() => document.querySelectorAll('#ms-map .bm-r--off[data-g=\"biceps\"]').length")
        lats_label = lit.get("lats", "")
        gaps = s.ev("() => [...document.querySelectorAll('.ms-gap')].map(e => e.dataset.msDetail)")
        tabs = s.ev("""() => [...document.querySelectorAll('#ms-map .bm-fig')].map(svg => ({
            stops: [...svg.querySelectorAll('.bm-r--tap[tabindex="0"]')].map(e => e.dataset.g),
            groups: [...new Set([...svg.querySelectorAll('.bm-r--tap')].map(e => e.dataset.g))] }))""")
        # a real click on the shape, then the keyboard on a different one
        s.pg.locator('#ms-map .bm-r--tap[data-g="lats"]').first.click()
        s.pg.wait_for_timeout(300)
        click_modal = s.ev(MODAL_TEXT)
        s.pg.keyboard.press("Escape")
        s.pg.wait_for_timeout(200)
        s.pg.locator('#ms-map .bm-r--tap[data-g="biceps"][tabindex="0"]').first.focus()
        s.pg.keyboard.press("Enter")
        s.pg.wait_for_timeout(300)
        key_modal = s.ev(MODAL_TEXT)
        checks = {
            "lats is lit, labelled '9 of 3 direct sets, 7 d'": "9 of 3 direct sets" in lats_label,
            "biceps (0 of 6) is not lit": "biceps" not in lit and off_biceps == 2,
            "the lit groups are the ones with direct sets": set(lit) == {k for k, g in cov.items() if g["direct"] > 0},
            "the list beside it starts with the neediest groups": len(gaps) == 6 and "lats" not in gaps,
            "one tab stop per group and view": len(tabs) == 2 and all(
                sorted(v["stops"]) == sorted(v["groups"]) and len(v["stops"]) == len(set(v["stops"])) for v in tabs),
            "a click on lats opens its detail": "Lats" in click_modal and "9 of 3" in click_modal,
            "Enter on biceps opens its detail": "Biceps" in key_modal and "0 of 6" in key_modal,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "lit %s; lats %r; gaps %s; tab stops %s; click %r; key %r" % (
                sorted(lit), lats_label, gaps, [len(v["stops"]) for v in tabs], click_modal[:40], key_modal[:40]), s.errors
    finally:
        s.close()


@case("B3", "Muscles map at 390 and 1920 px in Selene and Selene Day: no overflow, both figures visible, nothing stranded to one side")
def b3(pw):
    global VIEWPORT
    saved, out, bad, errs = VIEWPORT, [], [], []
    try:
        for theme in ("selene", "selene-day"):
            for w, h in ((390, 844), (1920, 1080)):
                VIEWPORT = {"width": w, "height": h}
                s = Session(pw, now=ist(2026, 10, 3, 12, 0))
                try:
                    onboard(s)
                    seed_rows(s)
                    s.ev("id => Hub.theme.apply(id)", theme)
                    open_section(s, "muscles")
                    if not s.ev("() => !!document.querySelector('#ms-map .bm-fig')"):
                        bad.append("%s/%d: no body map" % (theme, w))
                        continue
                    m = s.ev("""() => {
                        const r = e => { const b = e.getBoundingClientRect(); return [b.left, b.right, b.width, b.height]; };
                        const figs = [...document.querySelectorAll('#ms-map .bm-fig')].map(r);
                        const card = r(document.getElementById('ms-map').closest('.card'));
                        const fill = getComputedStyle(document.querySelector('#ms-map .bm-r--off')).fill;
                        return { over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                                 figs, card, fill, vw: document.documentElement.clientWidth };
                    }""")
                    f0, f1 = m["figs"][0], m["figs"][1]
                    gap_l = f0[0] - m["card"][0]
                    gap_r = m["card"][1] - (m["figs"][-1][1])
                    tag = "%s/%d" % (theme, w)
                    checks = {
                        "no horizontal overflow": m["over"] == 0,
                        "two figures, each over 120 px wide": len(m["figs"]) == 2 and f0[2] > 120 and f1[2] > 120,
                        "inside the card": f0[0] >= m["card"][0] and m["figs"][-1][1] <= m["card"][1],
                        "unlit fill resolves": m["fill"] not in ("", "none"),
                    }
                    if w >= 1440:
                        # the map and its list share the card: no more than ~40% of it empty on the right
                        checks["the figures sit in the left half of the card, the list in the right"] = \
                            f1[1] < m["card"][0] + 0.55 * (m["card"][1] - m["card"][0])
                    miss = [k for k, ok in checks.items() if not ok]
                    bad += ["%s: %s" % (tag, k) for k in miss]
                    out.append("%s fig %dx%d over %d" % (tag, round(f0[2]), round(f0[3]), m["over"]))
                    errs += s.errors
                finally:
                    s.close()
    finally:
        VIEWPORT = saved
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + "; ".join(out), errs


# --- D3-D7 · Stage 4's Exercises section (step 4.8) --------------------------
def open_exercises(s: Session) -> bool:
    """Open the Exercises section by its navigation entry. A tree without the
    section is recorded as absent, so the case FAILs with a number instead of
    timing out into an ERROR."""
    if s.pg.locator('#nav [data-section="exercises"], #fit-panel [data-section="exercises"]').count() == 0:
        s.absent.append("exercises nav")
        return False
    open_section(s, "exercises")
    return True


NO_SECTION = (False, "no Exercises section in the navigation")


def exercises_rows(s: Session) -> list:
    """[(id, [badge texts])] for every row of the directory list, in order."""
    return s.ev("""() => [...document.querySelectorAll('[data-dx-results] [data-dx-open]')].map(b =>
        [b.dataset.dxOpen, [...b.querySelectorAll('.badge')].map(x => x.innerText.trim().toLowerCase())])""")


@case("D3", "Exercises: searching 'knuckle' finds the six grip-capable push-ups; tapping Biceps lists curls first, then rows")
def d3(pw):
    s = Session(pw, now=ist(2026, 10, 3, 12, 0))
    try:
        onboard(s)
        if not open_exercises(s):
            return NO_SECTION + (s.errors,)
        total = len(exercises_rows(s))
        s.put("[data-dx-q]", "knuckle")
        s.pg.wait_for_timeout(200)
        found = sorted(r[0] for r in exercises_rows(s))
        grip = sorted(s.ev("() => TRAINING_DATA.GRIPS.exercises"))
        s.tap('[data-dx-open="push_2"]')
        s.pg.wait_for_timeout(300)
        knuckle_block = s.ev("""() => [...document.querySelectorAll('.dx-h')].filter(h => /knuckles/i.test(h.innerText))
            .map(h => h.parentElement.innerText.replace(/\\s+/g, ' ')).join(' | ')""")
        s.tap("[data-dx-back]")
        s.pg.wait_for_timeout(200)
        s.put("[data-dx-q]", "")
        s.pg.wait_for_timeout(200)
        s.pg.locator('.bm-r--tap[data-g="biceps"]').first.click()
        s.pg.wait_for_timeout(300)
        rows = exercises_rows(s)
        sel = s.ev("() => document.querySelector('[data-dx-sel=\"muscle\"]').value")
        want = s.ev("""() => Object.keys(TRAINING_DATA.EXERCISES).filter(id => EXERCISE_DB[id] && MUSCLE_MAP[id] &&
            ['primary', 'secondary', 'stabiliser'].some(t => (MUSCLE_MAP[id][t] || []).includes('biceps'))).length""")
        order = ["primary", "secondary", "stabiliser"]
        tiers = [next((t for t in order if t in r[1]), None) for r in rows]
        slots = s.ev("ids => ids.map(id => TRAINING_DATA.EXERCISES[id].slot)", [r[0] for r in rows])
        first_sec = tiers.index("secondary") if "secondary" in tiers else -1
        s.pg.locator('.bm-r--tap[data-g="biceps"]').first.click()
        s.pg.wait_for_timeout(300)
        cleared = len(exercises_rows(s))
        checks = {
            "the list holds every movement to begin with": total == s.ev("() => Object.keys(TRAINING_DATA.EXERCISES).filter(id => EXERCISE_DB[id]).length"),
            "'knuckle' finds exactly the grip-capable ids": found == grip and len(grip) == 6,
            "Push-up's page has the knuckles section": "front two knuckles" in knuckle_block.lower() or "knuckle" in knuckle_block.lower(),
            "tapping Biceps selects it in the Muscle select": sel == "biceps",
            "every movement that works biceps is listed": len(rows) == want and want > 0,
            "tiers never go backwards (primary, secondary, stabiliser)": None not in tiers and
                [order.index(t) for t in tiers] == sorted(order.index(t) for t in tiers),
            "curls come first": slots[0] in ("curl", "pull") and slots[:3].count("curl") == 3,
            "rows come after the curls": first_sec > 0 and "row" in slots[first_sec:],
            "tapping Biceps again clears the filter": cleared == total,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "%d listed; knuckle %s; biceps %d of %d, first slots %s, first secondary at %d, cleared %d" % (
                total, found, len(rows), want, slots[:4], first_sec, cleared), s.errors
    finally:
        s.close()


@case("D4", "Exercises: Train this in my slot, a refused one says why inline, Exclude hides it from Swap")
def d4(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    dialogs = []
    s.pg.on("dialog", lambda d: (dialogs.append(d.message), d.dismiss()))
    try:
        onboard(s)
        if not open_exercises(s):
            return NO_SECTION + (s.errors,)
        s.put("[data-dx-q]", "archer push")
        s.tap('[data-dx-open="push_5"]')
        s.pg.wait_for_timeout(300)
        s.tap("[data-dx-train]")
        s.pg.wait_for_timeout(300)
        slot = s.state()["training"]["slots"]["push"]
        said = text_of(s, ".dx-msg")
        now_in = n_visible(s, "[data-dx-train]")
        # a movement the default equipment can't do: Weighted Dip needs dip bars and weights
        s.tap("[data-dx-back]")
        s.put("[data-dx-q]", "weighted dip")
        s.tap('[data-dx-open="dip_6"]')
        s.pg.wait_for_timeout(300)
        s.tap("[data-dx-train]")
        s.pg.wait_for_timeout(300)
        refused = text_of(s, ".dx-msg")
        dip = s.state()["training"]["slots"].get("dip") or {}
        # Exclude Diamond, then look for it in Today's Swap list and in the directory
        s.tap("[data-dx-back]")
        s.put("[data-dx-q]", "diamond")
        s.tap('[data-dx-open="push_3"]')
        s.pg.wait_for_timeout(300)
        s.tap('[data-dx-excl="excluded"]')
        s.pg.wait_for_timeout(300)
        rec = s.state()["training"]["exclusions"].get("push_3") or {}
        shown_excl = n_visible(s, '[data-dx-excl="none"]')
        s.tap("[data-dx-back]")
        s.put("[data-dx-q]", "diamond")
        s.pg.wait_for_timeout(200)
        hidden = len(exercises_rows(s))
        s.tick('[data-dx-chk="showExcluded"]')
        s.pg.wait_for_timeout(200)
        listed = exercises_rows(s)
        open_today(s)
        pick_day(s, "push")
        s.pg.click('[data-pvswap="push"]')
        s.pg.wait_for_timeout(300)
        in_swap = s.pg.locator('[data-pvswapto="push_3"]').count()
        checks = {
            "Train this sets the slot, 'chosen by you'": slot.get("exerciseId") == "push_5" and slot.get("why") == "chosen by you",
            "the page says so, and the button gives way": "Archer Push-up" in said and now_in == 0,
            "a refused choice says why on the page": "needs" in refused.lower() and "dip" in refused.lower(),
            "and writes nothing": dip.get("exerciseId") != "dip_6",
            "Exclude stamps the record": rec.get("state") == "excluded" and bool(rec.get("at")),
            "the page then offers Include again": shown_excl == 1,
            "an excluded movement is hidden from the list": hidden == 0,
            "Show excluded brings it back, marked": len(listed) == 1 and "excluded" in listed[0][1],
            "Today's Swap list hides it": in_swap == 0,
            "no alert, confirm or prompt": not dialogs,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "slot %s/%r; said %r; refused %r; dip %s; record %s; hidden %d, listed %s; swap rows %d; dialogs %s" % (
                slot.get("exerciseId"), slot.get("why"), said[:50], refused[:70], dip.get("exerciseId"),
                rec.get("state"), hidden, listed, in_swap, dialogs), s.errors
    finally:
        s.close()


@case("D5", "How to do this from a workout opens the page and Back keeps the draft; all 14 animated pages keep their animation")
def d5(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        begin(s)
        log_set(s, 0, 0, 9)
        w0 = draft(s)
        ex0 = w0["exercises"][0]
        s.tap('[data-guide="0"]')
        s.pg.wait_for_timeout(300)
        landed = s.ev("""() => ({ view: !!document.getElementById('view-exercises') && !document.getElementById('view-exercises').classList.contains('hide'),
            today: document.getElementById('view-today').classList.contains('hide'),
            h1: (document.querySelector('#view-exercises h1') || {innerText: ''}).innerText.trim() })""")
        modal_open = s.ev("() => { const m = document.getElementById('modal-guide'); return !!m && m.classList.contains('is-open'); }")
        if not landed["view"]:
            return False, "How to do this did not open the Exercises section (landed %s, old modal open %s)" % (landed, modal_open), s.errors
        back_label = text_of(s, "[data-dx-back]")
        s.tap("[data-dx-back]")
        s.pg.wait_for_timeout(300)
        w1 = draft(s)
        resumed = n_visible(s, "#complete-session")
        ids = s.ev("() => Object.keys(PHASE_MAP).filter(id => TRAINING_DATA.EXERCISES[id] && EXERCISE_DB[id])")
        total_phased = s.ev("() => Object.keys(PHASE_MAP).length")
        bad_pages = []
        open_exercises(s)
        for id in ids:
            name = s.ev("id => EXERCISE_DB[id].name", id)
            s.put("[data-dx-q]", name)
            if not s.tap('[data-dx-open="%s"]' % id):
                bad_pages.append(id + ": no row")
                continue
            s.pg.wait_for_timeout(120)
            m = s.ev("""() => ({ h1: document.querySelector('#view-exercises h1').innerText.trim(),
                tabs: document.querySelectorAll('[data-dx-phases] .phz-tab').length,
                maps: document.querySelectorAll('[data-dx-pmap] .bm-fig').length })""")
            if m["h1"] != name or m["tabs"] < 1 or m["maps"] != 2:
                bad_pages.append("%s: h1 %r tabs %d maps %d" % (id, m["h1"], m["tabs"], m["maps"]))
            s.tap("[data-dx-back]")
        checks = {
            "the page opens in the Exercises section": landed["view"] and landed["today"] and landed["h1"] == ex0["name"],
            "not the old modal": not modal_open,
            "Back names where you came from": "workout" in back_label.lower(),
            "Back returns to the running workout": resumed == 1,
            "the set you had typed is still there": w1["exercises"][0]["sets"][0]["value"] == 9 == w0["exercises"][0]["sets"][0]["value"],
            "all 14 animated movements are listed": len(ids) == total_phased == 14,
            "each animated page has its tabs and the tiers map": not bad_pages,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "landed %s; modal %s; back %r; resumed %d; set %s; animated %d/%d %s" % (
                landed, modal_open, back_label, resumed, w1["exercises"][0]["sets"][0]["value"], len(ids), total_phased, bad_pages), s.errors
    finally:
        s.close()


@case("D6", "Exercises list and page in Selene and Selene Day at 390 and 1920 px: no overflow, the map visible, the layout fills its width")
def d6(pw):
    global VIEWPORT
    saved, out, bad, errs = VIEWPORT, [], [], []
    try:
        for theme in ("selene", "selene-day"):
            for w, h in ((390, 844), (1920, 1080)):
                VIEWPORT = {"width": w, "height": h}
                s = Session(pw, now=ist(2026, 10, 3, 12, 0))
                try:
                    onboard(s)
                    s.ev("id => Hub.theme.apply(id)", theme)
                    if not open_exercises(s):
                        bad.append("%s/%d: no Exercises section" % (theme, w))
                        continue
                    animated = s.ev("() => Object.keys(PHASE_MAP).filter(id => TRAINING_DATA.EXERCISES[id])[0]")
                    probe = """() => {
                        const r = e => { const b = e.getBoundingClientRect(); return [b.left, b.right, b.width]; };
                        const v = document.getElementById('view-exercises'), lay = v.querySelector('.dx-layout');
                        const figs = [...v.querySelectorAll('.bm-fig')].filter(f => f.getBoundingClientRect().width > 0).map(r);
                        const unlit = v.querySelector('.bm-r--off');
                        return { over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                                 figs, view: r(v), lay: r(lay), vw: document.documentElement.clientWidth,
                                 fill: unlit ? getComputedStyle(unlit).fill : 'x' };
                    }"""
                    for label, go in (("list", lambda: None),
                                      ("page", lambda: (s.put("[data-dx-q]", "pike"), s.tap('[data-dx-open="shoulder_4"]'))),
                                      ("animated", lambda: (s.tap("[data-dx-back]"), s.put("[data-dx-q]", s.ev("id => EXERCISE_DB[id].name", animated)),
                                                            s.tap('[data-dx-open="%s"]' % animated)))):
                        go()
                        s.pg.wait_for_timeout(300)
                        m = s.ev(probe)
                        tag = "%s/%d/%s" % (theme, w, label)
                        checks = {
                            "no horizontal overflow": m["over"] == 0,
                            "the body map is on screen": len(m["figs"]) >= 2 and all(f[2] > 60 for f in m["figs"]),
                            "the layout fills its view (no stranded side)": m["lay"][0] - m["view"][0] <= 2 and m["view"][1] - m["lay"][1] <= 2,
                            "unlit fill resolves": m["fill"] not in ("", "none"),
                        }
                        bad += ["%s: %s" % (tag, k) for k, ok in checks.items() if not ok]
                        out.append("%s over %d, %d figs, layout %d-%d of view %d-%d" % (
                            tag, m["over"], len(m["figs"]), round(m["lay"][0]), round(m["lay"][1]), round(m["view"][0]), round(m["view"][1])))
                    errs += s.errors
                finally:
                    s.close()
    finally:
        VIEWPORT = saved
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + "; ".join(out), errs


@case("D7", "Offline after install: every new file is served from the service worker's cache")
def d7(pw):
    import socket
    import subprocess
    import time
    root = pathlib.Path(os.environ.get("HELTH_INDEX") or ROOT / "index.html").resolve().parent
    sock = socket.socket(); sock.bind(("127.0.0.1", 0)); port = sock.getsockname()[1]; sock.close()
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(root)],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    browser = None
    try:
        for _ in range(50):
            try:
                socket.create_connection(("127.0.0.1", port), 0.2).close(); break
            except OSError:
                time.sleep(0.1)
        html = (root / "index.html").read_text()
        sw = (root / "service-worker.js").read_text()
        scripts = re.findall(r'<script src="((?:fitness|vendor)/[^"]+)"', html)
        missing = [x for x in scripts if './' + x not in sw]
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport=VIEWPORT, timezone_id=TZ, locale="en-IN")
        pg = ctx.new_page()
        errors = []
        pg.on("pageerror", lambda e: errors.append("PAGEERROR: " + str(e)))
        pg.goto("http://127.0.0.1:%d/index.html" % port)
        pg.wait_for_function("() => navigator.serviceWorker && navigator.serviceWorker.controller", timeout=20000)
        pg.wait_for_timeout(1500)   # addAll finished before the worker took control
        ctx.set_offline(True)
        served = {}
        pg.on("response", lambda r: served.__setitem__(r.url, (r.status, r.from_service_worker)))
        pg.reload()
        try:
            pg.wait_for_function("() => window.App && window.App.directory", timeout=8000)
        except PlaywrightError:
            pass
        new_files = [x for x in scripts if "directory" in x or "bodymap" in x or "content/" in x]
        not_cached = [x for x in new_files if not any(u.endswith("/" + x) and v == (200, True) for u, v in served.items())]
        page = pg.evaluate("""() => { if (!window.App || !App.directory) return { h1: null, guides: 0, map: false, knuckles: false };
            App.directory.open('push_2');
            return { h1: document.querySelector('#view-exercises h1').innerText.trim(),
                     guides: Object.keys(EXERCISE_CONTENT).length, movements: Object.keys(EXERCISE_DB).length, map: !!window.BODY_MAP,
                     knuckles: /knuckles/i.test(document.getElementById('view-exercises').innerText) }; }""")
        checks = {
            "every fitness and vendor script in index.html is in PRECACHE": not missing,
            "the new files come from the worker, status 200, offline": new_files and not not_cached,
            "the directory runs offline: Push-up's page, a guide per movement, the map": page["h1"] == "Push-up" and page["guides"] == page["movements"] and page["map"] and page["knuckles"],
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "%d new files checked, not from cache %s, missing from PRECACHE %s; page %s" % (len(new_files), not_cached, missing, page), errors
    finally:
        if browser:
            browser.close()
        srv.terminate()


def visible_views(s: Session) -> list:
    return s.ev("() => [...document.querySelectorAll('section.view')].filter(v => !v.classList.contains('hide')).map(v => v.dataset.view)")


def open_page(s: Session, query: str, ex_id: str):
    s.put("[data-dx-q]", query)
    s.pg.wait_for_timeout(150)
    s.tap('[data-dx-open="%s"]' % ex_id)
    s.pg.wait_for_timeout(300)


@case("R4a", "Exercises: Train this never puts a left-out slot back in your program; a live slot and an unstarted coverage slot still offer it")
def r4a(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        open_section(s, "program")
        s.tap('[data-slot-toggle="dip"][data-on="0"]')
        s.pg.wait_for_timeout(300)
        off_before = bool((s.state()["training"]["slots"].get("dip") or {}).get("off"))
        if not open_exercises(s):
            return NO_SECTION + (s.errors,)
        open_page(s, "bench dip", "dip_1")
        offered = n_visible(s, "[data-dx-train]")
        note = text_of(s, ".dx-side .card:last-child")
        if offered:   # a tree that still offers it: press it and record what it wrote
            s.tap("[data-dx-train]")
            s.pg.wait_for_timeout(300)
        dip = s.state()["training"]["slots"].get("dip") or {}
        s.tap("[data-dx-back]")
        # Four-Way Neck Isometric: a coverage slot with no record, not its first rung
        open_page(s, "four-way neck", "acc_neck_fourway")
        cov_rec = "neck" in s.state()["training"]["slots"]
        cov_offered = n_visible(s, "[data-dx-train]")
        s.tap("[data-dx-back]")
        open_page(s, "archer push", "push_5")
        live_offered = n_visible(s, "[data-dx-train]")
        checks = {
            "the dip slot was left out by Program's own button": off_before,
            "no Train this on a left-out slot": offered == 0,
            "the page says it is left out, and where to add it": "left out" in note.lower() and "program" in note.lower(),
            "the dip slot stays out": bool(dip.get("off")),
            "an unstarted coverage slot still offers it": not cov_rec and cov_offered == 1,
            "a live slot still offers it": live_offered == 1,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "left out %s; offered %d; dip after %s/off %s; note %r; coverage %d, live %d" % (
                off_before, offered, dip.get("exerciseId"), dip.get("off"), note[:90], cov_offered, live_offered), s.errors
    finally:
        s.close()


@case("R4b", "Exercises: Back returns to where you opened the page from, and the nav opens the list, after a page was left by the nav")
def r4b(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        open_section(s, "skills")
        s.pg.locator("[data-skillguide]").first.click()
        s.pg.wait_for_timeout(300)
        begin(s)                         # leave the skill's page by the nav
        log_set(s, 0, 0, 7)
        s.tap('[data-guide="0"]')
        s.pg.wait_for_timeout(300)
        label = text_of(s, "[data-dx-back]")
        s.tap("[data-dx-back]")
        s.pg.wait_for_timeout(300)
        landed = visible_views(s)
        resumed = n_visible(s, "#complete-session")
        kept = draft(s)["exercises"][0]["sets"][0]["value"]
        open_today(s)                    # shape 2: a page left for Muscles, then Exercises from the nav
        s.tap('[data-guide="0"]')
        s.pg.wait_for_timeout(300)
        opened = visible_views(s) == ["exercises"]
        open_section(s, "muscles")
        open_section(s, "exercises")
        rows = len(exercises_rows(s))
        back_btns = n_visible(s, "[data-dx-back]")
        checks = {
            "Back names the workout": "workout" in label.lower(),
            "Back lands on the workout": landed == ["today"] and resumed == 1,
            "the typed set is still there": kept == 7,
            "the nav opens the list, not the old page": opened and rows == s.ev("() => Object.keys(TRAINING_DATA.EXERCISES).filter(id => EXERCISE_DB[id]).length") and back_btns == 0,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "back %r; landed %s, Complete %d, set %s; page opened again %s, then from the nav %d rows, %d Back buttons" % (
                label, landed, resumed, kept, opened, rows, back_btns), s.errors
    finally:
        s.close()


@case("R4c", "Exercises: a loaded movement's last sessions print their weight, and Best says it counts reps at any weight")
def r4c(pw):
    s = Session(pw, now=ist(2026, 10, 3, 12, 0))
    try:
        onboard(s)

        def curl(i, kgs):
            sess = fake_session(i, "mini", [fake_exercise("acc_curl_db", "accessory", "reps", [12] * len(kgs))])
            sess["dateISO"], sess["dayKey"], sess["kind"] = "2026-10-0%dT06:00:00.000Z" % i, "2026-10-0%d" % i, "mini"
            for st, kg in zip(sess["exercises"][0]["sets"], kgs):
                st["weight"] = kg
            return sess
        add_sessions(s, [curl(1, [5, 5, 5]), curl(2, [12.5, 12.5, 10])])
        s.ev("() => { App.getState().prs.push({ id: 'pr_r4c', exerciseId: 'acc_curl_db', exercise: 'Dumbbell Curl', kind: 'reps', value: 12, dateISO: '2026-10-01T06:00:00.000Z' }); App.saveState(); }")
        if not open_exercises(s):
            return NO_SECTION + (s.errors,)
        open_page(s, "dumbbell curl", "acc_curl_db")
        prog = text_of(s, ".dx-side .card:last-child").replace("\n", " ")
        checks = {
            "a uniform session prints its weight once": "12 / 12 / 12 at 5 kg" in prog,
            "a mixed session prints each set's weight": "12 at 12.5 kg / 12 at 12.5 kg / 12 at 10 kg" in prog,
            "Best says what it counts": "any weight" in prog,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + "page %r" % prog[:260], s.errors
    finally:
        s.close()


@case("R4d", "Exercises: one row click is one render, however many times you went Back to the list")
def r4d(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        if not open_exercises(s):
            return NO_SECTION + (s.errors,)
        # instrumentation only: count App.refresh calls; the clicks are real
        s.ev("() => { window.__r = 0; const f = App.refresh; App.refresh = function () { window.__r++; return f.apply(this, arguments); }; }")
        counts = []
        for _ in range(6):
            s.ev("() => { window.__r = 0; }")
            s.pg.locator('[data-dx-open="push_2"]').first.click()
            s.pg.wait_for_timeout(150)
            counts.append(s.ev("() => window.__r"))
            s.tap("[data-dx-back]")
            s.pg.wait_for_timeout(150)
        return counts == [1] * 6, "refreshes per click after 0-5 Backs: %s" % counts, s.errors
    finally:
        s.close()


@case("R4e", "The Fitness nav bar's nine destinations fit one row at 1440 px in every palette")
def r4e(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        s.pg.set_viewport_size({"width": 1440, "height": 950})
        s.pg.wait_for_timeout(200)
        themes = s.ev("() => Hub.theme.list().map(t => t.id || t)")
        out = []
        for th in themes:
            s.ev("id => Hub.theme.apply(id)", th)
            s.pg.wait_for_timeout(60)
            out.append([th] + s.ev("""() => { const n = document.getElementById('nav'), b = [...n.querySelectorAll('.nav__btn')].filter(x => x.offsetParent);
                const w = b.reduce((a, x) => a + x.getBoundingClientRect().width, 0);
                return [b.length, new Set(b.map(x => Math.round(x.getBoundingClientRect().top))).size, Math.round(w), n.clientWidth]; }"""))
        wrapped = [o for o in out if o[2] != 1]
        ok = len(out) >= 2 and not wrapped and all(o[1] == 9 for o in out)
        return ok, "%d palettes; wrapped %s; Selene %s buttons, %s rows, %s of %s px" % (
            len(out), [o[0] for o in wrapped], out[0][1], out[0][2], out[0][3], out[0][4]), s.errors
    finally:
        s.close()


@case("R4f", "Exercises: the muscle-filter map says selected / not selected, once, and draws no heat ramp")
def r4f(pw):
    s = Session(pw, now=ist(2026, 10, 1, 12, 0))
    try:
        onboard(s)
        if not open_exercises(s):
            return NO_SECTION + (s.errors,)
        s.pg.locator('.bm-r--tap[data-g="biceps"]').first.click()
        s.pg.wait_for_timeout(300)
        labels = s.ev("() => [...new Set([...document.querySelectorAll('[data-dx-map] .bm-r--tap')].map(x => x.getAttribute('aria-label')))]")
        ramps = s.pg.locator("[data-dx-map] .bm-legend__ramp").count()
        others = [l for l in labels if not l.startswith("Biceps")]
        checks = {
            "the selected group reads 'Biceps — selected'": "Biceps — selected" in labels,
            "every other group reads 'not selected'": others and all(l.endswith("— not selected") for l in others),
            "nothing says 'not worked'": not any("not worked" in l for l in labels),
            "no heat ramp for a two-state filter": ramps == 0,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "%d labels, e.g. %s; ramps %d" % (len(labels), [l for l in labels if "Biceps" in l] + others[:2], ramps), s.errors
    finally:
        s.close()



# --- Y6-Y8 · schema v7 (plans/PLAN-yellow-dude.md, step 1.2) -----------------
# Y6 seeds the v6 fixture, which the b0bae7a build wrote by clicks; the card's
# tick and Looks right are clicks. Y7 needs the v6 build itself, so it
# extracts b0bae7a from this repository: without git or that commit it can't
# run, and ERRORs rather than FAILs.
FIXTURE_V6 = ROOT / "tools" / "fixtures" / "v6-midworkout.json"
V6_BUILD = "b0bae7a"
NORDICS = ("hinge_4", "hinge_5", "hinge_6")


def v6_fixture() -> dict:
    """localStorage as the b0bae7a build (v6) left it, mid-workout: the two keys."""
    fx = json.loads(FIXTURE_V6.read_text())
    return {k: v for k, v in fx.items() if not k.startswith("_")}


def drop_nordic_sessions(v6: dict):
    for x in v6["sessions"]:
        x["exercises"] = [e for e in x["exercises"] if e.get("key") not in NORDICS]


def eqcheck_rows(s: Session) -> list:
    """The Equipment check card's rows in screen order: [token, ticked, its line]."""
    return s.ev("""() => [...document.querySelectorAll('[data-eqcheck-tok]')].map(b =>
        [b.dataset.eqcheckTok, b.checked, b.parentNode.innerText.replace(/\\s+/g, ' ').trim()])""")


def jdump(v) -> str:
    return json.dumps(v, ensure_ascii=False)


@case("Y6", "v6 save -> v7: the ankle anchor from a Nordic session or slot, everything else byte-identical, the card names the six")
def y6(pw):
    hip_thrust = v5_fixture()[STORAGE_KEY]["training"]["slots"]["hinge"]   # hinge_2, as the v5 build wrote it
    legs = [
        ("as saved", lambda v: None, {"nordicAnchor": {"id": "hinge_4", "from": "session"}}, "you logged Nordic Curl Negative"),
        ("Nordic slot, none logged", drop_nordic_sessions,
         {"nordicAnchor": {"id": "hinge_4", "from": "slot"}}, "your hinge slot is Nordic Curl Negative"),
        ("no Nordic anywhere", lambda v: (drop_nordic_sessions(v), v["training"]["slots"].update(hinge=hip_thrust)),
         {}, "off — tick it if you have it"),
    ]
    checks, shown, errors = {}, [], []
    for label, mutate, want, line in legs:
        fx = v6_fixture()
        v6 = fx[STORAGE_KEY]
        mutate(v6)
        if label == "as saved":
            # this device dismissed v5's card long ago; v7's must still show once
            fx["ironframe.ui"] = dict(fx["ironframe.ui"], **{"v5.equipmentCheckSeen": True})
        anchor = "nordicAnchor" in want
        s = Session(pw, now=ist(2026, 10, 6, 8, 0))
        try:
            seed_and_reload(s, fx)
            st = s.state()
            schema = s.ev("() => App.SCHEMA_VERSION")
            eq, chk = st["equipment"], st["training"].get("equipmentCheck") or {}
            checks[label + ": version %s" % schema] = st["version"] == schema and schema >= 7
            checks[label + ": the nine unchanged, anchor %s, the other five off" % anchor] = \
                all(eq.get(k) == v for k, v in v6["equipment"].items()) and eq.get("nordicAnchor") is anchor \
                and all(eq.get(k) is False for k in V7_TOKENS if k != "nordicAnchor")
            checks[label + ": the check records why and names the six"] = \
                chk.get("inferred") == want and chk.get("tokens") == list(V7_TOKENS) and bool(chk.get("at"))
            to_fitness(s)
            open_section(s, "program")
            rows = eqcheck_rows(s)
            nordic_line = next((r[2] for r in rows if r[0] == "nordicAnchor"), "")
            checks[label + ": the card lists the six, the anchor ticked %s" % anchor] = \
                [r[0] for r in rows] == list(V7_TOKENS) and [r[0] for r in rows if r[1]] == (["nordicAnchor"] if anchor else []) \
                and line in nordic_line
            shown.append("%s: anchor %s, inferred %s, card %s, %r" % (
                label, eq.get("nordicAnchor"), jdump(chk.get("inferred")), [r[0] for r in rows if r[1]] or "none ticked", nordic_line))
            if label == "as saved":
                twice = s.ev("""raw => { const a = App.migrate(JSON.parse(raw));
                    return JSON.stringify(a) === JSON.stringify(App.migrate(JSON.parse(JSON.stringify(a)))); }""", jdump(v6))
                s.tick('[data-eqcheck-tok="jumpRope"]')       # the card saves at once: the round trip's write
                s.pg.wait_for_timeout(200)
                saved = json.loads(s.raw())
                ui = json.loads(s.ev("() => localStorage.getItem('ironframe.ui')"))
                same = lambda a, b: jdump(a) == jdump(b)
                diff = [k for k in v6 if k not in ("version", "equipment", "training", "meta", "prefs") and not same(saved.get(k), v6[k])]
                diff += ['prefs.' + k for k in v6['prefs'] if not same(saved['prefs'].get(k), v6['prefs'][k])]
                checks['v8 leaves the weekly target unset'] = saved['prefs'].get('weeklyDays') is None
                diff += ["training." + k for k in v6["training"] if k != "equipmentCheck" and not same(saved["training"].get(k), v6["training"][k])]
                diff += ["meta." + k for k in v6["meta"] if k != "updatedAt" and not same(saved["meta"].get(k), v6["meta"][k])]
                diff += ["equipment." + k for k in v6["equipment"] if saved["equipment"].get(k) is not v6["equipment"][k]]
                extra = sorted(set(saved) - set(v6)) + ["training." + k for k in sorted(set(saved["training"]) - set(v6["training"]))]
                checks["round trip: sessions, slots, PRs and every other key byte-identical"] = not diff and not extra \
                    and saved["version"] == schema and saved["equipment"].get("jumpRope") is True
                checks["the mid-workout draft is untouched"] = same(ui.get("today.workout"), fx["ironframe.ui"]["today.workout"])
                checks["migrated twice is identical"] = twice
                s.tap("[data-eqcheck-ok]")
                s.pg.reload()
                s.pg.wait_for_timeout(700)
                to_fitness(s)
                open_section(s, "program")
                again = s.pg.locator("[data-eqcheck]").count()
                checks["Looks right: gone after a reload"] = again == 0
                shown.append("round trip: differs in %s, extra %s; %d sessions, %d slots, %d PRs; after Looks right %d" % (
                    diff or "nothing", extra or "none", len(saved["sessions"]), len(saved["training"]["slots"]), len(saved["prs"]), again))
            errors += s.errors
        finally:
            s.close()
    bad = [k for k, ok in checks.items() if not ok]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + "; ".join(shown), errors


@case("Y7", "A v7 save opened by the v6 build (b0bae7a): read-only, the save untouched")
def y7(pw):
    s = Session(pw, now=ist(2026, 10, 6, 8, 0))
    try:
        seed_and_reload(s, v6_fixture())
        to_fitness(s)
        open_section(s, "program")
        s.tick('[data-eqcheck-tok="vest"]')               # a real save, by this build
        s.pg.wait_for_timeout(200)
        raw, errors = s.raw(), list(s.errors)
    finally:
        s.close()
    v7 = json.loads(raw)
    with tempfile.TemporaryDirectory() as tmp:
        tar = subprocess.run(["git", "-C", str(ROOT), "archive", V6_BUILD], check=True, capture_output=True).stdout
        subprocess.run(["tar", "-x", "-C", tmp], input=tar, check=True)
        old = Session(pw, now=ist(2026, 10, 6, 9, 0), seed=raw, url=pathlib.Path(tmp, "index.html").as_uri())
        try:
            build = old.ev("() => App.SCHEMA_VERSION")
            to_fitness(old)
            try_to_log(old)
            kept = old.raw() == raw
            banner = banner_visible(old, BANNER_NEWER)
            ok = v7.get("version", 0) >= 7 and v7["equipment"].get("vest") is True and build == 6 and kept and banner
            return ok, "saved at v%s with vest %s; opened by a v%s build: key unchanged=%s, banner=%s" % (
                v7.get("version"), v7["equipment"].get("vest"), build, kept, banner), errors + old.errors
        finally:
            old.close()


@case("Y8", "Setup and Settings list v7's six items; a tick in each reaches the saved equipment")
def y8(pw):
    s = Session(pw, now=ist(2026, 10, 6, 12, 0))
    try:
        to_fitness(s)
        for _ in range(3):
            s.tap('#onb-body [data-onb="next"]')
        setup = s.ev("() => [...document.querySelectorAll('#onb-body [data-equip]')].map(b => [b.dataset.equip, b.innerText.trim()])")
        s.tap('#onb-body [data-equip="box"]')
        s.tap('#onb-body [data-equip="nordicAnchor"]')
        s.tap('#onb-body [data-onb="next"]')
        s.tap('#onb-body [data-onb="next"]')
        s.tap('[data-onb="finish"]')
        s.pg.wait_for_timeout(400)
        from_setup = {k: s.state()["equipment"].get(k) for k in V7_TOKENS}
        s.tap("#btn-settings")
        s.pg.wait_for_timeout(300)
        settings = s.ev("""() => [...document.querySelectorAll('#set-equip [data-equip]')].map(b =>
            [b.dataset.equip, b.innerText.trim(), b.getAttribute('aria-pressed')])""")
        s.tap('#set-equip [data-equip="vest"]')
        s.tap('#set-equip [data-equip="nordicAnchor"]')
        s.tap("#btn-settings-save")
        s.pg.wait_for_timeout(400)
        from_settings = {k: s.state()["equipment"].get(k) for k in V7_TOKENS}
        on = lambda *ks: {k: k in ks for k in V7_TOKENS}
        named = lambda rows: next((r[1] for r in rows if r[0] == "nordicAnchor"), "")
        checks = {
            "setup lists the six, before Just the floor": [r[0] for r in setup if r[0] in V7_TOKENS] == list(V7_TOKENS)
                and setup[-1][0] == "nothing",
            "setup saves the box and the anchor, the rest off": from_setup == on("box", "nordicAnchor"),
            "Settings lists the six, the two from setup pressed": [r[0] for r in settings if r[0] in V7_TOKENS] == list(V7_TOKENS)
                and [r[0] for r in settings if r[0] in V7_TOKENS and r[2] == "true"] == ["box", "nordicAnchor"],
            "Settings saves the vest on and the anchor off": from_settings == on("vest", "box"),
            "the anchor says what it is for, on both screens": "Nordic" in named(setup) and "Nordic" in named(settings),
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "setup %s; saved %s; Settings %s; saved %s" % (
                [r[1] for r in setup if r[0] in V7_TOKENS], [k for k, v in from_setup.items() if v],
                [r[1] for r in settings if r[0] in V7_TOKENS], [k for k, v in from_settings.items() if v]), s.errors
    finally:
        s.close()


# --- Y9-Y10 · R1's findings (plans/PLAN-yellow-dude.md, step 1.4) -------------
V5_ORDER = ("dipBars", "lowBar", "bands", "parallettes")   # the card's order, and the record's


def v6_with_v5_card() -> dict:
    """The v6 fixture with a v5 Equipment check record still on it: dip bars
    turned on by a logged dip, as the v5 upgrade wrote it."""
    fx = v6_fixture()
    st = fx[STORAGE_KEY]
    st["equipment"]["dipBars"] = True
    st["training"]["equipmentCheck"] = {"at": "2026-10-03T08:00:00.000Z",
                                        "inferred": {"dipBars": {"id": "dip_3", "from": "session"}}}
    return fx


@case("Y9", "A v5 card this device hasn't shown survives v7, as one card of ten; a device that showed it gets the six")
def y9(pw):
    checks, shown, errors = {}, [], []
    for label, seen in (("v5 card not yet shown", False), ("v5 card already shown", True)):
        fx = v6_with_v5_card()
        if seen:
            fx["ironframe.ui"] = dict(fx["ironframe.ui"], **{"v5.equipmentCheckSeen": True})
        s = Session(pw, now=ist(2026, 10, 6, 8, 0))
        try:
            seed_and_reload(s, fx)
            chk = s.state()["training"].get("equipmentCheck") or {}
            to_fitness(s)
            open_section(s, "program")
            rows = eqcheck_rows(s)
            dip = next((r[2] for r in rows if r[0] == "dipBars"), "")
            want = (list(V5_ORDER) if not seen else []) + list(V7_TOKENS)
            checks[label + ": the record keeps v5's four and why"] = chk.get("tokens") == list(V5_ORDER) + list(V7_TOKENS) \
                and (chk.get("inferred") or {}).get("dipBars") == {"id": "dip_3", "from": "session"} \
                and (chk.get("inferred") or {}).get("nordicAnchor", {}).get("id") == "hinge_4"
            checks[label + ": the card lists %d" % len(want)] = [r[0] for r in rows] == want \
                and (seen or "you logged Parallel Bar Dip" in dip)
            shown.append("%s: card %s%s" % (label, [r[0] for r in rows], ", %r" % dip if dip else ""))
            errors += s.errors
        finally:
            s.close()
    bad = [k for k, ok in checks.items() if not ok]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + "; ".join(shown), errors


@case("Y10", "Every Settings equipment tile is one line, at 390 and 1440 px")
def y10(pw):
    global VIEWPORT
    saved, shown, bad, errors = VIEWPORT, [], [], []
    try:
        for w, h in ((390, 844), (1440, 950)):
            VIEWPORT = {"width": w, "height": h}
            s = Session(pw, now=ist(2026, 10, 6, 12, 0))
            try:
                onboard(s)
                if s.pg.locator("#btn-settings").is_visible():
                    open_settings(s)
                else:
                    s.tap("#fit-toggle")
                    s.tap("#fit-panel [data-fitsetup]")
                    s.pg.wait_for_timeout(300)
                tiles = s.ev("""() => [...document.querySelectorAll('#set-equip [data-equip]')].map(b =>
                    [b.dataset.equip, Math.round(b.getBoundingClientRect().height)])""")
                tall = [t for t in tiles if t[1] != tiles[0][1]] if tiles else ["no tiles"]
                if tall:
                    bad.append("%d px: %s" % (w, tall))
                shown.append("%d px: %d tiles, height %s" % (w, len(tiles), sorted({t[1] for t in tiles})))
                errors += s.errors
            finally:
                s.close()
    finally:
        VIEWPORT = saved
    return not bad, ("taller than the rest: " + "; ".join(bad) + " | " if bad else "") + "; ".join(shown), errors


# --- Y11-Y14 · tracks, conditioning and the new routine (plan step 4.1) ------
TRACK_TABS = ["Planche", "Front Lever", "Back Lever", "Muscle-up", "Handstand",
              "L-Sit & Compression", "Variations", "Mobility"]
TRACK_RUNGS = {
    "planche": ["Band-Assisted Planche Lean", "Planche Lean", "Box-Supported Tuck Planche", "Tuck Planche",
                "Advanced Tuck Planche", "Box-Supported Straddle Planche Push-up", "Straddle Planche",
                "Planche Push-up", "Full Planche"],
    "frontlever": ["Band-Assisted Front Lever", "Tuck Front Lever", "Front Lever Negative",
                   "Advanced Tuck Front Lever", "One-Leg Front Lever", "Front Lever Raise",
                   "Straddle Front Lever", "Full Front Lever"],
    "backlever": ["Skin the Cat", "Tuck Back Lever", "Tuck-to-Straddle Transition", "Advanced Tuck Back Lever",
                  "Straddle Back Lever Negative", "Straddle Back Lever", "Full Back Lever Negative",
                  "Full Back Lever"],
    "muscleup": ["High Pull-up", "Bar Turnover Drill", "Band-Assisted Muscle-up", "Muscle-up"],
    "handstand": ["Pike Hold", "Feet-Elevated Pike Hold", "Wall Plank (Toes on Wall)", "Wall Walk",
                  "Chest-to-Wall Handstand", "Cartwheel Exit Drill", "Back-to-Wall Handstand",
                  "Split-Leg Wall Toe Tap", "Split-Leg Handstand Hold", "Freestanding Handstand",
                  "Parallette Handstand", "Bent-Arm Handstand Hold", "One-Arm Handstand"],
}


@case("Y11", "Skills: eight tabs, the five tracks list their rungs in ladder order, no sideways scroll at 390 and 1440 px")
def y11(pw):
    global VIEWPORT
    saved, shown, bad, errors = VIEWPORT, [], [], []
    try:
        for w, h in ((390, 844), (1440, 950)):
            VIEWPORT = {"width": w, "height": h}
            s = Session(pw, now=ist(2026, 10, 7, 12, 0))
            try:
                onboard(s)
                open_section(s, "skills")
                tabs = s.ev("() => [...document.querySelectorAll('.skill-cat-tabs .skill-tab')].map(b => b.textContent)")
                if tabs != TRACK_TABS:
                    bad.append("%d px tabs %s" % (w, tabs))
                counts = {}
                for track, want in TRACK_RUNGS.items():
                    s.tap('[data-skilltab="%s"]' % track)
                    s.pg.wait_for_timeout(120)
                    got = s.ev("() => [...document.querySelectorAll('.skill-rung__name')].map(b => b.textContent)")
                    counts[track] = len(got)      # measured, not TRACK_RUNGS: a failing run must report what it saw
                    if got != want:
                        bad.append("%d px %s: %s" % (w, track, got))
                    if s.ev("() => document.documentElement.scrollWidth > innerWidth"):
                        bad.append("%d px %s scrolls sideways" % (w, track))
                shown.append("%d px: %d tabs, rungs %s" % (w, len(tabs), counts))
                errors += s.errors
            finally:
                s.close()
    finally:
        VIEWPORT = saved
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + "; ".join(shown), errors


def own_gear(s: Session, *tokens):
    """Fixture: tick equipment in the saved state, then reload."""
    s.ev("""t => { const st = App.getState(); t.forEach(k => { st.equipment[k] = true; }); App.saveState(); }""", list(tokens))
    s.pg.reload()
    s.pg.wait_for_timeout(700)
    to_fitness(s)


def train_from_page(s: Session, query: str, ex_id: str) -> str:
    """Exercises -> search -> open the page -> Train this in my slot; returns the page text."""
    open_section(s, "exercises")
    s.tap("[data-dx-back]")      # the section reopens on the last page you read
    s.pg.wait_for_timeout(200)
    s.put("[data-dx-q]", query)
    s.pg.wait_for_timeout(250)
    s.tap('[data-dx-open="%s"]' % ex_id)
    s.pg.wait_for_timeout(300)
    s.tap("[data-dx-train]")
    s.pg.wait_for_timeout(300)
    return s.ev("() => document.body.innerText")


@case("Y12", "Train this in my slot: Muscle-up reads 3 x 1-5 reps, Jump Rope reads 3 sets for 30-60 s, not a hold")
def y12(pw):
    s = Session(pw, now=ist(2026, 10, 7, 12, 0))
    try:
        onboard(s)
        own_gear(s, "pullupBar", "jumpRope")
        mu = train_from_page(s, "Muscle-up", "skill_muscleup_full")
        jr = train_from_page(s, "Jump Rope", "cond_rope")
        mu_line = next((l for l in mu.splitlines() if "trains this now" in l), "no line")
        jr_line = next((l for l in jr.splitlines() if "trains this now" in l), "no line")
        checks = {
            "muscle-up is taken": "Muscle-up is now your Pull slot's exercise" in mu,
            "muscle-up reads 3 × 1–5 reps": mu_line == "Your Pull slot trains this now: 3 × 1–5 reps.",
            "jump rope is taken": "Jump Rope is now your Conditioning slot's exercise" in jr,
            "jump rope reads for 30-60 s": jr_line == "Your Conditioning slot trains this now: 3 sets for 30–60 s.",
            "jump rope is not called a hold": "hold" not in jr_line.lower(),
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "muscle-up: %r; jump rope: %r" % (mu_line, jr_line), s.errors
    finally:
        s.close()


@case("Y13", "Conditioning: pinned to today it joins the finisher with a set timer; unpinned it is never picked")
def y13(pw):
    s = Session(pw, now=ist(2026, 10, 7, 12, 0))      # a Wednesday
    try:
        onboard(s)
        open_today(s)
        pick_day(s, "push")
        s.tick("[data-finisher]")
        s.pg.wait_for_timeout(300)
        unpinned = [slot for slot, _ in preview_order(s)]
        open_section(s, "program")
        s.tap('[data-pin-day="conditioning:3"]')
        s.pg.wait_for_timeout(200)
        pins = s.ev("() => App.getState().training.pins.conditioning")
        open_today(s)
        pick_day(s, "push")
        s.pg.wait_for_timeout(300)
        pinned = [slot for slot, _ in preview_order(s)]
        text = s.ev("() => document.body.innerText")
        s.tap("#begin-session")
        s.pg.wait_for_timeout(300)
        timer_btns = s.ev("() => document.querySelectorAll('button[aria-label=\"Start set timer\"]').length")
        checks = {
            "never picked unpinned": "conditioning" not in unpinned,
            "the pin saved Wednesday": bool(pins) and pins.get("days") == [3],
            "picked when pinned": "conditioning" in pinned,
            "its range reads 'for'": "3 sets for 30–60 s" in text,
            "its reason is on the card": "Pinned for Wed" in text,
            "its three sets get a set timer, not a hold timer": timer_btns == 3,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "unpinned slots %s; pinned %s; set-timer buttons %d" % (unpinned, pinned, timer_btns), s.errors
    finally:
        s.close()


@case("Y14", "Hip Rotation: listed with six steps, played through, and logged as one mobility session")
def y14(pw):
    s = Session(pw, now=ist(2026, 10, 7, 12, 0))
    try:
        explore = s.pg.get_by_role("button", name="Explore first")
        if explore.count():
            explore.click()
        s.tap('.wh-navbtn[data-view="mobility"]')
        s.pg.wait_for_timeout(400)
        before = s.ev("() => Hub.day().mobility || 0")
        tile = s.ev("""() => { const b = document.querySelector('[data-routine="hip-rotation"]');
            const c = b && b.closest('.wh-ex'); return c ? c.innerText : null; }""")
        tiles = s.ev("() => [...document.querySelectorAll('[data-routine]')].map(b => b.dataset.routine)")
        s.tap('[data-routine="hip-rotation"]')
        s.pg.wait_for_timeout(300)
        steps = [s.ev("() => (document.querySelector('#mb-step') || {}).textContent")]
        for _ in range(5):
            s.tap("#mb-skip")
            s.pg.wait_for_timeout(150)
            steps.append(s.ev("() => (document.querySelector('#mb-step') || {}).textContent"))
        s.tap("#mb-skip")
        s.pg.wait_for_timeout(300)
        done = s.ev("() => document.body.innerText")
        after = s.ev("() => Hub.day().mobility || 0")
        checks = {
            "six routines listed, Hip Rotation last": len(tiles) == 6 and tiles[-1] == "hip-rotation",
            "the tile names it, six steps, and its tag": bool(tile) and "Hip Rotation" in tile and "6 steps" in tile
                and "Hips that won't turn" in tile,
            "the six steps play in order": steps == ["Downward dog to deep lunge", "Kneeling Cossack to hamstring",
                "Rotating glute bridge", "Seated hip rotation, knees bent", "Seated hip rotation, leg out",
                "Knee-to-chest hold"],
            "it ends on the complete card": "Hip Rotation complete" in done,
            "one completion logged": after == before + 1,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "tiles %s; steps %s; mobility sessions today %s -> %s" % (tiles, steps, before, after), s.errors
    finally:
        s.close()


FIXTURE_V7 = ROOT / "tools" / "fixtures" / "v7-midworkout.json"


def v7_fixture() -> dict:
    """localStorage as the schema v7 build left it, mid-workout: the two keys."""
    fx = json.loads(FIXTURE_V7.read_text())
    return {k: v for k, v in fx.items() if not k.startswith("_")}


@case("Y15", "A v7 save with Muscle-up, a pinned Conditioning slot and a Jump Rope session opens with all of it intact")
def y15(pw):
    fx = v7_fixture()
    v7 = fx[STORAGE_KEY]
    s = Session(pw, now=ist(2026, 10, 9, 8, 0))
    try:
        seed_and_reload(s, fx)
        st = s.state()
        to_fitness(s)
        open_section(s, "program")
        program = s.ev("() => document.body.innerText")
        open_today(s)
        w = draft(s)
        open_section(s, "exercises")
        s.put("[data-dx-q]", "Jump Rope")
        s.pg.wait_for_timeout(250)
        s.tap('[data-dx-open="cond_rope"]')
        s.pg.wait_for_timeout(300)
        page = s.ev("() => document.body.innerText")
        same = lambda a, b: jdump(a) == jdump(b)
        rope = next((e for x in st["sessions"] for e in x["exercises"] if e.get("key") == "cond_rope"), {})
        checks = {
            "the finished session is byte-identical": same(st["sessions"], v7["sessions"]),
            "its Jump Rope sets read 60 / 60 / 60": [x.get("reps") for x in rope.get("sets", [])] == [60, 60, 60],
            "the slots are byte-identical": same(st["training"]["slots"], v7["training"]["slots"]),
            "the Conditioning pin is Wednesday": (st["training"].get("pins") or {}).get("conditioning", {}).get("days") == [3],
            "the PRs are byte-identical": same(st["prs"], v7["prs"]),
            "the four ticked items stay on, the anchor off": all(st["equipment"].get(k) for k in ("pullupBar", "jumpRope", "box", "vest"))
                and not st["equipment"].get("nordicAnchor"),
            "no equipment card is invented": not (st["training"].get("equipmentCheck") or {}).get("tokens"),
            "Program lists Muscle-up on 1–5 and Jump Rope": "Muscle-up" in program and "1–5" in program and "Jump Rope" in program,
            "the half-logged Pull workout is still on Today": bool(w) and w["exercises"][0]["sets"][0].get("value") == 3
                and w["exercises"][0]["sets"][1].get("value") == 3,
            "the Jump Rope page keeps your best": "Best: 60 s, longest set" in page,
        }
        bad = [k for k, ok in checks.items() if not ok]
        return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
            "saved v%s, opened at v%s: %d session, slots %s, pin %s" % (
                v7["version"], st["version"], len(st["sessions"]),
                {k: st["training"]["slots"][k].get("exerciseId") for k in ("pull", "conditioning")},
                (st["training"].get("pins") or {}).get("conditioning", {}).get("days")), s.errors
    finally:
        s.close()


@case("Y16", "Mobility routines and flexibility holds fill even rows at 1440 and 1920 px, and every per-side Hip Rotation step chimes at its midpoint")
def y16(pw):
    global VIEWPORT
    saved, rows, holds, chimes, errors = VIEWPORT, {}, {}, {}, []
    try:
        for w, h in ((1440, 950), (1920, 1080)):
            VIEWPORT = {"width": w, "height": h}
            s = Session(pw, now=ist(2026, 10, 7, 12, 0))
            try:
                explore = s.pg.get_by_role("button", name="Explore first")
                if explore.count():
                    explore.click()
                s.tap('.wh-navbtn[data-view="mobility"]')
                s.pg.wait_for_timeout(400)
                rows[w] = s.ev("""() => { const m = {}; document.querySelectorAll('[data-routine]').forEach(b => {
                    const t = Math.round(b.closest('.wh-ex').getBoundingClientRect().top); m[t] = (m[t] || 0) + 1; });
                    return Object.values(m); }""")
                s.tap('[data-mobpill="flexibility"]')
                s.pg.wait_for_timeout(300)
                holds[w] = s.ev("""() => { const m = {}; document.querySelectorAll('.wh-exgrid > .wh-ex').forEach(e => {
                    if (!e.offsetParent) return; const t = Math.round(e.getBoundingClientRect().top); m[t] = (m[t] || 0) + 1; });
                    return Object.values(m); }""")
                s.tap('[data-mobpill="routines"]')
                s.pg.wait_for_timeout(300)
                if w == 1440:
                    # Count Hub.cueChange calls past each step's midpoint; the step names come from the screen.
                    s.ev("() => { window.__ch = 0; const o = Hub.cueChange; Hub.cueChange = function () { window.__ch++; return o.apply(this, arguments); }; }")
                    s.tap('[data-routine="hip-rotation"]')
                    s.pg.wait_for_timeout(300)
                    for sec in (60, 60, 45, 45, 45, 40):
                        name, before = s.ev("() => document.querySelector('#mb-step').textContent"), s.ev("() => window.__ch")
                        s.pg.clock.run_for((sec // 2 + 3) * 1000)
                        chimes[name] = s.ev("() => window.__ch") - before
                        s.tap("#mb-skip")
                        s.pg.wait_for_timeout(150)
                errors += s.errors
            finally:
                s.close()
    finally:
        VIEWPORT = saved
    # Downward dog and the bent-knee rotation alternate within the step, so they need no chime.
    per_side = ["Kneeling Cossack to hamstring", "Rotating glute bridge", "Seated hip rotation, leg out", "Knee-to-chest hold"]
    checks = {
        "no lone routine on a row at 1440 or 1920": all(r and min(r) == max(r) for r in rows.values()),
        "no lone flexibility hold on a row at 1440 or 1920": all(r and min(r) == max(r) for r in holds.values()),
        "every per-side step chimes once": all(chimes.get(n) == 1 for n in per_side),
    }
    bad = [k for k, ok in checks.items() if not ok]
    return not bad, ("failed: " + "; ".join(bad) + " | " if bad else "") + \
        "routines per row %s; holds per row %s; midpoint chimes %s" % (rows, holds, chimes), errors


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
