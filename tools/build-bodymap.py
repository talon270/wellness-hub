#!/usr/bin/env python3
"""Wellness Hub · body-map generator
===================================
  · reads   a clone of react-native-body-highlighter (MIT) at PINNED_SHA:
            assets/bodyFront.ts, assets/bodyBack.ts, components/SvgMaleWrapper.tsx
  · writes  fitness/bodymap.data.js                       window.BODY_MAP
  · writes  vendor/LICENSES/react-native-body-highlighter.txt  its licence, verbatim,
            under a line naming the repo, the commit and the files used

    git clone https://github.com/HichamELBSI/react-native-body-highlighter.git /tmp/rnbh
    git -C /tmp/rnbh checkout 8ed39ac2ae9cb46fb79d77eedec7e5b029a75174
    python3 tools/build-bodymap.py /tmp/rnbh

Needs Python Playwright with Chromium, the same as tools/check-workout.py: the
browser measures the curved paths, so nothing here re-implements SVG arcs. The
app never runs this; the two outputs are checked in. `node tools/check-bodymap.js`
checks them.

WHAT THE SOURCE DRAWING DOESN'T SPLIT, AND HOW IT'S CUT
    The source has 19 front and 16 back regions named for its own taxonomy. The
    app has 22 groups (fitness/muscles.data.js). Most map one to one (SLUGS). Five
    don't, and each is resolved here, not by hand-editing the output:
      · front delts / side delts: the front deltoid is one shape. It's cut by a
        line (CUTS), medial piece front, lateral piece side.
      · rear delts / side delts: the same on the back view, medial piece rear.
      · traps / upper back: the back trapezius runs from the neck to mid-back.
        Above the cut it's traps (what a shrug trains); below, the middle and
        lower fibres a row trains, so upper back.
      · lats / rotator cuff / upper back: the source's "upper-back" is three
        shapes per side. The big one is the lat, the one on the shoulder blade
        is where infraspinatus sits (rotator cuff), the crescent under it is
        teres major (upper back). Mapped top to bottom (BY_POSITION).
      · abductors: the source's "gluteal" is two shapes per side; the upper one
        is gluteus medius, the abductor. Mapped top to bottom.
    These are judgement calls about where one muscle ends on a stylised drawing,
    not anatomy measured from anything.

    A cut leaves a GAP-wide gutter, like the source's own, so the two pieces
    read as two regions. Cut pieces are straight-line polygons (sampled every
    STEP units, then simplified to within TOLERANCE), not the source's curves.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_JS = ROOT / "fitness" / "bodymap.data.js"
OUT_LICENCE = ROOT / "vendor" / "LICENSES" / "react-native-body-highlighter.txt"

REPO = "https://github.com/HichamELBSI/react-native-body-highlighter"
PINNED_SHA = "8ed39ac2ae9cb46fb79d77eedec7e5b029a75174"  # 2026-09-13, master

# Source slugs drawn with the outline, never as a muscle; then slug -> app group.
OUTLINE_ONLY = {"head", "hair", "hands", "feet", "knees", "ankles"}
SLUGS = {
    "front": {"chest": "chest", "obliques": "obliques", "abs": "abs", "biceps": "biceps",
              "triceps": "triceps", "neck": "neck", "trapezius": "traps",
              "adductors": "adductors", "quadriceps": "quads", "tibialis": "shins",
              "calves": "calves", "forearm": "forearms"},
    "back": {"neck": "neck", "triceps": "triceps", "lower-back": "lower_back",
             "forearm": "forearms", "gluteal": "glutes", "adductors": "adductors",
             "hamstring": "hamstrings", "calves": "calves"},
}
# (view, slug) -> groups, top to bottom, where one slug holds several muscles.
# Ordered by each shape's top edge, not the source's array order: the left and
# right arrays of "upper-back" list their three shapes in different orders.
BY_POSITION = {
    ("back", "upper-back"): ["rotator_cuff", "upper_back", "lats"],
    ("back", "gluteal"): ["abductors", "glutes"],
}
# (view, slug) -> a line (x0, y0, x1, y1) drawn on the figure's image-left
# piece, and the group on each side of it. The image-right piece is cut by the
# mirror image, so both sides split the same way. "a" is the side on your
# right as you walk the line from (x0, y0) to (x1, y1) on screen (y points
# down): lateral for the two deltoid lines, below for the trapezius one.
CUTS = {
    ("front", "deltoids"): {"line": (240, 300, 210, 398), "a": "delts_side", "b": "delts_front"},
    ("back", "deltoids"): {"line": (934, 300, 926, 400), "a": "delts_side", "b": "delts_rear"},
    ("back", "trapezius"): {"line": (990, 340, 1090, 340), "a": "upper_back", "b": "traps"},
}
GAP = 4.0          # gutter width at a cut, in source units (the source's own run ~4-6)
STEP = 1.5         # sampling interval along a cut path
TOLERANCE = 0.35   # simplification tolerance; well under a pixel at any app size
MARGIN = 8         # viewBox padding around the outline


def die(msg: str) -> None:
    print(f"build-bodymap: {msg}", file=sys.stderr)
    sys.exit(1)


def ts_array(text: str) -> list:
    """The asset files are a JS array literal with comments, bare keys and
    trailing commas. Normalise those three things and it's JSON."""
    body = text[text.index("=", text.index("export const")) + 1:].strip().rstrip(";")
    body = re.sub(r"^\s*//.*$", "", body, flags=re.M)
    body = re.sub(r"([{,]\s*)([A-Za-z_]\w*)\s*:", r'\1"\2":', body)
    body = re.sub(r",(\s*[}\]])", r"\1", body)
    return json.loads(body)


