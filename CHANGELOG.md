# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2] - 2026-06-29

### Fixed
- `orchestrate`'s description failed to parse in Claude Code's skill loader: an unquoted
  multi-line YAML description contained a `": "` (colon-space), which a strict YAML parser reads
  as a key/value split, so the router loaded with no description and wouldn't trigger reliably.
  Rephrased the colon to a dash. Scanned all descriptions — no other skill was affected. (The
  deterministic lint's lenient regex missed it; the real YAML parser didn't.)

## [0.0.1] - 2026-06-29

Initial public release. A lightweight, **honesty-first** coding skill set for Claude Code — 21
skills behind an `orchestrate` router, an enforced PreToolUse governance gate, a code↔memory
reconciliation tally, and automatic enterprise-grade research. Tuned for solo, self-hosted work.

### Skills (21)
- **Spine** — `orchestrate` (front-door router), `project-memory`, `architecture-planning`, `quality-control`.
- **Build** — `backend-development`, `react-frontend`, `api-design`, `database-migrations`.
- **Operate** — `deploy-and-runtime`, `ci-and-delivery`, `observability`.
- **Harden** — `application-security`, `dependency-management`, `data-privacy`.
- **Investigate** — `root-cause-debugging`, `reverse-engineering`, `deep-research`.
- **Act & coordinate** — `mcp-integration`, `agent-coordination`, `task-scheduling`.
- **Meta** — `skill-evaluation`.

### Governance & quality
- **Enforced PreToolUse gate** (`hooks/`) — denies catastrophic commands, asks on
  money/destructive/schema/outbound tool calls, defers reads; never auto-allows. 54-case tested.
- **Code↔memory tally** — committed memory must reconcile with the code before "done".
- **Auto-research** — consequential current-fact decisions are grounded in authoritative sources
  before committing, not from recall.
- **Cross-set routing** — defers single-domain depth to installed specialist sets while keeping
  truestack's governance / QC / honesty wrapper.
- **CI** — skill lint + unit tests, PreToolUse gate tests, behavioral trigger eval (30 cases),
  `gitleaks` secret scan, `claude plugin validate`.
- **Packaging** — MIT `LICENSE`, `SECURITY.md` (threat model + disclosure), `.claude-plugin/`
  plugin + marketplace manifests, secret-free `.mcp.json`.
