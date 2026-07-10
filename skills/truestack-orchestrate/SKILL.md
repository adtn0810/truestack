---
name: truestack-orchestrate
description: Front-door router for this skill set — read FIRST on any non-trivial coding
  request, then dispatch to the right skill(s) in the right order. Use whenever a request
  spans more than one step or you're unsure which skill fits — building, fixing, scheduling,
  acting on an external system, or chaining multi-step plans, reviews, or research runs. Right-sizes the work,
  carries the read-memory-first / honesty / clarify contracts into each step, chooses
  single-agent vs parallel, runs the canonical chains end to end, and gates everything
  through truestack-quality-control. Skip only for a single trivial one-off.
---

# truestack-orchestrate

One coding request often needs planning, building, an external call, and a quality gate — in a
specific order, with the right contracts applied at each step. This skill is the router: it
doesn't do the work itself, it routes to the skill that does and makes sure the chain runs in
sequence. Front door of the set — classify the request, dispatch, check the handoff, repeat.

Don't duplicate a skill's content here. Orchestrate decides **which** skill and **in what
order**; each skill owns its own method — the sibling's own description is the source of truth
for what it covers.

## Step 0 — ground before routing (always)
1. **Read project memory** — `CLAUDE.md` is auto-loaded (Principles + Boundaries); read
   `.ai/memory/` on demand. If no memory exists, route to **truestack-project-memory** to build it before
   any substantial work.
2. **Carry the always-on contracts** into whatever runs next: honesty (ground / verify / abstain,
   truth over agreement), **auto-research** (consequential current-fact decisions are grounded in
   authoritative sources before committing, not recalled), clarify-then-proceed on real ambiguity,
   and the Ask-first / Never boundaries. They travel with every route; the destination skill enforces it.
3. **Right-size** (below) so heavy process never lands on a one-liner.

