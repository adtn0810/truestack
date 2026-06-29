---
name: skill-evaluation
description: Evaluate and score Agent Skills — this set or any skill — on triggering accuracy,
  scope, token efficiency, structure, anti-patterns, and honesty-contract adherence. Use
  whenever the user asks to "score", "evaluate", "rate", "audit", "grade", or "improve" a skill
  or skill set, after authoring or editing a skill, or before shipping one. Runs a deterministic
  static lint, a semantic judge pass, and an optional behavioral trigger test, then reports a
  scorecard with concrete fixes — never a vibe-based number.
---

# skill-evaluation

A score is only worth what's behind it. This skill measures skill quality with evidence —
a deterministic lint you can re-run, plus a judged read and a trigger test — so "8/10" means
something checkable, not a guess. It exists because the easy failure here is exactly the one the
honesty contract forbids: asserting a confident number nobody verified.

## When to run
- The user asks to score / rate / audit / improve a skill or set.
- Right after writing or editing a skill (gate before shipping).
- Periodically, to catch drift, bloat, and trigger collisions as a set grows.

## Three layers (run in order; each is cheap)
1. **Static lint (deterministic).** Run `scripts/skill_lint.py <skills-dir>`. It checks every
   `SKILL.md` for: valid frontmatter, `name` matching its folder, a description that says **what
   it does AND when to use it**, body within the token budget, `references/` that are actually
   linked (no orphans) and that every referenced file exists (no dead refs), and the obvious
   anti-patterns. This layer is repeatable and needs no judgment — same input, same score.
2. **Semantic judge.** Read each `SKILL.md` and rate it against the rubric dimensions, grounded
   in the actual text — reward clarity and correct scope, **not length**. A long skill is a cost,
   not a virtue. Cite the line that justifies each deduction.
3. **Behavioral trigger test.** Two parts. (a) **Measured floor (deterministic):** run
   `scripts/trigger_eval.mjs` — it routes the committed `fixtures/trigger-cases.json`
   (prompt → expected skill, plus should-not-fire cases) by IDF-weighted keyword overlap and
   asserts each intended skill lands in the top-2; it exits 1 on a miss, so a description edited
   to stop matching its own triggers fails in CI. Keyword overlap only *approximates* the LLM
   router — it's a regression guard, not proof of live routing — so label it measured-but-approximate.
   (b) **Judged:** for cases the fixtures don't cover, write 3–5 should-fire and 2 should-not
   prompts per skill and reason about routing. Under-triggering (too timid) and over-triggering
   (grabs unrelated work, collides with a sibling) are both findings; add a regression case to the
   fixtures for any real miss you find.

## What it scores
Six dimensions, 0–10, weighted — full anchors, weights, anti-pattern catalog, and badge
thresholds in **`references/rubric.md`**:
- **Triggering accuracy** — does the description fire when it should and stay quiet when it shouldn't?
- **Scope calibration** — one clear job, not too broad (collides) or too narrow (never fires).
- **Token efficiency** — earns its context cost; progressive disclosure via `references/`.
- **Structural completeness** — frontmatter, body, references, handoff all present and consistent.
- **Robustness / anti-patterns** — none of: empty/vague description, missing "when", over-constrained MUST-walls, bloated body, orphan/dead reference, name mismatch, duplicated trigger surface.
- **Honesty adherence** — does the skill itself ground/verify/abstain rather than invent (for skills that produce claims)?

## Be honest about the number (this skill, of all skills)
Label each layer: the **static** score is deterministic; the **judge** and **behavioral** scores
are estimates — say so. Report only what you actually ran. Don't average away a Critical
finding (a dead reference or an empty description caps the skill until fixed). A measured **6/10
with three concrete fixes** is worth more than a flattering 9 — surfacing the gap is the point.

## Output
```
# Skill-eval report: <set or skill>
## Scorecard
| Skill | Static | Judge | Behavioral | Score /10 | Badge | Top fix |
## Critical findings (must fix — cap the score)
## Per-skill notes (deduction → evidence → fix)
## Set-level: trigger collisions · total token budget · coverage gaps
Verdict: ship / fix-first — with the honest caveat on judged vs measured
```

## Explain it simply
Lead with the one-line verdict and the single highest-leverage fix. Show the scorecard as a
table, findings by severity — not prose. Make every deduction point to the line that caused it,
so a fix is obvious. After fixes, **re-run the lint** and show the before/after.

Fixes that change a skill's behavior or wording → that's editing the skill; re-run this eval to
confirm the score moved. For a brand-new skill, hold it to the same bar from the start: write it
against this skill's rubric (`references/rubric.md`) and run the lint before shipping.
