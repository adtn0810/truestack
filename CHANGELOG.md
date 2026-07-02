# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.3] - 2026-07-02

Self-audit release: the set was scored by its own `truestack-skill-evaluation` (static lint +
5-agent semantic judge + behavioral trigger eval), and every Critical/Major finding fixed.

### Fixed
- **Corrupted routing text** from the 0.0.2 namespacing find-replace: `truestack-data-privacy`'s
  description opened with "Owns the truestack-data-privacy and compliance policy"; similar
  artifacts in `truestack-quality-control`'s description and `/truestack-verify`.
- **Four factual errors**: React auto-memoization is the opt-in React Compiler, not React 19
  itself; `express-async-errors` is Express-4-era advice (Express 5 forwards async rejections
  natively); OCSP stapling recommended after Let's Encrypt ended OCSP (2025); gh-ost described
  as trigger-based (it is binlog-based).
- **Unsourced precision** violating the honesty contract (supply-chain stats, "~30% bundle cut",
  "the only OSS tool…", incident dates) — softened or marked verify-before-citing.
- `SECURITY.md` template leftovers (6.2.x version table on a 0.0.x project, unfilled contact).

### Changed
- **Trigger de-collision**: descriptions no longer double-claim "deploy to my server"
  (ci-and-delivery vs deploy-and-runtime), "redact PII from logs" (data-privacy vs
  observability), "GDPR/CCPA" (application-security vs data-privacy), artifact-less "how does X
  achieve this" (reverse-engineering vs deep-research), bare "set up" (project-memory) and
  "from now on" (task-scheduling); mcp-integration scoped to MCP-mediated actions. Seam
  pointers moved to bodies — negations in descriptions poison keyword routing.
- **truestack-orchestrate** slimmed under the char budget: boundary splits + full chain catalog
  extracted to `references/routing.md` (progressive disclosure).
- Auto-research contract moved from `truestack-deep-research` (where its addressees never load
  it) to the always-on `honesty.md` (§8); quality-control gained a right-size clause; root-cause-
  debugging's verify-or-loop gained a no-progress escalation; task-scheduling ships concrete
  scheduler recipes (`references/wiring.md`).

### Security / tooling
- **PreToolUse gate hardened** (54 → 77 tested cases): PowerShell `-EncodedCommand`, interpreter
  one-liners (`node -e` rmSync / `python -c` rmtree), `find -delete`, `rsync --delete`, SQL
  clients executing destructive statements, destructive `aws`/`az`/`gcloud`/`gh` calls,
  `Format-Volume`/`diskpart`, destructive SQL inside generic MCP `query`/`execute` input; fixed
  the "dropdown"/"drag-and-drop" false-positive; known accepted gaps documented in
  `hooks/README.md`.
- `permissions.template.json` rewritten with valid rule syntax (`Bash(prefix:*)`, exact MCP tool
  ids — mid-name wildcards match nothing).
- **Hook wiring made explicit**: drop-in installs get a settings snippet (previously the gate
  was silently dead outside plugin installs); the `truestack-orchestrate-reminder.js`
  UserPromptSubmit hook now ships in `hooks/` and is registered in `hooks.json`.
- `skill_lint.py` now enforces the rubric's **char** budget (was lines-only); lint output shows
  body chars; trigger eval supports pure should-not-fire fixtures (30 → 36 cases).
- CI: all actions SHA-pinned (real commit SHAs), `push` filtered to `main`, gitleaks given
  `GITHUB_TOKEN`, Claude CLI install pinned.



### Fixed
- `truestack-orchestrate`'s description failed to parse in Claude Code's skill loader: an unquoted
  multi-line YAML description contained a `": "` (colon-space), which a strict YAML parser reads
  as a key/value split, so the router loaded with no description and wouldn't trigger reliably.
  Rephrased the colon to a dash. Scanned all descriptions — no other skill was affected. (The
  deterministic lint's lenient regex missed it; the real YAML parser didn't.)

## [0.0.1] - 2026-06-29

Initial public release. A lightweight, **honesty-first** coding skill set for Claude Code — 21
skills behind an `truestack-orchestrate` router, an enforced PreToolUse governance gate, a code↔memory
reconciliation tally, and automatic enterprise-grade research. Tuned for solo, self-hosted work.

### Skills (21)
- **Spine** — `truestack-orchestrate` (front-door router), `truestack-project-memory`, `truestack-architecture-planning`, `truestack-quality-control`.
- **Build** — `truestack-backend-development`, `truestack-react-frontend`, `truestack-api-design`, `truestack-database-migrations`.
- **Operate** — `truestack-deploy-and-runtime`, `truestack-ci-and-delivery`, `truestack-observability`.
- **Harden** — `truestack-application-security`, `truestack-dependency-management`, `truestack-data-privacy`.
- **Investigate** — `truestack-root-cause-debugging`, `truestack-reverse-engineering`, `truestack-deep-research`.
- **Act & coordinate** — `truestack-mcp-integration`, `truestack-agent-coordination`, `truestack-task-scheduling`.
- **Meta** — `truestack-skill-evaluation`.

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
