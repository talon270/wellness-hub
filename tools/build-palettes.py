#!/usr/bin/env python3
"""Wellness Hub · palette generator
==================================
  · reads   ../Themes/*.txt   (Material-style token dumps, one per terminal theme)
  · writes  css/palettes.css        one token block per palette; the default is also :root
  · writes  js/palettes.data.js     the picker's swatch metadata (window.WH_PALETTES)

Run it from anywhere:  python3 tools/build-palettes.py
Standard library only, so it needs no .venv. The app never runs this — it opens
from file:// with the two generated files checked in. Re-run it when a file in
Themes/ changes.

WHAT THE THEME FILES ARE NOT
    Measured on all 20 (PLAN-neumorphism.md A1-A3), so the generator computes
    what they cannot supply instead of trusting them:
      · `background` and `surface` are #000000 in 20/20. Neumorphic depth needs
        a highlight on one side and a shadow on the other; on black the shadow
        has nowhere to go (0.00 L* of separation on Selene). The ground is
        therefore `surfaceVariant` — the file's own hue — capped at 20%
        saturation and lifted to CIE L* 16, where the shadow reads at -10.3 L*.
      · `error`, `success` and `primary` are the same value in 20/20. Status
        colours come from one fixed set, nudged only until each clears 4.5:1 on
        this palette's ground.
      · `onPrimary` reaches 4.5:1 on `primary` in 1/20 (Selene: 1.25:1). Text on
        an accent fill is black or white, whichever scores higher.
      · the accent fails 4.5:1 as TEXT on the lifted ground in 5/20. Accent-as-text
        is the accent mixed toward the page text colour until it passes.

    A palette that cannot reach its floors makes this script exit non-zero and
    write nothing, so a bad theme file can never ship a page nobody can read.

    A rank in the table it prints means "readable", not "attractive".
"""
from __future__ import annotations

import colorsys
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent                      # .../Helth
THEMES = ROOT.parent / "Themes"         # .../Claude/Themes — outside the repo, so baked in
DEFAULT_ID = "selene"                   # the palette that is also :root (no flash before JS)
LIGHT_ID = "selene-day"                 # derived from selene.txt; the folder has no light theme

# ---- floors ---------------------------------------------------------------
TEXT_MIN = 4.5      # WCAG 1.4.3, body text and status colours used as text
CTL_MIN = 3.0       # WCAG 1.4.11, the visible edge of a control

# ---- ground ---------------------------------------------------------------
GROUND_L_DARK = 16.0    # CIE L*. 0 -> shadow invisible; 6 -> -3.6; 15.6 -> -10.3 (probe)
GROUND_L_LIGHT = 92.0
GROUND_SAT_CAP = 0.20   # uncapped, akira's ground came out #441A24 (maroon), not a neutral

# ---- soft-UI edge tones ---------------------------------------------------
# Ground-relative overlays, so one pair serves every hue. Selene measured
# highlight/ground 1.24:1 and shadow/ground 1.27:1 — well under the 3:1 a
# control edge needs, which is why css/neumorph.css adds a hairline (--wh-ctl).
NM_DARK = ("rgba(255,255,255,.07)", "rgba(0,0,0,.55)")
NM_LIGHT = ("rgba(255,255,255,.80)", "rgba(70,92,112,.30)")

# ---- fixed status hues, never read from a theme file -----------------------
# Values already vetted in the ochre palettes (charcoal for dark, paper for light).
STATUS_DARK = {"red": "F0736B", "green": "8FC77A", "yellow": "F0A038", "blue": "7FB2E5",
               "purple": "C49BE0", "aqua": "6FCBBE", "orange": "EE8A4F"}
STATUS_LIGHT = {"red": "B3261E", "green": "2E6B34", "yellow": "8A5A00", "blue": "1F5F99",
                "purple": "7A3F8F", "aqua": "0F6B62", "orange": "A24A00"}

SECTIONS = ["dashboard", "fitness", "desk", "mobility", "eyecare", "dental", "bodycare",
            "wellness", "repro", "health", "insights", "achievements"]

RGB = tuple  # (r, g, b) ints 0-255


# ---- colour maths -----------------------------------------------------------
def parse(h: str) -> RGB:
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def hexs(c: RGB) -> str:
    return "#%02X%02X%02X" % tuple(max(0, min(255, round(x))) for x in c)


def triplet(c: RGB) -> str:
    return "%d,%d,%d" % tuple(max(0, min(255, round(x))) for x in c)


def _lin(v: float) -> float:
    v /= 255
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def luminance(c: RGB) -> float:
    r, g, b = (_lin(x) for x in c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: RGB, b: RGB) -> float:
    ya, yb = luminance(a), luminance(b)
    return (max(ya, yb) + 0.05) / (min(ya, yb) + 0.05)