def outlines(wrapper: str) -> dict:
    ds = re.findall(r'\bd="([^"]+)"', wrapper)
    if len(ds) != 2:
        die(f"expected 2 outline paths in SvgMaleWrapper.tsx, found {len(ds)}")
    return {"front": ds[0], "back": ds[1]}


def clip(poly: list, a: tuple, b: tuple, offset: float) -> list:
    """Sutherland-Hodgman against one half-plane: keep points left of a->b,
    shifted `offset` into that side. Exact for any subject cut by one line."""
    (ax, ay), (bx, by) = a, b
    dx, dy = bx - ax, by - ay
    n = (dx * dx + dy * dy) ** 0.5

    def side(p):  # > 0: kept
        return ((p[0] - ax) * dy - (p[1] - ay) * dx) / -n - offset

    out = []
    for i, cur in enumerate(poly):
        prev = poly[i - 1]
        sc, sp = side(cur), side(prev)
        if sc >= 0:
            if sp < 0:
                t = sp / (sp - sc)
                out.append((prev[0] + t * (cur[0] - prev[0]), prev[1] + t * (cur[1] - prev[1])))
            out.append(cur)
        elif sp >= 0:
            t = sp / (sp - sc)
            out.append((prev[0] + t * (cur[0] - prev[0]), prev[1] + t * (cur[1] - prev[1])))
    return out


def simplify(pts: list, tol: float) -> list:
    """Ramer-Douglas-Peucker on an open polyline."""
    if len(pts) < 3:
        return pts
    (ax, ay), (bx, by) = pts[0], pts[-1]
    dx, dy = bx - ax, by - ay
    n = (dx * dx + dy * dy) ** 0.5 or 1e-9
    i, far = 0, -1.0
    for k in range(1, len(pts) - 1):
        d = abs((pts[k][0] - ax) * dy - (pts[k][1] - ay) * dx) / n
        if d > far:
            i, far = k, d
    if far <= tol:
        return [pts[0], pts[-1]]
    return simplify(pts[: i + 1], tol)[:-1] + simplify(pts[i:], tol)


def num(v: float) -> str:
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


