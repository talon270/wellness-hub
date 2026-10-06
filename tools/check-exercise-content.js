#!/usr/bin/env node
/**
 * Checks the written exercise guides in fitness/content/batch-*.js against the
 * exercise library and the style guide (plan E2, case D2;
 * fitness/content/STYLE.md).
 *
 *   node tools/check-exercise-content.js
 *   CONTENT_DIR=/path/to/other/content node tools/check-exercise-content.js
 *
 * Prints one `<check> OK|FAIL — <what was measured>` line per check and exits 1
 * if any fails.
 *
 * Coverage is per batch. A batch file marks itself "pending" or "complete":
 *   · complete — every exercise in its slots must have a guide;
 *   · pending  — it may be partial, but it FAILS once every guide is written,
 *     so the window that finishes a batch can't forget to mark it complete.
 * The plan's end state (D2: every id) is all four batches complete.
 *
 * The style guide's other rules — original wording, consistency with the
 * exercise's own cues — can't be checked by a script. A reviewer reads for them.
 */

"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const contentDir = process.env.CONTENT_DIR || path.join(root, "fitness/content");

/* Which slots each batch file owns (plan E2). The checker owns this map, not
   the batch files, so a batch can't widen its own scope. */
const BATCHES = {
  a:  ["push", "shoulder", "dip"],
  b:  ["row", "pull", "squat", "hinge", "core"],
  c1: ["curl", "lateral", "reardelt", "cuff", "traps", "neck", "grip"],
  c2: ["quad", "hamstring", "calf", "shin", "adductor", "abductor", "antirot", "backext"],
  d:  ["conditioning"]
};

/* Field rules. Lengths are characters per string; counts are list items. */
const TEXT = [15, 240];
const FIELDS = {
  summary:    { kind: "text", len: [40, 180] },
  setup:      { kind: "list", count: [2, 5] },
  steps:      { kind: "list", count: [3, 6] },
  breathing:  { kind: "text" },
  tempo:      { kind: "text" },
  feel:       { kind: "feel" },
  mistakes:   { kind: "mistakes", count: [2, 4] },
  safety:     { kind: "list", count: [1, 3] },
  // "Before you start": a self-check, never a gate. Required since plan step
  // 3.5 wrote it on the 150 guides that predated it.
  prereq:     { kind: "list", count: [1, 3], noDigits: true },
  variations: { kind: "variations", optional: true }
};

/* Banned phrases. Each is [pattern, why]. Case-insensitive. */
const BANNED = [
  // Medical claims: the app can't judge technique or diagnose (plan, Part E2).
  [/prevents? injur/, "medical claim"],
  [/injury[- ]proof|bullet ?proof/, "medical claim"],
  [/(fix|fixes|correct|corrects|improve|improves) (your )?posture/, "medical claim"],
  [/\bcures?\b|\bheals?\b|\brehab|therapeutic|clinically/, "medical claim"],
  [/pain[- ]free|safe for everyone|completely safe/, "medical claim"],
  [/burns? fat|\btoned?\b|spot[- ]reduc|\bdetox/, "fitness-marketing claim"],
  // House voice (Agents.md).
  [/revolutionary|seamless|powerful|\bleverage|\bdelve|\bultimate\b|game[- ]chang/, "hype word"],
  // Metric only.
  [/\b\d+(\.\d+)?\s*(in|inch|inches|lb|lbs|pounds?|ft|feet|foot)\b/, "imperial unit"],
  // The app's rule is the only source of a prescription: no rep ranges, set
  // counts, hold times or progression thresholds in the guide.
  [/\b\d+\s*(reps?|sets?)\b/, "restates reps or sets"],
  [/\b(ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty)\s+(reps?|sets?|seconds?)\b/, "restates a prescription"],
  [/\b(one|two|three|four|five|six|seven|eight|nine)\s+(reps|sets)\b/, "restates reps or sets"],
  [/\bsets? of\b/, "restates sets"],
  [/\b\d+\s*-?\s*(s|sec|secs|seconds?|minutes?|min)\b/, "restates a time; write tempo in words"],
  [/\b(advance|progress|move on|step up|level up)\s+(at|when|once)\b/, "restates the progression rule"]
];

/* ---- load ---- */
const sandbox = { window: {}, console, document: { readyState: "complete", addEventListener() {} } };
sandbox.window.App = { util: { escapeHtml: (s) => s }, registerView() {} };
vm.createContext(sandbox);
const basaltSrc = fs.readFileSync(path.join(root, "fitness/basalt.js"), "utf8");
for (const part of basaltSrc.split(/(?=\/\* ===== BASALT script block \d)/)) {
  if (/^\/\* ===== BASALT script block (2|7) /.test(part)) vm.runInContext(part, sandbox);
}
vm.runInContext(fs.readFileSync(path.join(root, "fitness/training.data.js"), "utf8"), sandbox);
const DB = sandbox.window.EXERCISE_DB;
const TD = sandbox.window.TRAINING_DATA;
const CAPABLE = new Set(TD.GRIPS.exercises);
const GRIP_IDS = new Set(TD.GRIPS.values.map((g) => g.id).filter((g) => g !== "palms"));
const slotOf = (id) => (TD.EXERCISES[id] || {}).slot;