def lstar(c: RGB) -> float:
    y = luminance(c)
    return 116 * y ** (1 / 3) - 16 if y > 0.008856 else 903.3 * y


def mix(a: RGB, b: RGB, t: float) -> RGB:
    """t=0 -> a, t=1 -> b, in sRGB — enough for ramps that only need to be monotonic."""
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def lift(c: RGB, target_l: float, sat_cap: float) -> RGB:
    """Keep c's hue, cap its saturation, bisect HLS lightness to hit a CIE L*."""
    h, _l, s = colorsys.rgb_to_hls(*(x / 255 for x in c))
    s = min(s, sat_cap)
    lo, hi = 0.0, 1.0
    for _ in range(40):
        m = (lo + hi) / 2
        cand = tuple(round(x * 255) for x in colorsys.hls_to_rgb(h, m, s))
        if lstar(cand) < target_l:
            lo = m
        else:
            hi = m
    return tuple(round(x * 255) for x in colorsys.hls_to_rgb(h, (lo + hi) / 2, s))


def ensure(fg: RGB, bgs, floor: float, toward: RGB) -> RGB:
    """Mix fg toward `toward` in 2% steps until it clears `floor` on EVERY surface in
    `bgs` (a single colour is accepted). Text sits on the ground, on hover/well tints
    and on the darker or lighter bg1 chips — measured on Selene Day, muted text that
    cleared 4.5:1 on the ground was 4.15:1 on bg1, so the floor has to hold on the worst one."""
    if isinstance(bgs[0], int):
        bgs = [bgs]
    for step in range(51):
        # Round BEFORE testing: the value written to CSS is the rounded one, and
        # 4.4997 rounds up to "passes" on the unrounded number and fails on the page.
        cand = tuple(round(x) for x in mix(fg, toward, step * 0.02))
        if min(contrast(cand, b) for b in bgs) >= floor:
            return cand
    raise ValueError(f"{hexs(fg)} cannot reach {floor}:1 on {[hexs(b) for b in bgs]} moving toward {hexs(toward)}")


def on_fill(fill: RGB) -> RGB:
    black, white = (0, 0, 0), (255, 255, 255)
    return black if contrast(black, fill) >= contrast(white, fill) else white


# ---- theme files ------------------------------------------------------------
def load(path: Path) -> dict[str, str]:
    d: dict[str, str] = {}
    for line in path.read_text().splitlines():
        p = line.split()
        if len(p) == 2:
            d[p[0]] = p[1]
    return d


