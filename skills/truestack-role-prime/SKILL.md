---
name: truestack-role-prime
description: Turn a raw request into a sharpened expert brief before the work runs —
  prepend the matching expert persona, restate the goal explicitly, surface implicit
  requirements, and label every assumption, without changing what the user asked for.
  Use whenever truestack-orchestrate hands a request to a downstream skill (every
  handoff gets primed), when a terse or underspecified prompt needs enriching before the
  work runs, or when
  the user says "sharpen this prompt", "enrich the prompt", "rephrase this as an
  expert would", "prime the task", or "adopt an expert persona". A persona never licenses
  guessing — the enriched brief keeps the honesty contract.
---

# truestack-role-prime

A vague prompt in produces vague work out. Left raw, "fix the login thing" hands the
debugger a goal that is a circular echo — *goal: fix the login thing; done when: the login
thing is fixed* — no persona, no surfaced requirements, every gap filled silently
downstream. This skill is the sharpening pass between routing and work: same intent,
stronger brief. It writes the prompt the user *meant* to write, and nothing more.

## When to run (and when not)
- **Automatically at every handoff** — when **truestack-orchestrate** dispatches a request to a
  downstream skill, prime the handoff prompt first. In a multi-skill chain, re-prime at
  each step for that step's destination.
- **On request** — "sharpen this prompt", "adopt an expert persona", "rephrase this as an expert would".
- **Skip it** when the raw prompt already states goal, constraints, and done-criteria
  precisely, and for trivial one-offs that skip the router — priming ceremony on a sharp
  one-liner is its own failure. Say in one line that it passed through as-is.

## 1. Take the route as given — never re-classify
The router already matched the request to its destination skill; the persona keys off that
match. Don't re-derive the task type, don't second-guess the route, and don't do the work
here — this skill shapes the prompt, **truestack-orchestrate** owns dispatch.

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

Work that routes to no skill (pure writing, a one-off script) — or to a destination the
table doesn't list yet — still gets primed: a senior practitioner of that craft, stated in
one line — no invented method, no new capability.

## 2. Sharpen the brief — four moves, intent fixed
Rewrite the raw prompt using only three sources: the prompt itself, project memory
(`CLAUDE.md` + `.ai/memory/`), and the conversation so far.
- **Goal, explicit** — one sentence naming the outcome and how you'd observe it. "Make the
  dashboard nicer" becomes a goal only once the axis is named (visual polish · information
  density · perceived speed) — picked from evidence, or labeled an assumption. Evidence
  picked must be cited in the brief (prompt quote, memory path, conversation turn) —
  **uncited evidence is an assumption** and goes under the label.
- **Implicit requirements, surfaced** — what the request presupposes: which flow, entity,
  surface, environment; what must not break. A requirement not traceable to the prompt,
  memory, or conversation isn't implicit — it's a filled gap, and it goes under
  `Assumptions (unconfirmed):`.
- **Assumptions, labeled** — every gap you fill goes under `Assumptions (unconfirmed):`.
  The destination skill confirms them or clarifies with the user; an unlabeled assumption
  in the brief is a defect.
- **Acceptance criteria, checkable** — derived from the goal, each one something a verifier
  can run or observe. A criterion that merely restates the request is the failure this
  skill exists to remove.

## 3. Hand off the brief
```
[persona line]

Goal: <one observable outcome>
Implicit requirements: <what the request presupposes>
Assumptions (unconfirmed): <each gap you filled — or "none">
Acceptance criteria: <checkable, one per line>
Memory: <relevant facts from CLAUDE.md / .ai/memory/, with source>
Raw request (verbatim): "<the user's exact words>"
```
The verbatim raw request always travels with the brief — the destination skill checks the
rewrite against the original, so drift dies at the handoff, not three steps later.

## Intent is load-bearing
Sharpening never adds scope, drops a stated constraint, or upgrades a question into a
change order ("is my app secure?" primes a security review, not a hardening build). For a
question-shaped request, acceptance criteria bind the *deliverable* — claims verified,
findings cited — never the system's state: a criterion the codebase must pass is a change
order in disguise. And it never resolves real ambiguity by fiat — two genuinely different
readings of the request go back through clarify-then-proceed, not into `Assumptions`.

## A persona never licenses guessing
The honesty contract rides through the rewrite. A persona raises the *standard of work*,
not the *standard of evidence*: the brief may not contain a fact, requirement, or
criterion that the raw prompt, memory, or conversation doesn't contain — unless it sits
under `Assumptions (unconfirmed):`
— and the downstream skill still verifies before it asserts. Confident tone is not grounding.

## Explain it simply
One line before the work starts: "Primed the brief — <goal in a few words> (assumed: X, Y)."
If you skipped priming, one line saying the prompt was already sharp.