## Right-size first
- **Trivial & unambiguous** (rename, copy tweak, one-liner): skip orchestration — the one obvious skill, then **truestack-quality-control**.
- **Small** (contained, clear intent): the single relevant skill → **truestack-quality-control**.
- **Substantial** (feature / service, several moving parts): run the full chain.
- **High-risk** (irreversible · data · money · security · schema / migration · first prod deploy · auth/credential or privacy-policy design): full chain **plus** the **truestack-architecture-planning** approval gate **before** any code is written; route risky DDL/backfill through **truestack-database-migrations** (if the `hooks/` PreToolUse gate is wired in this install it also trips there — confirm it's active rather than assuming; if unwired, the approval gate is the only barrier).

## Route by intent
Match the request to its skill — one or more. When several apply, run the chain in order.

| The request is about… | Route to |
|---|---|
| First task in a repo · no memory yet · "remember" / "onboard" · stale facts | **truestack-project-memory** |
| Designing / scoping / "how should I structure this" / starting something new | **truestack-architecture-planning** |
| Implementing backend — server, API, data layer, choosing a stack | **truestack-backend-development** |
| Building or restyling React UI — component, page, design, accessibility | **truestack-react-frontend** |
| A bug, error, crash, failing test, regression, "not working", slowness that's a defect | **truestack-root-cause-debugging** |
| Checking work after a change — "QC", "verify", "make sure it's solid" | **truestack-quality-control** |
| Live data or a real external action via a connected MCP server · `.mcp.json` | **truestack-mcp-integration** |
| Schema or data migration — DDL (add/drop/rename column, constraint, index), backfill, expand/contract, "migration locked the table" | **truestack-database-migrations** (high-risk: via **truestack-architecture-planning**'s gate first) |
| Packaging & running on a VPS — Docker, nginx, TLS, systemd, SIGTERM drain, blue-green cutover, "my deploy causes downtime" | **truestack-deploy-and-runtime** |
| CI/CD pipeline — GitHub Actions, checks gating PRs, SHA-pinning, release/semver, health-gated deploy step | **truestack-ci-and-delivery** |
| Making a service observable — structured logs, metrics, OTel tracing, SLOs/burn-rate, "no telemetry yet" | **truestack-observability** |
| Securing an app — auth flows, RBAC/access control, OWASP/injection, secrets, threat model, "is this secure" | **truestack-application-security** (high-risk auth/credential design: via **truestack-architecture-planning**'s gate first) |
| Designing the API interface contract — REST/GraphQL/gRPC, error model, versioning, pagination, idempotency, OpenAPI | **truestack-api-design** (high-risk public/versioned contract: via **truestack-architecture-planning**'s gate first) |
| Dependency lifecycle — add/pin/bump a package, Renovate/Dependabot cooldown, CVE/SBOM/license, "is this package safe" | **truestack-dependency-management** (high-risk ingestion: via **truestack-architecture-planning**'s gate first) |
| Privacy/compliance policy — GDPR/CCPA/HIPAA, PII inventory, retention/erasure, consent, audit of personal data, breach readiness | **truestack-data-privacy** (high-risk: via **truestack-architecture-planning**'s gate first) |
| Splitting work across parallel agents · research fan-out · resuming another session's ledger | **truestack-agent-coordination** |
| "Research / compare / what's best / latest / find out / is it still true" | **truestack-deep-research** |
| A shared reference/artifact — "how does this work", "reverse engineer this", "adopt/port this pattern", upgrading from a reference | **truestack-reverse-engineering** |
| "Every day / weekly / remind me / run at / recurring" | **truestack-task-scheduling** |
| "Score / rate / audit / evaluate / improve" a skill or skill set | **truestack-skill-evaluation** |
| "Sharpen / optimize / rephrase this prompt" · "adopt an expert persona" — a raw ask needs an optimized brief | **truestack-prompt-optimizer** (also runs automatically at every handoff) |
| "Explain this / what does this do / teach me / in simple terms" — a plain-English walkthrough is the deliverable | **truestack-explain-plain** |

If nothing fits cleanly, say so and ask one short clarifying question — don't force a route.

**When a request straddles two skills** (deploy vs CI vs migration, security vs QC vs privacy,
API vs build vs system design…) or needs a multi-step chain beyond the common ones below, open
**`references/routing.md`** — it holds the boundary-case splits and the full canonical chain
catalog. Don't guess a seam from memory when the reference defines it.

## Canonical chains (most common; full catalog in `references/routing.md`)
- **Backend / frontend feature** → truestack-architecture-planning → the builder skill for that layer → truestack-quality-control
- **Bug fix** → truestack-root-cause-debugging → truestack-quality-control
- **Research → decision** → truestack-deep-research → truestack-architecture-planning
- Migration, deploy, CI/CD, security, API-contract, dependency, privacy, observability, parallel-build
  and recurring chains → **`references/routing.md`** — don't reconstruct a chain from memory when the
  catalog defines it.
- **Always**: every chain reads truestack-project-memory first; every handoff is optimized by truestack-prompt-optimizer; truestack-quality-control is the gate before "done"; truestack-explain-plain closes the chain in plain English; and code and project memory must reconcile — the tally balances — before anything is called done.

## Route beyond this set — pick the best skill, ours or not
This set is the general, governed spine, not the deepest skill for every domain. When a specialist
set installed in this environment covers a domain better, let it do the domain work — **discover,
don't assume** it's installed — and keep truestack's wrapper (the PreToolUse gate, the QC gate, the
Always-line contracts) around the result. Honesty over territory: use the better tool — mechanics
in `references/routing.md`.

## Single agent or parallel?
Default **single-agent** — coordination overhead and human review are the real costs, and most
work is sequential or tightly coupled. Hand to **truestack-agent-coordination** only when the plan has
genuinely independent tasks, the work is big enough to pay the overhead, and shared contracts
(schema / interfaces / API shapes) are defined first. Start at 2–3 agents.

## Handoff discipline
- The order is fixed: ground → right-size → route → optimize the handoff (**truestack-prompt-optimizer**) →
  dispatch. Optimizing runs after routing, never before it — the persona and required-component judgment
  key off the destination, and right-sizing has already filtered the trivial work out.
- Route, then let the destination skill own its method — don't re-explain or re-run its steps here.
- Pass forward what it needs: the goal, the acceptance criteria, relevant memory, prior results —
  optimized first by **truestack-prompt-optimizer** (matching persona + task-fitted technique + explicit
  goal + labeled assumptions + checkable criteria; intent unchanged). A handoff that echoes a vague ask
  verbatim is a defect.
- After each step, check the result against its acceptance criteria before moving to the next. If
  a step fails, loop **within** that skill (build loop / verify-or-loop) — don't restart the chain.
- **Nothing is "done" until truestack-quality-control passes** and every acceptance criterion maps to evidence (the full done-conditions live on the Always line above).

## Explain it simply
Open with the route in one plain line — what you'll do and in what order ("Plan the schema, build
the endpoint, then QC it"). Get a yes before any high-risk or parallel dispatch. Report each
step's result in one line. If you abstained or couldn't route cleanly, say so plainly. Every
task closes with **truestack-explain-plain** — automatically, no request needed: a plain-English
explanation of what was done and why, sized to the change (full lesson for substantial work, two
plain sentences for a trivial one). It also fires whenever the user asks what/why or sounds confused.

## Honest exit
Report against the goal, not the effort. If the chain stalls — a blocked dependency, a conflicting
constraint, a claim you can't verify — stop and give an honest completion score (criteria met /
total + what blocks each unmet one) rather than declaring a done you can't prove (honesty
contract). An accurate 7/10 the user can act on beats a false 10/10.
