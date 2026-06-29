---
name: truestack-orchestrate
description: Front-door router for this skill set — read FIRST on any non-trivial coding
  request, then dispatch to the right skill(s) in the right order. Use whenever a request
  spans more than one step or you're unsure which skill fits — building, fixing, planning,
  reviewing, researching, scheduling, or acting on an external system. Right-sizes the work,
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
order**; each skill owns its own method.

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
- **High-risk** (irreversible · data · money · security · schema / migration · first prod deploy · auth/credential or privacy-policy design): full chain **plus** the **truestack-architecture-planning** approval gate **before** any code is written; route risky DDL/backfill through **truestack-database-migrations** (it also trips the PreToolUse gate in `hooks/`).

## Route by intent
Match the request to its skill — one or more. When several apply, run the chain in order.

| The request is about… | Route to |
|---|---|
| First task in a repo · no memory yet · "remember" / "onboard" · stale facts | **truestack-project-memory** |
| Designing / scoping / "how should I structure this" / starting something new | **truestack-architecture-planning** |
| Implementing backend — server, API, data layer, choosing a stack | **truestack-backend-development** |
| Building or restyling React UI — component, page, design, accessibility | **truestack-react-frontend** |
| A bug, error, crash, failing test, regression, "not working", something slow | **truestack-root-cause-debugging** |
| Checking work after a change — "QC", "verify", "make sure it's solid" | **truestack-quality-control** |
| Live data or a real external action — DB write, vector search, payment, webhook, `.mcp.json` | **truestack-mcp-integration** |
| Schema or data migration — alter/add/drop/rename column, add constraint/index, backfill/repopulate, expand/contract, zero/low-downtime DDL, "migration locked the table / timed out" | **truestack-database-migrations** (high-risk: via **truestack-architecture-planning**'s gate first) |
| Packaging & running on a VPS — Dockerfile, docker-compose, nginx, TLS/certbot, systemd, graceful shutdown/SIGTERM, zero-downtime/blue-green at runtime, rollback runbook, "my deploy causes downtime" | **truestack-deploy-and-runtime** |
| CI/CD pipeline — GitHub Actions, lint/test on PR, required checks/branch protection, SHA-pin actions, caching, release/semver/changelog, scheduled (cron) workflows, health-gated deploy step | **truestack-ci-and-delivery** |
| Making a service observable — structured logging, metrics (Prometheus/RED/USE), OpenTelemetry/OTLP tracing, correlation/trace IDs, SLOs/error budget/burn-rate alerts, high cardinality, "logs filling the disk", "no telemetry yet" | **truestack-observability** |
| Securing an app — security review, auth/login flow, session vs JWT, MFA/passkeys, RBAC/access control, IDOR/SSRF/CSRF/XSS/SQLi/injection, password hashing, secrets, CSP/security headers, threat model/STRIDE, "is this secure" | **truestack-application-security** (high-risk auth/credential design: via **truestack-architecture-planning**'s gate first) |
| Designing the API interface contract — REST/GraphQL/gRPC choice, resource & error modeling (problem+json/RFC 9457, status codes), versioning/deprecation, pagination (cursor vs offset), idempotency keys, rate-limit headers, OpenAPI/schema-first, "what's a breaking change" | **truestack-api-design** (high-risk public/versioned contract: via **truestack-architecture-planning**'s gate first) |
| Adding/updating/pinning a dependency · lockfile/Renovate/Dependabot/cooldown · vuln scan/CVE/GHSA triage · SBOM/CycloneDX/SPDX · license/copyleft · typosquat/dependency-confusion/provenance/SLSA · "is this package safe" / "upgrade or wait" | **truestack-dependency-management** (high-risk ingestion: via **truestack-architecture-planning**'s gate first) |
| Privacy/compliance policy — GDPR/CCPA/HIPAA, "delete my data"/right-to-erasure/DSAR, PII inventory/classification, retention/scheduled purge, lawful basis/consent, pseudonymization/encryption-at-rest, audit logging of personal data, breach notification, "can we store this" | **truestack-data-privacy** (high-risk: via **truestack-architecture-planning**'s gate first) |
| Splitting work across parallel agents · research fan-out · resuming another session | **truestack-agent-coordination** |
| "Research / compare / what's best / latest / find out / is it still true" | **truestack-deep-research** |
| A shared reference/repo/snippet/spec — "how does this work", "reverse engineer this", "adopt/port this pattern", "upgrade my system based on this", or understanding an unfamiliar codebase before changing it | **truestack-reverse-engineering** |
| "Every day / weekly / remind me / run at / recurring / from now on" | **truestack-task-scheduling** |
| "Score / rate / audit / evaluate / improve" a skill or skill set | **truestack-skill-evaluation** |

If nothing fits cleanly, say so and ask one short clarifying question — don't force a route.

**Deploy splits three ways:** the CI workflow that triggers/gates a release → **truestack-ci-and-delivery**;
how the box achieves no-downtime (nginx/container swap, SIGTERM drain) + the rollback runbook →
**truestack-deploy-and-runtime**; the migration DDL/backfill it runs → **truestack-database-migrations**. A bare
"/healthz" → **truestack-deploy-and-runtime** when it gates a deploy, **truestack-observability** when it feeds
monitoring. A live "it's slow/broken in prod" → **truestack-root-cause-debugging**; "no telemetry yet" →
**truestack-observability**.

**Security splits by artifact:** the standing security DESIGN (threat model, auth/authz architecture,
the controls) → **truestack-application-security**; enforcing a specific diff against them → **truestack-quality-control**'s
safety pass; validating untrusted TOOL/MCP output → **truestack-mcp-integration**; the runtime destructive/money/
outbound ACTION gate → `hooks/` (a layer, not a skill).
**API vs build vs system:** the interface CONTRACT (protocol, versioning, pagination, idempotency,
error model) → **truestack-api-design**; IMPLEMENTING it → **truestack-backend-development**; SYSTEM design → **truestack-architecture-planning**.
**Dependencies vs CI vs security:** dep POLICY/lifecycle (pin, cooldown, CVE/GHSA triage, SBOM,
license, typosquat) → **truestack-dependency-management**; ENCODING the scan/SBOM as a CI gate + SHA-pinning the
workflow's own actions → **truestack-ci-and-delivery**; the security DESIGN discipline → **truestack-application-security**.
**Privacy vs telemetry vs data change:** the privacy POLICY (classification, retention, erasure,
consent, audit, breach) → **truestack-data-privacy**; IMPLEMENTING PII redaction in telemetry → **truestack-observability**;
the DDL/backfill that performs a purge → **truestack-database-migrations**; the access-control design → **truestack-application-security**.

## Route beyond this set — pick the best skill, ours or not
This set is the general, governed spine; it is **not** the deepest skill for every domain. When a
task needs single-domain depth that a **specialist set installed in this environment** covers better
— deep .NET internals, vector-DB tuning, exact webhook signing schemes, pure UI/UX design — let that
specialist do the domain work; don't force a generalist truestack skill through it. Honesty over
territory: use the better tool.
- **Discover, don't assume** — confirm the specialist set is actually available before deferring to
  it (ground, don't recall). If it isn't, fall back to the truestack generalist and say so.
- **Defer for depth, keep the wrapper** — the hard rules still apply *around* the specialist's work:
  the PreToolUse gate still gates destructive/money/outbound calls, **truestack-quality-control** still gates
  "done", and the honesty contract + code↔memory tally still hold. Specialists bring depth; truestack
  keeps governance, verification, and memory.
- **Mechanism, honestly** — you can't *force* another set's skill to fire; what you can do is not grab
  specialist-domain work with a generalist skill, point it at the better-fit set, and keep truestack's
  gates around the result. Place the most suitable skill — then govern it.

## Canonical chains (run in order)
- **Backend feature** → truestack-architecture-planning → truestack-backend-development → truestack-quality-control
- **Frontend feature** → truestack-architecture-planning → truestack-react-frontend → truestack-quality-control
- **External effect** (live external call) → truestack-backend-development → truestack-mcp-integration → truestack-quality-control  *(shipping/releasing the service is the Deploy / CI-CD chains, not this one)*
- **Bug fix** → truestack-root-cause-debugging → truestack-quality-control
- **Parallel build** → truestack-architecture-planning → truestack-agent-coordination → (workers run truestack-backend-development / truestack-react-frontend) → truestack-quality-control
- **Research → decision** → truestack-deep-research → truestack-architecture-planning
- **Reference → upgrade** → truestack-reverse-engineering → truestack-architecture-planning (approval gate) → truestack-backend-development → truestack-quality-control
- **Schema / data migration** → truestack-architecture-planning (approval gate) → truestack-database-migrations → truestack-backend-development → truestack-quality-control  *(risky DDL/backfill also hits the PreToolUse gate in `hooks/`)*
- **Deploy / ship to the box** → truestack-architecture-planning (gate the deploy design) → truestack-deploy-and-runtime → truestack-quality-control
- **Set up CI/CD (ship it)** → truestack-architecture-planning → truestack-backend-development → truestack-quality-control → truestack-ci-and-delivery  *(encodes the checks as CI · release · health-gated deploy; cutover → truestack-deploy-and-runtime, migration step → truestack-database-migrations)*
- **Make it observable** → truestack-architecture-planning → truestack-observability → truestack-quality-control  *(its traces/metrics/logs then feed truestack-root-cause-debugging as evidence)*
- **Secure / harden a feature** → truestack-architecture-planning (gate auth/credential/security design) → truestack-application-security → truestack-backend-development → truestack-quality-control  *(truestack-application-security owns the STRIDE threat model + the controls; truestack-backend-development implements them; QC's per-change safety pass enforces them. A standalone security review = truestack-application-security → truestack-quality-control, no build step.)*
- **API contract → implementation** → truestack-architecture-planning (gate a public/versioned contract) → truestack-api-design → truestack-backend-development → truestack-quality-control  *(backward-compat/spec-lint rules are encoded as CI checks by truestack-ci-and-delivery)*
- **Dependency change / supply-chain** → truestack-dependency-management → truestack-backend-development (apply the bump) → truestack-quality-control  *(the scan + SBOM step is encoded in CI via truestack-ci-and-delivery; a consequential new dep or cooldown override goes through truestack-architecture-planning's gate first)*
- **Privacy / compliance** → truestack-architecture-planning (gate the policy design) → truestack-data-privacy (classification, retention, erasure, consent, audit, breach) → truestack-database-migrations (the purge/erasure DDL + bounded backfill) → truestack-backend-development (consent/audit/erasure code) → truestack-quality-control  *(truestack-observability implements the PII-redaction policy truestack-data-privacy defines; destructive purge/key-destruction also hits the PreToolUse gate in `hooks/`)*
- **Recurring anything** → wrap the chain with truestack-task-scheduling
- **Always**: every chain reads truestack-project-memory first; truestack-quality-control is the gate before "done"; and code and project memory must reconcile — the tally balances — before anything is called done.

## Single agent or parallel?
Default **single-agent** — coordination overhead and human review are the real costs, and most
work is sequential or tightly coupled. Hand to **truestack-agent-coordination** only when the plan has
genuinely independent tasks, the work is big enough to pay the overhead, and shared contracts
(schema / interfaces / API shapes) are defined first. Start at 2–3 agents.

## Handoff discipline
- Route, then let the destination skill own its method — don't re-explain or re-run its steps here.
- Pass forward what it needs: the goal, the acceptance criteria, relevant memory, prior results.
- After each step, check the result against its acceptance criteria before moving to the next. If
  a step fails, loop **within** that skill (build loop / verify-or-loop) — don't restart the chain.
- **Nothing is "done" until truestack-quality-control passes**, every acceptance criterion maps to evidence, and the code↔memory tally reconciles (memory updated to match the change).

## Explain it simply
Open with the route in one plain line — what you'll do and in what order ("Plan the schema, build
the endpoint, then QC it"). Get a yes before any high-risk or parallel dispatch. Report each
step's result in one line. If you abstained or couldn't route cleanly, say so plainly.

## Honest exit
Report against the goal, not the effort. If the chain stalls — a blocked dependency, a conflicting
constraint, a claim you can't verify — stop and give an honest completion score (criteria met /
total + what blocks each unmet one) rather than declaring a done you can't prove (honesty
contract). An accurate 7/10 the user can act on beats a false 10/10.
