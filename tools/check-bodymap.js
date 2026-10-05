#!/usr/bin/env node
/**
 * Checks fitness/bodymap.data.js — the body-map drawing — against the 22 muscle
 * groups, its licence and its own geometry (plan E1, case D1).
 *
 *   node tools/check-bodymap.js
 *   BODYMAP_JS=/path/to/other/bodymap.data.js node tools/check-bodymap.js
 *
 * Prints one `<check> OK|FAIL — <what was measured>` line per check and exits 1
 * if any fails. "Paths parse" is a strict reading of the SVG path grammar,
 * including packed arc flags ("a1 1 0 012 3"), not a browser's forgiving one: a
 * browser draws a path up to its first error and silently drops the rest.
 * The box check uses every point the path names, control points included, so it
 * can only over-estimate a shape; a region outside its view's box is a back
 * shape in the front view, or a broken edit.
 */

"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const target = process.env.BODYMAP_JS || path.join(root, "fitness/bodymap.data.js");
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of ["fitness/muscles.data.js", target]) {
  vm.runInContext(fs.readFileSync(path.resolve(root, f), "utf8"), sandbox, { filename: f });
}
const M = sandbox.window.BODY_MAP;
const GROUPS = sandbox.window.MUSCLE_GROUPS.map((g) => g.key);
const VIEWS = ["front", "back"];
let failed = 0;
function report(name, problems, okText) {
  if (problems.length) { failed++; console.log(`${name} FAIL — ${problems.slice(0, 8).join("; ")}${problems.length > 8 ? ` (+${problems.length - 8} more)` : ""}`); }
  else console.log(`${name} OK — ${okText}`);
}

/* Parse a path; return { error } or { box: [minX, minY, maxX, maxY] }. */
const ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
function parsePath(d) {
  let i = 0, cmd = null, cx = 0, cy = 0, sx = 0, sy = 0;
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  const see = (x, y) => { box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y); };
  const skip = () => { while (i < d.length && /[\s,]/.test(d[i])) i++; };
  const NUM = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y;
  const number = () => { skip(); NUM.lastIndex = i; const m = NUM.exec(d); if (!m) return null; i = NUM.lastIndex; return +m[0]; };
  const flag = () => { skip(); const c = d[i]; if (c !== "0" && c !== "1") return null; i++; return +c; };
  skip();
  if (!/[Mm]/.test(d[i] || "")) return { error: "doesn't start with M" };
  while (true) {
    skip();
    if (i >= d.length) break;
    if (/[A-Za-z]/.test(d[i])) {
      cmd = d[i++];
      if (!(cmd.toUpperCase() in ARITY)) return { error: `unknown command '${cmd}' at ${i - 1}` };
      if (cmd.toUpperCase() === "Z") { cx = sx; cy = sy; continue; }
    } else if (cmd === null || cmd.toUpperCase() === "Z") {
      return { error: `a number with no command at ${i}` };
    }
    const U = cmd.toUpperCase(), rel = cmd !== U, a = [];
    for (let k = 0; k < ARITY[U]; k++) {
      const v = U === "A" && (k === 3 || k === 4) ? flag() : number();
      if (v === null) return { error: `'${cmd}' needs ${ARITY[U]} values, bad value ${k + 1} at ${i}` };
      a.push(v);
    }
    const ox = rel ? cx : 0, oy = rel ? cy : 0;
    if (U === "H") { cx = ox + a[0]; see(cx, cy); }
    else if (U === "V") { cy = oy + a[0]; see(cx, cy); }
    else {
      const pts = U === "A" ? [a[5], a[6]] : a, px = cx, py = cy;
      for (let k = 0; k < pts.length; k += 2) see(ox + pts[k], oy + pts[k + 1]);
      cx = ox + pts[pts.length - 2]; cy = oy + pts[pts.length - 1];
      if (U === "A") {
        // A small arc (≤ 180°) bulges at most half its chord from the chord's
        // middle. A large one fits in a circle of its radius, which the SVG
        // spec scales up to at least half the chord.
        const half = Math.hypot(cx - px, cy - py) / 2;
        const r = a[3] ? Math.max(Math.abs(a[0]), Math.abs(a[1]), half) * 2 : half;
        const mx = (px + cx) / 2, my = (py + cy) / 2;
        see(mx - r, my - r); see(mx + r, my + r);
      }
    }
    if (U === "M") { sx = cx; sy = cy; cmd = rel ? "l" : "L"; }   // extra pairs after M are lines
  }
  return { box };
}

