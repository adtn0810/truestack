# Routing detail — boundary splits & the full chain catalog

Open this when a request straddles two skills or needs a multi-skill chain. The route table in
`SKILL.md` handles the common single-skill cases.

## Boundary splits (who owns which artifact)

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

**Improvement vs defect:** something broken/wrong → **truestack-root-cause-debugging**; a pure make-it-faster/
nicer request with nothing broken → the builder skill for that layer (**truestack-backend-development** /
**truestack-react-frontend**).

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
- **Always**: every chain reads truestack-project-memory first; truestack-quality-control gates "done"; the code↔memory tally must balance before anything is called done.

## Route beyond this set — the mechanics
- **Discover, don't assume** — confirm the specialist set is actually available (its skills appear
  in this environment) before deferring to it; if it isn't, fall back to the truestack generalist
  and say so.
- **Defer for depth, keep the wrapper** — the hard rules still apply *around* the specialist's
  work: the PreToolUse gate still gates destructive/money/outbound calls, **truestack-quality-control**
  still gates "done", and the honesty contract + code↔memory tally still hold. Specialists bring
  depth; truestack keeps governance, verification, and memory.
- **Mechanism, honestly** — you can't *force* another set's skill to fire; what you can do is not
  grab specialist-domain work with a generalist skill, point the work at the better-fit set, and
  keep truestack's gates around the result. Place the most suitable skill — then govern it.
