---
name: truestack-architecture-planning
description: Plan the architecture and data flow for a feature, service, or
  system before any implementation code is written. Use this whenever the user is
  designing, scoping, or starting to build something new (backend or frontend) — even when
  they just say "build X" or "how should I structure this" without saying "plan".
  Owns the planning step that precedes any implementation code. Treats the request as
  intent to be clarified, picks the right architecture per project, sizes the process
  to the work, and gates risky work behind approval.
---

# truestack-architecture-planning

The prompt is evidence of intent, not a finished spec. Plan first, code never (here):
this skill produces an architecture the user signs off on before `truestack-backend-development` runs. Aim
for the *simplest* design that meets the real requirements — on a self-hosted single
server, every extra layer is a permanent tax, so justify each one.

First, read project memory — `CLAUDE.md` is auto-loaded (including its Principles and
Boundaries); consult `.ai/memory/` for deeper detail. If no memory exists yet, run
`truestack-project-memory` before planning anything substantial.

## Right-size the work (do this first)
Match the ceremony to the size of the change — heavy process on a small task is its own
failure mode:
- **Trivial** (rename, copy tweak, one-liner) **and unambiguous**: skip planning; go straight to `truestack-backend-development` + `truestack-quality-control`. If even a small ask is ambiguous, clarify first (see step 6).
- **Small** (contained, clear intent): a short plan — goal, approach, testable criteria. Skip interpretations and task breakdown.
- **Substantial** (new feature/service, several moving parts): the full flow below.
- **High-risk** (irreversible / data / security / money): the full flow **plus** the approval gate.

## 1. Frame the real work
If the request rests on a false premise or won't actually achieve the user's goal, say so
plainly before planning — don't design around a misunderstanding to be agreeable.
- **Restate the goal** in one or two sentences. If the request is vague, don't pretend it's precise.
- **Separate outcome from requested solution**: what the user actually wants vs. the approach they named, and what would make that approach wrong or insufficient.
- **List interpretations** when more than one reading exists (minimal / expanded / alternative). Skip for trivial/small work.
- **Name the decisions that change the design**: users, data in/out, business rules, scale, permissions, error/edge behavior, integrations, persistence, ops.

## 2. Choose the architecture — per project, with a reason
Don't default to a favorite, and don't choose from recall: for any decision that turns on **current**
facts — framework/library support, a version's capabilities, an enterprise pattern's tradeoffs —
**auto-research it first** from authoritative sources (`context7` / official docs), per the always-on
contract. Pick and justify:
- **Modular monolith** — default for a self-hosted single server; one deployable, clear internal boundaries. Use unless there's a concrete reason not to.
- **Layered / hexagonal** — when domain logic is complex enough that isolating it from I/O pays off.
- **DDD / Clean** — only for genuinely intricate, long-lived domains; name the benefit that justifies the ceremony.
- **Separate services** — only for a real independent scaling or failure-isolation need. On one VPS this usually adds latency and ops pain — say so if reached for prematurely.

## 3. Define structure and danger points
Map modules, responsibilities, data flow, and boundary interfaces — only what's needed
now. Explicitly flag where **data accuracy** is load-bearing (transactions, idempotency,
locking, money math) and where **load concentrates** on the single machine (hot paths,
unbounded growth, shared resources).

## 4. Decide "done" before coding
Write acceptance criteria as **testable statements**, not vague goals — use
"When <trigger>, the system shall <behavior>" or Given/When/Then, so each criterion maps
to a concrete check. Include key edge cases, out-of-scope items, and the test/runtime
evidence that will prove it works.

## 5. Break into tasks (non-trivial work)
Split the approved plan into small, independently verifiable tasks, ordered so each can be
implemented and checked on its own. This gives `truestack-backend-development` a way to validate as it goes
instead of landing one big unreviewable change. For larger work, mark which tasks are
**independent (parallelizable)** vs **dependent (sequential)**, and define any **shared
contracts** (interfaces, schema, API shapes) up front — they must exist before parallel
implementation. Hand a parallelizable breakdown to `truestack-agent-coordination`.

## 6. Clarify ambiguity — loop until clear
If more than one reasonable build would satisfy the request, clarify before committing to a
plan — don't guess on a coin-flip. Each round:
- Ask **at most 3 blocking questions** — only ones whose answer changes the plan or output — each with a **recommended default** for when the user is unsure.
- When answers arrive, re-check. If they open a **new** blocking fork, ask one more short round; if nothing blocking remains, stop and proceed.

This loops on genuine ambiguity, never to interrogate. Hard exits so it can't stall the user
— stop and proceed with **clearly stated assumptions** the moment (a) no blocking ambiguity
is left, (b) the user gives defaults or says "just proceed", or (c) after a couple of rounds
the remaining unknowns are non-blocking (note them and move on). Nice-to-know details never
earn another round.

## High-risk gate
If the change is irreversible or touches public APIs, data/schema/migrations,
security/permissions, money, or new dependencies: **do not hand off to coding until the
user approves the direction.** Present at least two viable approaches with their tradeoffs
and reversibility, recommend one, and state the blocking decisions. If everything is safe
and reversible, proceed.

## Explain it simply
Present the plan in plain English. Open with a one-line summary of the approach a
non-expert could follow, then the detail below. Show the architecture choice and its
tradeoffs as a short list — use a table when comparing options. Don't bury the
recommendation under jargon.

## Output
```
# Plan: [name]
## Size & approach (trivial / small / substantial / high-risk)
## Goal (as understood)
## Outcome vs requested solution
## Interpretations (if ambiguous)
## Decisions that matter
## Chosen architecture (and why over alternatives)
## Module map & data flow
## Accuracy & load-bearing points
## Acceptance criteria (testable) + verification plan
## Task breakdown (non-trivial work)
## Clarifications resolved (+ stated assumptions)
```

Record the non-obvious decisions (architecture choice, boundaries) to `.ai/memory/architecture.md`
via **truestack-project-memory** so the code↔memory tally starts balanced. When the plan is approved, hand
off: proceed to **truestack-backend-development**.
