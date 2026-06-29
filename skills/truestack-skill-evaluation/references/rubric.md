# Skill quality rubric

Six dimensions, scored 0–10. The default weighting is below; adjust for context (a meta-skill
weighs triggering higher; a reference-heavy skill weighs structure higher). The **static lint**
feeds Structure, Robustness, and part of Token efficiency deterministically; **Judge** and
**Behavioral** cover the rest.

| Dimension | Weight | 0–3 (poor) | 4–6 (ok) | 7–8 (good) | 9–10 (excellent) |
|---|---|---|---|---|---|
| Triggering accuracy | 3 | description has no "when", or fires on everything | fires but mis-scopes some cases | fires on intended cases, rare miss | precise; pushy enough to not under-fire, scoped enough to not collide |
| Scope calibration | 2 | many jobs in one skill, or so narrow it never fires | broad-ish | one clear job | one job, clean boundaries with siblings |
| Token efficiency | 2 | huge body, no references, repetition | some bloat | lean body + references | minimal always-loaded text; depth in references/scripts |
| Structural completeness | 1 | missing frontmatter or body | present but inconsistent | all parts present | frontmatter + lean body + references + handoff, all consistent |
| Robustness / anti-patterns | 1 | multiple anti-patterns | one or two | none major | none; defensive against misuse + untrusted input |
| Honesty adherence | 1 | invents/over-claims | mostly grounded | grounds + verifies | grounds, verifies, abstains, separates verified/unknown |

**Weighted score** = Σ(dim × weight) ÷ Σ(weight×10) × 10.

## Anti-pattern catalog (each is a finding; Critical ones cap the score)
- **EMPTY_DESCRIPTION / VAGUE** — no description, or one with no "what + when". *(Critical)*
- **MISSING_TRIGGER** — description never says *when* to use it → under-fires. *(Critical)*
- **OVER_CONSTRAINED** — wall of MUST/NEVER rules; brittle, generalizes badly.
- **BLOATED_SKILL** — body far over budget; everything always-loaded instead of in `references/`.
- **ORPHAN_REFERENCE** — a `references/` file nothing in the body points to. *(dead weight)*
- **DEAD_CROSS_REF** — the body points to a `references/…md` (or a skill) that doesn't exist. *(Critical)*
- **NAME_MISMATCH** — frontmatter `name` ≠ folder name. *(Critical — won't resolve)*
- **TRIGGER_COLLISION** — two skills claim overlapping trigger surface → ambiguous routing.
- **NO_HANDOFF** — a pipeline skill that doesn't say what runs next.

## Badges (after Critical findings are resolved)
- **Gold** ≥ 8.5 · **Silver** 7.0–8.4 · **Bronze** 5.5–6.9 · **Needs work** < 5.5.
- Any unresolved **Critical** finding ⇒ **Needs work**, regardless of the weighted number.

## Token budget guide
- `SKILL.md` body: aim ≤ ~250 lines / ~12k chars; past that, move depth into `references/`.
- `CLAUDE.md` (project memory index): ≤ ~120 lines (adherence drops past it).
- References load on demand — they don't count against the always-on budget, but keep each focused.

## Combining the layers
- Static sets a deterministic floor for Structure + Robustness (+ flags budget).
- Judge adjusts Triggering / Scope / Honesty from the actual text.
- Behavioral confirms Triggering empirically (the should/shouldn't-fire prompts).
- A Critical finding from any layer caps the badge until fixed — don't average it away.
