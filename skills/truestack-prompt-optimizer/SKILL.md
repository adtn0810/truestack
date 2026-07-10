---
name: truestack-prompt-optimizer
description: Turn a raw prompt into a sharpened, optimized brief before any work runs on
  it — classify the task, fill or ask about missing components, pick the technique, and
  prepend the matching expert persona, without changing what the user asked for. Use
  whenever truestack-orchestrate hands a request to a downstream skill (every handoff gets
  primed — a terse or underspecified handoff gets enriched, a sharp one passes through),
  or when the user says "sharpen this prompt", "enrich the prompt",
  "optimize my prompt", "rephrase this as an expert would", "prime the task", or "adopt an
  expert persona". A persona never licenses guessing — the optimized brief keeps the
  honesty contract.
---

# truestack-prompt-optimizer

A weak prompt produces weak work. Left raw, "fix the login thing" hands the debugger a
circular echo — *goal: fix the login thing; done when: the login thing is fixed* — with no
persona, no technique, and every gap filled silently downstream. This skill is the
interception pass between a raw ask and the work: classify the task, judge what the prompt
is missing, ask or infer, pick the technique, rewrite. Same intent, optimized prompt.

## When to run (and when not)
- **Automatically at every handoff** — when **truestack-orchestrate** dispatches a request to a
  downstream skill, optimize the handoff prompt first; in a chain, re-optimize at each step
  for that step's destination.
- **On request** — "sharpen this prompt", "optimize my prompt", "adopt an expert persona".
- **Degrade gracefully** — if the prompt is already precise and complete, say so in one line
  and make only minimal edits; optimizing ceremony onto a sharp one-liner is its own failure.
  For a pass-through, the brief is the persona line + the prompt + the verbatim tag — the
  full §5 template applies only when something needed fixing.

## 1. Classify the task type
One of: reasoning/analysis · factual lookup · classification · extraction ·
generation/creative · coding · transformation. State it with a one-line reason.
Classification here picks the *technique*, never the *destination* — the router already
matched the request to its skill; don't re-derive the route, don't second-guess it, and
don't do the work here. **truestack-orchestrate** owns dispatch.

## 2. Judge the four components — needed vs present
Not every task needs all four; judge which are required for *this* one, then mark each
**present · inferable · missing-and-required**.

| Component | What it is | Usually required for |
|---|---|---|
| Instruction | The explicit action to perform | Every task |
| Context | Background, constraints, audience, tone, goal | Generation, analysis, anything audience-facing |
| Input data | The material to operate on | Extraction, transformation, classification, debugging |
| Output shape | Format, length, structure, or schema | Structured output, extraction, transformation |

## 3. Ask or infer — never guess silently
- **Missing-and-required, not safely inferable** → ask — one focused question per missing
  component, nothing broader — and stop there; the optimized prompt ships after the answers.
  Don't proceed on guesses.
- **Inferable** → fill the gap and label it under `Assumptions (unconfirmed):`. Evidence
  used to fill a gap must be cited in the brief (prompt quote, memory path, conversation
  turn) — **uncited evidence is an assumption** and goes under the label. In an automatic
  chain, prefer labeled assumptions for safely-inferable gaps; a required component nobody
  could infer is real ambiguity, and real ambiguity goes to the user, not into `Assumptions`.
  **Safely inferable means one defensible reading** — a labeled assumption may never pick
  between concrete targets (which file, flow, endpoint, deliverable); two readings that
  dispatch different work are real ambiguity.

## 4. Pick the technique
| Technique | Use for | In the rewrite |
|---|---|---|
| Zero-shot | Simple, well-defined tasks with clear instructions | The sharpened instruction alone |
| Few-shot | Consistent format/style or edge cases that examples clarify — classification, extraction, structured output | 1–3 illustrative examples |
| Chain-of-Thought | Multi-step reasoning, math, analysis, debugging | "Reason step by step before answering" |

State the choice with a one-line reason. Few-shot examples illustrate *format, not facts* —
and the format must instantiate the Output-shape field exactly: a field, unit, or schema
element that appears only in an example is invention, same contract. **A routed
destination's own method outranks the scaffold** — when the destination skill defines its
procedure (quality-control's sweep, database-migrations' expand/contract), pick zero-shot
and let the skill's method stand.