/* 1. Shape */
const shape = [];
if (!M) shape.push("window.BODY_MAP is missing");
else {
  for (const v of VIEWS) {
    if (!Array.isArray(M[v]) || !M[v].length) shape.push(`${v} has no regions`);
    if (!/^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/.test((M.viewBox || {})[v] || "")) shape.push(`viewBox.${v} isn't "x y w h"`);
    const o = (M.outline || {})[v];
    if (!o || typeof o.body !== "string" || !Array.isArray(o.parts)) shape.push(`outline.${v} needs { body, parts[] }`);
  }
}
if (shape.length) { report("shape", shape); process.exit(1); }
const regions = VIEWS.flatMap((v) => M[v].map((r) => Object.assign({ view: v }, r)));
report("shape", shape, `${M.front.length} front + ${M.back.length} back regions, ${M.outline.front.parts.length + M.outline.back.parts.length} outline parts`);

/* 2. Every group has a region; every region names a group */
const unknown = regions.filter((r) => !GROUPS.includes(r.group)).map((r) => `${r.id}: unknown group '${r.group}'`);
const missing = GROUPS.filter((g) => !regions.some((r) => r.group === g)).map((g) => `${g} has no region`);
report("groups", unknown.concat(missing), `all ${GROUPS.length} groups drawn, every region names one of them; ` +
  `front only: ${GROUPS.filter((g) => regions.some((r) => r.group === g && r.view === "front") && !regions.some((r) => r.group === g && r.view === "back")).join(", ")}; ` +
  `back only: ${GROUPS.filter((g) => regions.some((r) => r.group === g && r.view === "back") && !regions.some((r) => r.group === g && r.view === "front")).join(", ")}`);

/* 3. Ids */
const seen = new Set(), ids = [];
for (const r of regions) {
  if (typeof r.id !== "string" || !r.id) ids.push(`a ${r.view} region has no id`);
  else if (seen.has(r.id)) ids.push(`duplicate id ${r.id}`);
  seen.add(r.id);
}
report("ids", ids, `${seen.size} unique`);

/* 4. Paths parse and sit inside their view */
const geo = [];
let count = 0;
for (const v of VIEWS) {
  const [x, y, w, h] = M.viewBox[v].split(" ").map(Number);
  const all = M[v].map((r) => [r.id, r.d]).concat([[`outline.${v}.body`, M.outline[v].body]],
    M.outline[v].parts.map((d, k) => [`outline.${v}.parts[${k}]`, d]));
  for (const [name, d] of all) {
    count++;
    if (typeof d !== "string") { geo.push(`${name}: no path`); continue; }
    const p = parsePath(d);
    if (p.error) { geo.push(`${name}: ${p.error}`); continue; }
    const [x0, y0, x1, y1] = p.box, e = 0.5;
    if (x0 < x - e || y0 < y - e || x1 > x + w + e || y1 > y + h + e)
      geo.push(`${name}: spans ${[x0, y0, x1, y1].map((n) => n.toFixed(1)).join(",")}, outside ${v}'s box ${M.viewBox[v]}`);
  }
}
report("paths", geo, `${count} paths parse and sit inside their view's box`);

/* 5. Licence and pinned source */
const lic = [];
const src = M.source || {};
if (!/^[0-9a-f]{40}$/.test(src.sha || "")) lic.push(`source.sha '${src.sha}' isn't a full commit id`);
const licPath = path.join(root, src.licence || "vendor/LICENSES/react-native-body-highlighter.txt");
if (!fs.existsSync(licPath)) lic.push(`${path.relative(root, licPath)} is missing`);
else {
  const t = fs.readFileSync(licPath, "utf8");
  if (!/MIT License/.test(t) || !/Permission is hereby granted, free of charge/.test(t)) lic.push("the licence file doesn't hold the MIT text");
  if (src.sha && !t.includes(src.sha)) lic.push("the licence file doesn't name the pinned commit");
  if (src.repo && !t.includes(src.repo)) lic.push("the licence file doesn't name the source repo");
}
report("licence", lic, `MIT text shipped, commit ${(src.sha || "").slice(0, 12)} named in both`);

/* 6. Shipped: loaded by the page and cached for offline */
const ship = [];
const rel = "fitness/bodymap.data.js";
if (!fs.readFileSync(path.join(root, "index.html"), "utf8").includes(`src="${rel}"`)) ship.push(`index.html has no <script src="${rel}">`);
if (!fs.readFileSync(path.join(root, "service-worker.js"), "utf8").includes(`"./${rel}"`)) ship.push(`service-worker.js PRECACHE lacks ./${rel}`);
report("shipped", ship, "script tag and PRECACHE entry present");

if (failed) { console.log(`${failed} check(s) failed`); process.exit(1); }
console.log("all passed");