def build(pid: str, label: str, ground: RGB, text: RGB, accent: RGB, muted: RGB,
          status: dict[str, str], dark: bool, source: str) -> dict:
    """Everything the app reads for one palette, as a flat token dict plus a report row."""
    white, black = (255, 255, 255), (0, 0, 0)
    bg = ground
    push = white if dark else black          # the direction "more contrast" goes
    pull = black if dark else white          # the direction the sunk/deep tones go

    # Every surface text can land on: the ground, a hover/nav tint (bg1) and a well (bg0-soft).
    surfaces = [bg, mix(bg, push, 0.07), mix(bg, pull, 0.07)]

    fg1 = text
    fg0 = mix(text, push, 0.5)
    fg2 = mix(text, bg, 0.22)
    fg3 = ensure(muted, surfaces, TEXT_MIN, text)
    fg4 = ensure(mix(muted, bg, 0.25), surfaces, TEXT_MIN, text)
    gray = fg4
    ctl = ensure(mix(bg, text, 0.30), bg, CTL_MIN, text)

    accent_text = ensure(accent, surfaces, TEXT_MIN, text)
    on_accent = on_fill(accent)
    # Hover moves the fill AWAY from the label: black text -> a lighter fill, white text -> a darker one. The first
    # version mixed toward the page's brightest colour whatever the label was, which lowered white-on-fill to 4.31:1
    # on arasaka and 4.37:1 on andromeda — both take white text — and nothing had driven a hover to notice.
    hover = mix(accent, white if on_accent == black else black, 0.12)

    st = {k: ensure(parse(v), surfaces, TEXT_MIN, push) for k, v in status.items()}

    t: dict[str, str] = {}
    t["color-scheme"] = "dark" if dark else "light"
    # Cards share the page ground — that is the point of the style. Depth comes
    # from shadow, so the ramp below is only for hover, hairlines and wells.
    ramp = [("bg0-hard", bg), ("bg0", bg), ("bg0-soft", mix(bg, pull, 0.07)),
            ("bg1", mix(bg, push, 0.07)), ("bg2", mix(bg, push, 0.13)),
            ("bg3", mix(bg, push, 0.24)), ("bg4", mix(bg, push, 0.42))]
    for k, v in ramp:
        t[k] = hexs(v)
    t["wh-bg-deep"] = hexs(mix(bg, pull, 0.55))
    for k, v in [("fg0", fg0), ("fg1", fg1), ("fg2", fg2), ("fg3", fg3), ("fg4", fg4), ("gray", gray)]:
        t[k] = hexs(v)
    for k, v in st.items():
        t[k] = hexs(v)
        t[f"{k}-bright"] = hexs(v)
        t[f"{k}-bright-rgb"] = triplet(v)
    t["yellow-rgb"] = triplet(st["yellow"])
    t["fg1-rgb"] = triplet(fg1)
    t["fg4-rgb"] = triplet(fg4)
    # BASALT's raised-surface ramp. Same ground everywhere; the darker steps are wells.
    t["ink-1000"] = hexs(mix(bg, pull, 0.55))
    t["ink-850"] = hexs(mix(bg, pull, 0.04))
    t["ink-800"] = hexs(bg)
    t["ink-750"] = hexs(bg)
    t["ink-700"] = hexs(mix(bg, pull, 0.07))
    t["ink-650"] = hexs(mix(bg, push, 0.07))
    t["ink-600"] = hexs(mix(bg, push, 0.13))
    # BASALT brand ramp: --primary is the accent as text and line.
    t["primary"] = hexs(accent_text)
    t["primary-rgb"] = triplet(accent_text)
    t["primary-600"] = hexs(mix(accent, push, 0.15))
    t["primary-700"] = hexs(mix(accent, pull, 0.20))
    t["primary-ink"] = hexs(on_accent)
    t["primary-soft"] = "rgba(%s,.16)" % triplet(accent_text)
    t["primary-glow"] = "rgba(0,0,0,.45)"
    t["line"] = "rgba(%s,.16)" % triplet(fg4)
    t["line-2"] = "rgba(%s,.30)" % triplet(fg4)
    # Read by css/neumorph.css.
    t["wh-accent-fill"] = hexs(accent)
    t["wh-on-accent"] = hexs(on_accent)
    t["wh-accent-hover"] = hexs(hover)
    t["wh-ctl"] = hexs(ctl)
    t["wh-focus"] = hexs(accent_text)
    hi, lo = NM_DARK if dark else NM_LIGHT
    t["nm-hi"], t["nm-lo"] = hi, lo
    # One accent everywhere; sections are told apart by label and position.
    for s in SECTIONS:
        t[f"wh-c-{s}"] = hexs(accent_text)
    t["wh-c-settings"] = hexs(fg3)

    checks = [
        ("text on ground", contrast(fg1, bg), TEXT_MIN),
        ("muted text", min(contrast(fg3, x) for x in surfaces), TEXT_MIN),
        ("label text", min(contrast(fg4, x) for x in surfaces), TEXT_MIN),
        ("accent as text", min(contrast(accent_text, x) for x in surfaces), TEXT_MIN),
        ("text on accent fill", contrast(on_accent, accent), TEXT_MIN),
        ("text on accent fill, hovered", contrast(on_accent, hover), TEXT_MIN),
        ("control hairline", contrast(ctl, bg), CTL_MIN),
    ] + [(f"{k} as text", min(contrast(v, x) for x in surfaces), TEXT_MIN) for k, v in st.items()]
    bad = [(n, r, f) for n, r, f in checks if r + 1e-9 < f]

    return {
        "id": pid, "label": label, "tokens": t, "source": source, "bad": bad,
        "ground": bg, "accent": accent, "accent_text": accent_text, "text": fg1,
        "text_ratio": contrast(fg1, bg), "accent_ratio": contrast(accent_text, bg),
        "on_ratio": contrast(on_accent, accent),
        "swatch": {
            "bg": hexs(bg), "surface": hexs(mix(bg, push, 0.07)), "text": hexs(fg1),
            # accent, done, warning, info, danger — the picker's dot order
            "dots": [hexs(accent), hexs(st["green"]), hexs(st["yellow"]), hexs(st["blue"]), hexs(st["red"])],
        },
    }


def from_theme(path: Path) -> dict:
    d = load(path)
    pid = path.stem
    ground = lift(parse(d["surfaceVariant"]), GROUND_L_DARK, GROUND_SAT_CAP)
    return build(pid, pid.capitalize(), ground, parse(d["onBackground"]), parse(d["primary"]),
                 parse(d["onSurfaceVariant"]), STATUS_DARK, True, path.name)


def selene_day(path: Path) -> dict:
    """The folder has no light theme. Same hue, drawn from selene.txt's own tonal keys:
    ground from surfaceVariant, accent from tertiary_paletteKeyColor (455A64) and
    muted text from secondary_paletteKeyColor (78909C), text from the
    neutral-variant key (262E33). The plain `tertiary` is CFD8DC — the same
    light value as `primary` — which is why the key colours are used here."""
    d = load(path)
    ground = lift(parse(d["surfaceVariant"]), GROUND_L_LIGHT, 0.14)
    return build(LIGHT_ID, "Selene Day", ground, parse(d["neutral_variant_paletteKeyColor"]),
                 parse(d["tertiary_paletteKeyColor"]), parse(d["secondary_paletteKeyColor"]),
                 STATUS_LIGHT, False, path.name + " (derived)")


