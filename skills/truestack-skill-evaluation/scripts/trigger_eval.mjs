#!/usr/bin/env node
// Deterministic behavioral trigger eval for the truestack skill set.
//
// It approximates routing by IDF-weighted keyword overlap between a test prompt and each
// skill's frontmatter description, then asserts each fixture's intended skill ranks in the
// top-2. This turns the "behavioral" eval layer from a prose procedure into a committed,
// re-runnable REGRESSION GUARD: edit a description so it stops matching its own trigger
// prompts and this fails in CI.
//
// HONEST SCOPE: keyword overlap is an APPROXIMATION of real routing (the live router is the
// LLM reading all descriptions). This catches description-keyword drift and gross collisions;
// it does not prove the LLM will route identically. It is the measured floor under the
// judged behavioral layer, not a replacement for it. Run: node trigger_eval.mjs
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(HERE, "..", "..");                 // skills/
const FIXTURES = join(HERE, "..", "fixtures", "trigger-cases.json");

const STOP = new Set(`the a an and or of to in on for with without use used when whenever after before
this that these those it its is are be been being your you our their them they we i my me how what
which while work working code coding task tasks user users skill skills project run runs running
make makes need needs want wants get got set sets new add adds also only just more most some like
into from out over under each every here there where about across against between because using do
does done not but any all into via per as at by so if then than into one two new help me`.split(/\s+/));

const tokenize = (s) => [...new Set((s.toLowerCase().match(/[a-z0-9][a-z0-9+./-]{2,}/g) || []).filter(w => !STOP.has(w)))];

// Load each skill's description tokens (skip truestack-orchestrate — it's the meta-router, not keyword-routed).
const skills = {};
for (const name of readdirSync(SKILLS_DIR)) {
  if (name === "truestack-orchestrate") continue;
  let t; try { t = readFileSync(join(SKILLS_DIR, name, "SKILL.md"), "utf8"); } catch { continue; }
  const fm = (t.match(/^---\n([\s\S]*?)\n---/) || [])[1]; if (!fm) continue;
  const dm = fm.match(/description:\s*([\s\S]*?)(?:\n[a-z_]+:|$)/i);
  const desc = dm ? dm[1].replace(/\s+/g, " ").trim() : "";
  skills[name] = new Set(tokenize(name.replace(/-/g, " ") + " " + desc));
}

// IDF over the skill descriptions — rare/discriminating terms count more than ubiquitous ones.
const df = {};
for (const set of Object.values(skills)) for (const w of set) df[w] = (df[w] || 0) + 1;
const N = Object.keys(skills).length;
const idf = (w) => Math.log((N + 1) / ((df[w] || 0) + 1)) + 1;

function rank(prompt) {
  const pt = tokenize(prompt);
  return Object.entries(skills)
    .map(([name, set]) => [name, pt.reduce((s, w) => s + (set.has(w) ? idf(w) : 0), 0)])
    .sort((a, b) => b[1] - a[1]);
}

const cases = JSON.parse(readFileSync(FIXTURES, "utf8"));
let pass = 0; const fails = [];
for (const c of cases) {
  const r = rank(c.prompt);
  const topK = (r.slice(0, c.topK || 2)).map((x) => x[0]);
  const top1 = r[0]?.[0];
  const fires = !c.expect || topK.includes(c.expect); // pure should-not-fire cases omit `expect`
  const quiet = !c.notExpect || c.notExpect !== top1; // a should-not-fire skill must not rank #1
  if (fires && quiet) pass++;
  else fails.push({ p: c.prompt, expect: c.expect, notExpect: c.notExpect, got: r.slice(0, 3).map((x) => `${x[0]}:${x[1].toFixed(1)}`) });
}
console.log(`\nTrigger eval — ${pass}/${cases.length} routed correctly (intended skill in top-2; should-not never #1).`);
for (const f of fails) {
  console.log(`  FAIL  "${f.p}"`);
  console.log(`        want ${f.expect} in top-2${f.notExpect ? `, ${f.notExpect} not #1` : ""}; got ${f.got.join("  ")}`);
}
process.exit(fails.length ? 1 : 0);