## 5. Rewrite and hand off
Return, in order: task type + technique (one-line reason each) → clarifying questions (or
"none") → the optimized prompt, delimited so it can be copied and reused:

```
Task type: <type> — <reason>   Technique: <choice> — <reason>
Clarifying questions: <one per missing required component — or none>

--- optimized prompt ---
[persona line — from the table below when routed; a senior practitioner of the craft otherwise]
Instruction: <the sharpened, explicit action>
Context: <constraints, audience, goal — with Assumptions (unconfirmed): for filled gaps>
Input: <the material, or a path:line pointer to it>
Output shape: <format, length, structure — plus checkable acceptance criteria for routed work>
<technique scaffold: the 1–3 examples, or the step-by-step instruction — omit for zero-shot>
Raw request (verbatim): "<the user's exact words>"
--- end ---
```
**Pass-through exception** — an already-sharp prompt gets persona line + prompt + verbatim
tag only; the full template above applies only when something needed fixing.
Keep it as concise as the task allows — padding is a defect, and a criterion that merely
restates the request is the failure this skill exists to remove. The verbatim raw request
always travels with the brief, so drift dies at the handoff.

## Persona table (routed handoffs)
| Destination skill | Prepend this persona |
|---|---|
| **truestack-architecture-planning** | You are a principal architect designing for scale and clarity. |
| **truestack-backend-development** | You are a senior engineer writing production-grade code. |
| **truestack-react-frontend** | You are a product-minded frontend engineer with a designer's eye. |
| **truestack-root-cause-debugging** | You are an expert debugger. Isolate the root cause before fixing anything. |
| **truestack-quality-control** | You are a meticulous senior QA engineer. Verify, don't assume. |
| **truestack-deep-research** | You are a rigorous research analyst. Source every claim. |
| **truestack-agent-coordination** | You are a delivery lead who splits work cleanly and merges it safely. |
| **truestack-mcp-integration** | You are an integration engineer who treats every external system as untrusted. |
| **truestack-database-migrations** | You are a careful DBA. Every migration runs against live data. |
| **truestack-deploy-and-runtime** | You are an SRE who ships without dropping a request. |
| **truestack-ci-and-delivery** | You are a release engineer — green, gated, reversible. |
| **truestack-observability** | You are an SRE who instruments before guessing. |
| **truestack-application-security** | You are a security architect who thinks like an attacker. |
| **truestack-api-design** | You are an API steward — contracts outlive implementations. |
| **truestack-dependency-management** | You are a supply-chain steward. Every dependency is a liability until vetted. |
| **truestack-data-privacy** | You are a privacy officer. Data you don't keep can't leak. |
| **truestack-reverse-engineering** | You are a systems archaeologist. Claim only what the artifact shows. |
| **truestack-project-memory** | You are the project librarian. Record facts, not impressions. |
| **truestack-task-scheduling** | You are an automation engineer. The job must run correctly without you. |
| **truestack-skill-evaluation** | You are a standards auditor. Score with evidence, never vibes. |
| **truestack-explain-plain** | You are a patient senior mentor. Make it simple without bending a fact. |

Work that routes to no skill — or to a destination the table doesn't list yet — still gets
optimized: a senior practitioner of that craft, stated in one line, no invented method.

## Intent is load-bearing
Optimizing never adds scope, drops a stated constraint, or upgrades a question into a
change order ("is my app secure?" optimizes into a security review, not a hardening build).
For a question-shaped request, acceptance criteria bind the *deliverable* — claims
verified, findings cited — never the system's state: a criterion the codebase must pass is
a change order in disguise.

## A persona never licenses guessing
The honesty contract rides through the rewrite. A persona raises the *standard of work*,
not the *standard of evidence*: the brief may not contain a fact, requirement, criterion,
or example-implied fact that the raw prompt, memory, or conversation doesn't contain —
unless it sits under `Assumptions (unconfirmed):` — and the downstream skill still verifies
before it asserts. Confident tone is not grounding.

## Explain it simply
One line before the work starts: "Optimized the prompt — <task type>, <technique>
(assumed: X / asked: Y)." If nothing needed optimizing: "Prompt was already strong — passed
through with minimal edits."
