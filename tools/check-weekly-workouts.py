#!/usr/bin/env python3
"""Weekly workout UI and recovery regression checks.

Real clicks choose and apply frequency. Seeded history covers week boundaries,
duplicate same-day sessions and accessory overlap. HELTH_INDEX supports the
same checks against the saved pre-change app.
"""
from __future__ import annotations

import importlib.util
import json
import argparse
import traceback
from pathlib import Path

spec = importlib.util.spec_from_file_location("workout_checks", Path(__file__).with_name("check-workout.py"))
h = importlib.util.module_from_spec(spec)
spec.loader.exec_module(h)


def choose_days(s: h.Session, days: int) -> None:
    h.open_section(s, "program")
    assert s.tap(f'[data-weekly-days="{days}"]'), "weekly day selector missing"
    assert s.pg.locator('[data-tpl-preview]').count(), "preview missing"
    s.tap('[data-tpl-apply]')


def train_each_movement(s: h.Session) -> None:
    h.begin(s)
    count = s.ev("() => App.util.uiGet('today.workout').exercises.length")
    for i in range(count): h.log_set(s, i, 0, 12)
    h.complete(s)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--only', default='')
    selected = parser.parse_args().only.split(',')
    failures: list[str] = []
    with h.sync_playwright() as pw:
        def run(name, check):
            s = h.Session(pw, now=h.ist(2026, 10, 5, 10))
            try:
                check(s)
                assert not s.errors, s.errors
                print(name, "PASS", flush=True)
            except Exception as e:
                failures.append(name)
                print(name, "FAIL", str(e)[:500], flush=True)
                traceback.print_exc()
            finally:
                s.close()

        def setup(s):
            h.to_fitness(s)
            s.pg.click('[data-onb="next"]')
            s.pg.click('[data-onb="next"]')
            assert s.tap('[data-onb-days="6"]'), "setup day selector missing"
            assert 'one day off' in s.pg.locator('#onb-body').inner_text()
            for _ in range(3): s.pg.click('[data-onb="next"]')
            s.pg.click('[data-onb="finish"]')
            assert s.state()['prefs']['weeklyDays'] == 6
            s.pg.reload()
            assert s.state()['prefs']['template'] == 'split6'

        def all_choices(s):
            h.onboard(s)
            original = s.state()['training']['slots']
            for n, template in [(1,'fullbody1'), (2,'fullbody2'), (3,'fullbody3'), (4,'upperlower'), (5,'split5'), (6,'split6')]:
                choose_days(s, n)
                st = s.state()
                assert st['prefs']['weeklyDays'] == n and st['prefs']['template'] == template
                assert s.pg.locator('[data-weekly-current]').text_content() == f'{n} ' + ('day' if n == 1 else 'days')
                label = f'{7-n} ' + ('day' if n == 6 else 'days') + ' without planned strength'
                assert label in s.pg.locator('#pg-weekly').inner_text()
                assert s.ev('() => App.engine.template().perWeek') == n
                for key, value in original.items(): assert st['training']['slots'][key] == value, key
            s.pg.reload()
            assert s.state()['prefs']['weeklyDays'] == 6
            # Selecting the same count must not archive another phase.
            previous = s.state()['currentPhase']['number']
            choose_days(s, 6)
            assert s.state()['currentPhase']['number'] == previous

        def weekly_target(s):
            h.onboard(s, template='fullbody3')
            choose_days(s, 3)
            for day in [5, 7, 9]:
                s.set_time(h.ist(2026,10,day,10))
                h.one_set_workout(s)
            s.set_time(h.ist(2026,10,10,10))
            h.open_today(s)
            assert s.ev('() => App.engine.restDayInfo(App.getState()).rule') == 'weekly'
            assert s.ev('() => App.engine.nextSession(App.getState()).key') == '2026-10-12'
            assert '3 of 3 strength days' in s.pg.locator('#view-today [data-weekly-summary]').inner_text()
            s.ev("""() => { const s=App.getState(); const copy=JSON.parse(JSON.stringify(s.sessions[0]));
                copy.id='same-day-copy'; s.sessions.push(copy); App.saveState(); }""")
            assert s.ev('() => App.engine.weekProgress(App.getState()).days') == 3
            h.open_section(s,'dashboard')
            assert '12 Oct' in s.pg.locator('#view-dashboard .hero').inner_text()
            s.set_time(h.ist(2026,10,12,10))
            h.open_today(s)
            assert s.pg.locator('#begin-session').count() == 1
            assert s.ev('() => App.engine.weekProgress(App.getState()).days') == 0

        def split_week(s, count=6):
            h.onboard(s)
            choose_days(s,count)
            pats = s.ev("() => App.engine.buildWorkout('splitpull', null, 'full', null, null, {finisher:false}).exercises.map(x=>x.slot)")
            assert 'hinge' not in pats and 'push' not in pats
            for day in range(5,5+count):
                s.set_time(h.ist(2026,10,day,10))
                h.open_today(s)
                assert s.pg.locator('#begin-session').count() == 1, f'no start on {day}'
                train_each_movement(s)
            s.set_time(h.ist(2026,10,5+count,10))
            h.open_today(s)
            assert s.pg.locator('#rest-train-anyway').count() == 1
            assert s.ev('() => App.engine.nextSession(App.getState()).key') == '2026-10-12'
            expected = ['splitpush','splitpull','splitlegs']*2 if count == 6 else ['upper','lower','splitpush','splitpull','splitlegs']
            assert [x['type'] for x in s.state()['sessions']] == expected

        def overlap(s):
            h.onboard(s)
            choose_days(s,6)
            h.one_set_workout(s)
            # Yesterday's extra row work must delay today's Pull.
            s.ev("""() => { const st=App.getState(); st.sessions.push({id:'extra-row',kind:'mini',type:'mini',
                completed:true,dayKey:'2026-10-05',dateISO:'2026-10-05T12:00:00+05:30',
                exercises:[{key:'pull_alt_australian',pattern:'pull',sets:[{reps:8}]}]}); App.saveState(); }""")
            s.set_time(h.ist(2026,10,6,10))
            h.open_today(s)
            assert s.ev('() => App.engine.restDayInfo(App.getState()).rule') == 'overlap'
            assert s.ev('() => App.engine.nextSession(App.getState()).key') == '2026-10-07'
            assert s.ev('() => App.engine.weekProgress(App.getState()).days') == 1
            # The weekday boundary cannot erase a recovery interval.
            s.ev("""() => { const st=App.getState(); st.sessions.forEach(x=> {x.dayKey='2026-10-11';
                x.dateISO='2026-10-11T10:00:00+05:30';}); App.saveState(); }""")
            s.set_time(h.ist(2026,10,12,10))
            assert s.ev('() => App.engine.restDayInfo(App.getState()).rule') == 'overlap'

        def active_workout(s):
            h.onboard(s)
            h.open_today(s)
            assert s.tap('#begin-session')
            old = s.state()
            workout = s.ev("() => App.util.uiGet('today.workout',null)")
            assert workout
            choose_days(s, 5)
            after = s.state()
            assert s.ev("() => App.util.uiGet('today.workout',null)") == workout
            assert after['sessions'] == old['sessions']
            assert after['training']['slots'] == old['training']['slots']
            s.pg.reload()
            assert s.ev("() => App.util.uiGet('today.workout',null)") == workout

        def western_timezone(s):
            h.onboard(s)
            choose_days(s, 1)
            s.ev("""() => { const st=App.getState(); st.sessions.push({id:'monday',type:'whole',completed:true,
                dayKey:'2026-10-05',dateISO:'2026-10-05T10:00:00-07:00',exercises:[]}); App.saveState(); }""")
            s.set_time(h.ist(2026,10,6,10))
            assert s.ev('() => App.engine.weekProgress(App.getState()).start') == '2026-10-05'
            assert s.ev('() => App.engine.weekProgress(App.getState()).days') == 1
            assert s.ev('() => App.engine.nextSession(App.getState()).key') == '2026-10-12'
            s.set_time(h.ist(2026,10,12,10))
            assert s.ev('() => App.engine.weekProgress(App.getState()).days') == 0
            assert s.ev('() => App.engine.nextSession(App.getState()).isToday')

        def extended_upper(s):
            h.onboard(s)
            choose_days(s, 4)
            # Full adds core work to Upper; Lower trains core again.
            s.ev("() => { App.getState().prefs.sessionLength='full'; App.saveState(); }")
            train_each_movement(s)
            assert any(x.get('pattern') == 'core' for x in s.state()['sessions'][0]['exercises'])
            s.set_time(h.ist(2026,10,6,10))
            assert s.ev('() => App.engine.restDayInfo(App.getState()).rule') == 'overlap'
            assert s.ev('() => App.engine.nextSession(App.getState()).key') == '2026-10-07'

        cases = [('W1 setup',setup),('W2 all frequencies',all_choices),('W3 weekly goal and rollover',weekly_target),
                 ('W4 six-day split',split_week),('W5 accessory recovery',overlap),('W6 five-day split',lambda s:split_week(s,5)),
                 ('W7 unfinished workout',active_workout),('W8 local week in Los Angeles',western_timezone),
                 ('W9 extended Upper recovery',extended_upper)]
        for name, check in cases:
            if selected != [''] and name.split()[0] not in selected: continue
            previous_tz = h.TZ
            try:
                if name.startswith('W8 '): h.TZ = 'America/Los_Angeles'
                run(name,check)
            finally:
                h.TZ = previous_tz
    raise SystemExit(1 if failures else 0)


if __name__ == '__main__':
    main()