def poly_d(pts: list) -> str:
    # Simplify as a closed ring: split at the point farthest from the first.
    far = max(range(len(pts)), key=lambda k: (pts[k][0] - pts[0][0]) ** 2 + (pts[k][1] - pts[0][1]) ** 2)
    ring = simplify(pts[: far + 1], TOLERANCE)[:-1] + simplify(pts[far:] + [pts[0]], TOLERANCE)[:-1]
    return "M" + " ".join(f"{num(x)} {num(y)}" for x, y in ring) + "Z"


def main() -> None:
    if len(sys.argv) != 2:
        die("usage: python3 tools/build-bodymap.py <clone of react-native-body-highlighter>")
    src = Path(sys.argv[1])
    sha = subprocess.run(["git", "-C", str(src), "rev-parse", "HEAD"],
                         capture_output=True, text=True).stdout.strip()
    if sha != PINNED_SHA:
        die(f"clone is at {sha or '(not a git checkout)'}, the map is pinned to {PINNED_SHA}")

    views = {"front": ts_array((src / "assets/bodyFront.ts").read_text()),
             "back": ts_array((src / "assets/bodyBack.ts").read_text())}
    outline = outlines((src / "components/SvgMaleWrapper.tsx").read_text())

    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page()
        page.set_content('<svg xmlns="http://www.w3.org/2000/svg"><path id="p"/></svg>')

        def bbox(d: str) -> list:
            return page.evaluate("""d => { const p = document.getElementById('p');
                p.setAttribute('d', d); const b = p.getBBox();
                return [b.x, b.y, b.width, b.height]; }""", d)

        def sample(d: str) -> list:
            return page.evaluate("""([d, step]) => { const p = document.getElementById('p');
                p.setAttribute('d', d); const L = p.getTotalLength(), out = [];
                for (let s = 0; s < L; s += step) { const q = p.getPointAtLength(s); out.push([q.x, q.y]); }
                return out; }""", [d, STEP])

        data = {"viewBox": {}, "front": [], "back": [], "outline": {}}
        seen = set()
        for view, regions in views.items():
            # The silhouette stops at the ears; the head shape sits above it.
            boxes = [bbox(d) for d in [outline[view]] + [d for r in regions
                     for ds in (r.get("path") or {}).values() for d in ds]]
            x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes)
            ob = [x0, y0, max(b[0] + b[2] for b in boxes) - x0, max(b[1] + b[3] for b in boxes) - y0]
            data["viewBox"][view] = " ".join(num(v) for v in (
                ob[0] - MARGIN, ob[1] - MARGIN, ob[2] + 2 * MARGIN, ob[3] + 2 * MARGIN))
            centre = ob[0] + ob[2] / 2
            parts, merged = [], {}  # merged: (group, side) -> [d]
            for r in regions:
                slug, paths = r["slug"], r.get("path") or {}
                key = (view, slug)
                seen.add(key)
                if slug in OUTLINE_ONLY:
                    parts += [d for ds in paths.values() for d in ds]
                    continue
                for side, ds in paths.items():
                    s = {"left": "l", "right": "r", "common": "c"}[side]
                    if key in CUTS:
                        cut = CUTS[key]
                        for d in ds:
                            if len(re.findall(r"[Mm]", d)) != 1:
                                die(f"{view} {slug} {side}: a cut needs one subpath")
                            b = bbox(d)
                            x0, y0, x1, y1 = cut["line"]
                            mirror = b[0] + b[2] / 2 > centre
                            if mirror:  # the same line, reflected about the figure's centre
                                x0, x1 = 2 * centre - x0, 2 * centre - x1
                            pts = sample(d)
                            # A reflection reverses the line's handedness, so the
                            # forward clip keeps "b" on the mirrored piece.
                            fwd, rev = (cut["b"], cut["a"]) if mirror else (cut["a"], cut["b"])
                            for g, (p, q) in ((fwd, ((x0, y0), (x1, y1))), (rev, ((x1, y1), (x0, y0)))):
                                piece = clip(pts, p, q, GAP / 2)
                                if len(piece) < 3:
                                    die(f"{view} {slug} {side}: the cut leaves nothing for {g}")
                                merged.setdefault((g, s), []).append(poly_d(piece))
                    elif key in BY_POSITION:
                        groups = BY_POSITION[key]
                        if len(ds) != len(groups):
                            die(f"{view} {slug} {side}: {len(ds)} paths, BY_POSITION names {len(groups)}")
                        for g, d in zip(groups, sorted(ds, key=lambda d: bbox(d)[1])):
                            merged.setdefault((g, s), []).append(d)
                    elif slug in SLUGS[view]:
                        merged.setdefault((SLUGS[view][slug], s), []).extend(ds)
                    else:
                        die(f"{view}: source region '{slug}' has no mapping; add it to SLUGS or OUTLINE_ONLY")
            v = view[0]
            data[view] = [{"id": f"{v}-{g}-{s}", "group": g, "d": "".join(ds)}
                          for (g, s), ds in merged.items()]
            data["outline"][view] = {"body": outline[view], "parts": parts}
        browser.close()

    stale = [k for k in list(CUTS) + list(BY_POSITION) if k not in seen]
    if stale:
        die(f"mapped regions missing from the source: {stale}")

    header = f"""/* ============================================================================
   BASALT · BODY MAP DATA  —  GENERATED, DO NOT EDIT
   ----------------------------------------------------------------------------
   Written by tools/build-bodymap.py from react-native-body-highlighter (MIT,
   {REPO})
   at commit {PINNED_SHA}, its male figure.
   Licence: vendor/LICENSES/react-native-body-highlighter.txt. Edit the script,
   not this file.

   GLOBALS EXPOSED
     window.BODY_MAP = {{
       source   {{ repo, sha, licence }}
       viewBox  {{ front, back }}         each view's own box, in source units
       front    [{{ id, group, d }}]      one region per group and body side;
       back     [{{ id, group, d }}]      `group` is a MUSCLE_GROUPS key
       outline  {{ front, back }}          {{ body: silhouette d, parts: [d] }} —
                                         head, hands, feet, knees, ankles:
                                         drawn, never a muscle, never tappable
     }}

   Three source shapes are cut in two by a line (front deltoid, back deltoid,
   trapezius), and two source names that hold several shapes are divided by
   position ("upper-back" into rotator cuff, upper back and lats; "gluteal"
   into abductors and glutes). The script's docstring says why. The splits are
   judgement on a stylised drawing, not measured anatomy.
   `node tools/check-bodymap.js` checks this file against the 22 groups.
   ========================================================================== */
"""
    data = {"source": {"repo": REPO, "sha": PINNED_SHA,
                       "licence": "vendor/LICENSES/react-native-body-highlighter.txt"}, **data}
    OUT_JS.write_text(header + "(function () {\n  \"use strict\";\n  window.BODY_MAP = "
                      + json.dumps(data, indent=1) + ";\n})();\n")
    OUT_LICENCE.parent.mkdir(parents=True, exist_ok=True)
    OUT_LICENCE.write_text(
        f"fitness/bodymap.data.js is derived from react-native-body-highlighter,\n"
        f"{REPO}, commit {PINNED_SHA}\n"
        f"(assets/bodyFront.ts, assets/bodyBack.ts, components/SvgMaleWrapper.tsx).\n"
        f"Its licence follows, unchanged.\n\n" + (src / "LICENSE").read_text())
    n = {v: len(data[v]) for v in ("front", "back")}
    print(f"wrote {OUT_JS.relative_to(ROOT)} ({OUT_JS.stat().st_size} bytes): "
          f"{n['front']} front + {n['back']} back regions, "
          f"{len({r['group'] for v in ('front', 'back') for r in data[v]})} groups")
    print(f"wrote {OUT_LICENCE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