let failed = 0;
function report(name, problems, okText) {
  if (problems.length) {
    failed++;
    console.log(`${name} FAIL — ${problems.slice(0, 10).join("; ")}${problems.length > 10 ? ` (+${problems.length - 10} more)` : ""}`);
  } else console.log(`${name} OK — ${okText}`);
}

/* Each batch runs in its own sandbox, so a guide written into the wrong file,
   or into two files, is visible. */
const loaded = {};   // batch -> { status, content }
const loadProblems = [];
for (const b of Object.keys(BATCHES)) {
  const file = path.join(contentDir, `batch-${b}.js`);
  if (!fs.existsSync(file)) { loadProblems.push(`batch-${b}.js missing`); continue; }
  const sb = { window: {} };
  vm.createContext(sb);
  try { vm.runInContext(fs.readFileSync(file, "utf8"), sb, { filename: file }); }
  catch (e) { loadProblems.push(`batch-${b}.js throws: ${e.message}`); continue; }
  const status = (sb.window.EXERCISE_CONTENT_BATCHES || {})[b];
  if (status !== "pending" && status !== "complete") loadProblems.push(`batch-${b}.js doesn't mark itself pending or complete (got ${JSON.stringify(status)})`);
  loaded[b] = { status, content: sb.window.EXERCISE_CONTENT || {} };
}
report("files", loadProblems, `${Object.keys(loaded).length} batch files load`);

/* ---- where each guide lives ---- */
const all = {};
const placeProblems = [];
for (const [b, { content }] of Object.entries(loaded)) {
  for (const id of Object.keys(content)) {
    if (!DB[id]) { placeProblems.push(`${id} (batch-${b}) isn't an exercise`); continue; }
    if (!BATCHES[b].includes(slotOf(id))) placeProblems.push(`${id} is a ${slotOf(id)} exercise, written in batch-${b}`);
    if (all[id]) placeProblems.push(`${id} is written twice`);
    all[id] = content[id];
  }
}
report("placement", placeProblems, `${Object.keys(all).length} guides, each in its slot's batch, none twice`);

/* ---- coverage ---- */
const covProblems = [], covLines = [];
for (const [b, slots] of Object.entries(BATCHES)) {
  if (!loaded[b]) continue;
  const ids = Object.keys(DB).filter((id) => slots.includes(slotOf(id)));
  const have = ids.filter((id) => loaded[b].content[id]);
  const missing = ids.filter((id) => !loaded[b].content[id]);
  covLines.push(`${b} ${have.length}/${ids.length} ${loaded[b].status}`);
  if (loaded[b].status === "complete" && missing.length) covProblems.push(`batch-${b} is marked complete but lacks ${missing.join(", ")}`);
  if (loaded[b].status === "pending" && !missing.length) covProblems.push(`batch-${b} has every guide; mark it complete`);
}
const unbatched = Object.keys(DB).filter((id) => !Object.values(BATCHES).some((s) => s.includes(slotOf(id))));
if (unbatched.length) covProblems.push(`no batch owns ${unbatched.join(", ")}`);
report("coverage", covProblems, `${Object.keys(all).length} of ${Object.keys(DB).length} exercises (${covLines.join(", ")})`);

/* ---- fields and lengths ---- */
const isText = (s, [lo, hi] = TEXT) =>
  typeof s !== "string" ? "isn't text"
  : s !== s.trim() ? "has stray whitespace"
  : s.length < lo || s.length > hi ? `is ${s.length} characters (${lo}–${hi})`
  : !/[.?!]$/.test(s) ? "doesn't end a sentence"
  : null;
const fieldProblems = [];
const texts = [];   // [id, where, text] for the phrase checks
for (const [id, c] of Object.entries(all)) {
  const bad = (where, msg) => fieldProblems.push(`${id}.${where} ${msg}`);
  const text = (where, s, len) => { const e = isText(s, len); if (e) bad(where, e); else texts.push([id, where, s]); };
  for (const k of Object.keys(c)) if (!FIELDS[k]) bad(k, "isn't a guide field");
  for (const [k, rule] of Object.entries(FIELDS)) {
    const v = c[k];
    if (v === undefined) { if (!rule.optional) bad(k, "is missing"); continue; }
    if (rule.kind === "text") text(k, v, rule.len);
    else if (rule.kind === "list" || rule.kind === "mistakes") {
      if (!Array.isArray(v)) { bad(k, "isn't a list"); continue; }
      if (v.length < rule.count[0] || v.length > rule.count[1]) bad(k, `has ${v.length} items (${rule.count[0]}–${rule.count[1]})`);
      v.forEach((item, i) => {
        if (rule.noDigits && /\d/.test(item)) bad(`${k}[${i}]`, "has a number; a prerequisite is words, not a prescription");
        if (rule.kind === "list") return text(`${k}[${i}]`, item);
        if (!item || typeof item !== "object" || Object.keys(item).sort().join() !== "fix,mistake") return bad(`${k}[${i}]`, "isn't { mistake, fix }");
        text(`${k}[${i}].mistake`, item.mistake);
        text(`${k}[${i}].fix`, item.fix);
      });
    } else if (rule.kind === "feel") {
      if (!v || typeof v !== "object" || Object.keys(v).sort().join() !== "should,shouldnt") { bad(k, "isn't { should, shouldnt }"); continue; }
      text("feel.should", v.should);
      text("feel.shouldnt", v.shouldnt);
    } else if (rule.kind === "variations") {
      if (!v || typeof v !== "object") { bad(k, "isn't an object"); continue; }
      for (const vk of Object.keys(v)) if (vk !== "grip" && vk !== "alternatives") bad(`variations.${vk}`, "isn't grip or alternatives");
    }
  }
}
report("fields", fieldProblems, `every guide has the E2 fields within their bounds (${texts.length} strings)`);