# ---- output -----------------------------------------------------------------
def block(p: dict, selector: str) -> str:
    lines = [f"{selector} {{"]
    for k, v in p["tokens"].items():
        lines.append(f"  color-scheme: {v};" if k == "color-scheme" else f"  --{k}: {v};")
    lines.append("}")
    return "\n".join(lines)


CSS_HEADER = """/* ============================================================================
   WELLNESS HUB · PALETTES  —  GENERATED, DO NOT EDIT
   ----------------------------------------------------------------------------
   Written by tools/build-palettes.py from ../Themes/*.txt. Edit the script or
   the theme file and re-run it; a hand edit here is overwritten.

   One block per palette, all defining the same token names css/hub.css and
   css/basalt-gruvbox.css read, so `data-theme` on <html> reskins the lot. The
   default palette (%(default)s) is also :root, so the page is correct before any
   script has run and a missing or unknown saved id still lands on it.

   Ground, status hues, on-accent text and accent-as-text are COMPUTED, not
   copied — the files carry a #000000 ground and identical error/success/primary
   in 20 of 20 (see the docstring in the generator and PLAN-neumorphism.md).
   ========================================================================== */
"""

JS_HEADER = """/* ============================================================================
   WELLNESS HUB · PALETTE DATA  —  GENERATED, DO NOT EDIT
   ----------------------------------------------------------------------------
   Written by tools/build-palettes.py. Swatch colours for the Settings picker,
   duplicated from css/palettes.css on purpose: a tile has to draw a palette
   that is not applied, and a CSS variable only reports the one in force.
   Order is the picker's order. Loaded before js/theme.js.
   ========================================================================== */
"""


def main(argv: list[str]) -> int:
    themes = Path(argv[1]) if len(argv) > 1 else THEMES
    files = sorted(themes.glob("*.txt"))
    if not files:
        print(f"no theme files in {themes}", file=sys.stderr)
        return 2
    pals = [from_theme(f) for f in files]
    by_id = {p["id"]: p for p in pals}
    if DEFAULT_ID not in by_id:
        print(f"default palette '{DEFAULT_ID}' is not in {themes}", file=sys.stderr)
        return 2
    pals.append(selene_day(themes / f"{DEFAULT_ID}.txt"))
    order = [DEFAULT_ID, LIGHT_ID] + sorted(p["id"] for p in pals if p["id"] not in (DEFAULT_ID, LIGHT_ID))
    pals = sorted(pals, key=lambda p: order.index(p["id"]))

    print(f"{'palette':<11}{'ground':<9}{'accent':<9}{'text':>7}{'acc/text':>10}{'on-fill':>9}  status")
    failed = False
    for p in pals:
        flag = "" if not p["bad"] else "  FAIL " + "; ".join(f"{n} {r:.2f}<{f}" for n, r, f in p["bad"])
        print(f"{p['id']:<11}{hexs(p['ground']):<9}{hexs(p['accent']):<9}{p['text_ratio']:7.2f}"
              f"{p['accent_ratio']:10.2f}{p['on_ratio']:9.2f}{flag}")
        failed = failed or bool(p["bad"])
    if failed:
        print("\nnothing written: at least one palette is under its contrast floor", file=sys.stderr)
        return 1

    css = CSS_HEADER % {"default": DEFAULT_ID}
    for p in pals:
        sel = f':root,\nhtml[data-theme="{p["id"]}"]' if p["id"] == DEFAULT_ID else f'html[data-theme="{p["id"]}"]'
        css += f"\n/* {p['label']} — {p['source']} */\n{block(p, sel)}\n"
    (ROOT / "css" / "palettes.css").write_text(css)

    meta = []
    for p in pals:
        note = (f"Accent {hexs(p['accent'])} on ground {hexs(p['ground'])}: "
                f"{p['accent_ratio']:.1f}:1 as text, {p['text_ratio']:.1f}:1 for body copy.")
        meta.append({"id": p["id"], "label": p["label"], "note": note, **p["swatch"]})
    js = (JS_HEADER + "window.WH_PALETTES = " + json.dumps(meta, indent=2) + ";\n"
          + f'window.WH_PALETTE_DEFAULT = "{DEFAULT_ID}";\n')
    (ROOT / "js" / "palettes.data.js").write_text(js)
    print(f"\nwrote css/palettes.css ({len(pals)} palettes) and js/palettes.data.js")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