/* ---- phrases ---- */
const phraseProblems = [];
for (const [id, where, s] of texts) {
  for (const [re, why] of BANNED) {
    const m = s.match(new RegExp(re.source, "i"));
    if (m) phraseProblems.push(`${id}.${where}: "${m[0]}" (${why})`);
  }
}
report("phrases", phraseProblems, `${texts.length} strings, ${BANNED.length} banned patterns, 0 hits`);

/* ---- variations: ids resolve, grip sections only on capable ids ---- */
const varProblems = [];
let gripCount = 0, altCount = 0;
for (const [id, c] of Object.entries(all)) {
  const v = c.variations || {};
  if (v.grip !== undefined) {
    if (!CAPABLE.has(id)) varProblems.push(`${id} has a grip section but doesn't take a grip`);
    for (const [g, list] of Object.entries(v.grip || {})) {
      if (!GRIP_IDS.has(g)) varProblems.push(`${id}.variations.grip.${g} isn't a grip`);
      if (!Array.isArray(list) || list.length < 2 || list.length > 4) { varProblems.push(`${id}.variations.grip.${g} needs 2–4 lines`); continue; }
      list.forEach((s, i) => {
        const e = isText(s);
        if (e) varProblems.push(`${id}.variations.grip.${g}[${i}] ${e}`);
        else for (const [re, why] of BANNED) if (new RegExp(re.source, "i").test(s)) varProblems.push(`${id}.variations.grip.${g}[${i}] ${why}`);
      });
      gripCount++;
    }
  }
  if (CAPABLE.has(id) && !(v.grip && v.grip.knuckles)) varProblems.push(`${id} takes knuckles but has no grip.knuckles section`);
  if (v.alternatives !== undefined) {
    if (!Array.isArray(v.alternatives) || v.alternatives.length < 1 || v.alternatives.length > 4) { varProblems.push(`${id}.variations.alternatives needs 1–4 items`); continue; }
    v.alternatives.forEach((a, i) => {
      if (!a || Object.keys(a).sort().join() !== "id,text") return varProblems.push(`${id}.variations.alternatives[${i}] isn't { id, text }`);
      if (!DB[a.id]) varProblems.push(`${id}.variations.alternatives[${i}].id "${a.id}" isn't an exercise`);
      if (a.id === id) varProblems.push(`${id} lists itself as an alternative`);
      const e = isText(a.text);
      if (e) varProblems.push(`${id}.variations.alternatives[${i}].text ${e}`);
      else for (const [re, why] of BANNED) if (new RegExp(re.source, "i").test(a.text)) varProblems.push(`${id}.variations.alternatives[${i}].text ${why}`);
      altCount++;
    });
  }
}
report("variations", varProblems, `${gripCount} grip sections, all on grip-capable push-ups; ${altCount} alternatives, every id resolves`);

/* ---- safety copy the plan requires word for word in spirit ---- */
const safetyProblems = [];
for (const [id, c] of Object.entries(all)) {
  if (slotOf(id) !== "neck") continue;
  const s = (c.safety || []).join(" ").toLowerCase();
  for (const word of ["dizz", "tingl", "slow"]) if (!s.includes(word)) safetyProblems.push(`${id}.safety lacks "${word}…" (plan D2's neck copy)`);
}
report("safety", safetyProblems, "neck guides say slow, and stop at dizziness or tingling");

/* ---- shipped: a script tag and a PRECACHE entry per batch ---- */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const shipProblems = [];
for (const b of Object.keys(BATCHES)) {
  const f = `fitness/content/batch-${b}.js`;
  if (!html.includes(`src="${f}"`)) shipProblems.push(`index.html doesn't load ${f}`);
  if (!sw.includes(`"./${f}"`)) shipProblems.push(`PRECACHE lacks ${f}`);
}
report("shipped", shipProblems, `${Object.keys(BATCHES).length} script tags and ${Object.keys(BATCHES).length} PRECACHE entries`);

if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
console.log("\nall passed");
