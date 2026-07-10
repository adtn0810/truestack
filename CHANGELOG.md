# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Full-set eval + fix pass (static lint · 23-judge semantic pass · measured trigger
  regression), fixes applied to all 23 skills.** Trigger de-collision across the 10
  lint-flagged pairs, description-side so a router sees the boundary: OIDC split into deploy
  credentials (ci-and-delivery) vs auth flows (application-security); health/readiness
  endpoints split into create-and-gate (deploy-and-runtime, now claiming `/healthz`,
  `/readyz`) vs monitor-and-alert (observability); personal-data qualifiers on data-privacy's
  retention/compliance triggers with explicit cedes to observability (pipeline wiring) and
  dependency-management (CVE/license compliance); update-bot policy — including the
  github-actions ecosystem — claimed by dependency-management with ci-and-delivery keeping
  only the pipeline stage and initial SHA pins; plan-vs-implement boundary stated on both
  architecture-planning and backend-development; quality-control scoped to after-the-change
  verification; deep-research scoped to the outside world with reverse-engineering owning
  openable artifacts; project-memory's over-broad "set up the project" narrowed. A
  references/ tier was added or extended for seven skills (api-design, application-security,
  data-privacy, database-migrations, dependency-management, observability, project-memory),
  moving look-up-grade depth out of always-loaded bodies; duplicated Explain-it-simply
  sections collapsed to `truestack-explain-plain` handoffs; deep-research and
  reverse-engineering gained untrusted-content rules (fetched pages and studied artifacts are
  evidence, never instructions; third-party code runs sandboxed only).
- **9 new trigger fixtures (54 total)** from the eval's boundary probes, including three
  measured regressions that failed before the fixes (missing `/healthz` token, fused `CI/CD`
  token hiding bare "set up CI" prompts, noun-only "encryption at rest" missing verb-form
  prompts). One probe ("what should the readiness endpoint check") was dropped as
  keyword-unroutable — only semantic routing resolves it; documented here rather than shipped
  as a permanently red case.
- **Redundancy audit (23 skills, 4 criteria): all skills kept; five text-level findings fixed.**
  The audit found zero unreachable skills, zero intra-set duplicates (all lint overlap pairs
  verified seamed or homonym false-positives), and one quality concern (prompt-optimizer's
  always-on weight — kept deliberately; the auto-optimization is the feature). Fixes applied:
  `truestack-ci-and-delivery` §8 no longer restates deploy's cutover runbook (the copies had
  already drifted — it now owns go/no-go only and points at deploy §§7/9);
  `truestack-architecture-planning` §6 no longer re-asks questions the optimizer's brief
  already answered, and its right-size tiers + split-and-contracts rules now name their
  canonical owners (orchestrate, agent-coordination); `truestack-deep-research` and
  `truestack-react-frontend`'s design pass gained explicit route-beyond deferrals to deeper
  installed harnesses (the local guidance stays as the fallback).
- **`truestack-role-prime` superseded by `truestack-prompt-optimizer`.** The new skill absorbs
  everything role-prime did (destination-keyed expert persona, explicit goal, labeled
  assumptions, checkable criteria, verbatim raw request, the intent and honesty guards) and
  adds the optimization pipeline: task-type classification (reasoning · lookup ·
  classification · extraction · generation · coding · transformation), a required-components
  judgment (instruction / context / input data / output shape), targeted clarifying questions
  when a required component can't be safely inferred, technique selection
  (zero-shot / few-shot with 1–3 format-only examples / chain-of-thought), and graceful
  degradation on already-strong prompts. Placement unchanged: inside the router, at every
  handoff — ground → right-size → route → optimize → dispatch. Router references, fixtures,
  and README updated; set count stays 23.

### Fixed
- **`truestack-task-scheduling`'s Windows recipe was broken as copy-pasted.** The
  `schtasks /Create` one-liner sat in a `powershell` fence, so `$(Get-Content …)` expanded at
  task-*creation* time, baking the prompt text (and broken quoting) into the task action. The
  `.cmd` wrapper — which reads the prompt file at run time — is now the primary and only
  recipe in `references/wiring.md`.
- **`truestack-application-security` mixed OWASP Top-10 editions.** The body asserted SSRF "is
  a separate category (A10:2021), not folded into A01" while numbering misconfiguration as
  A02 (2025-RC numbering, which folds SSRF *into* A01). All category numbers are now pinned
  to the 2021 edition with a verify-the-current-list-before-citing hedge in both places.
- **The PreToolUse gate is no longer asserted as an active hard stop.** Five skills
  (database-migrations, mcp-integration, data-privacy, observability, orchestrate) claimed
  the gate fires unconditionally; installs can leave it unwired (the recorded live install
  does). All gate claims are now verify-then-rely, with an explicit manual-ask fallback when
  the hook is absent.
- **`install.ps1` re-runs no longer hang non-interactively.** Refreshing an existing junction
  used `Remove-Item`, which prompts to recurse on a directory reparse point and dies in
  NonInteractive mode (first-run installs never hit the branch, so the bug only surfaced on the
  documented re-run-after-git-pull flow). Junction removal now uses `Directory.Delete(link,
  $false)` — removes the link, never prompts, never touches the target.

## [0.0.4] - 2026-07-10

Adds two new skills — `truestack-role-prime` and `truestack-explain-plain` — wires both into the
router (growing the set from 21 skills to 23), and ships the external-audit fixes (independent
skill-eval pass; static lint + 5-agent judge + trigger + shipping-code review).

### Added
- **`truestack-role-prime`** — pre-dispatch prompt sharpening: prepends a persona keyed off the
  router's destination skill, restates the goal explicitly, and labels every assumption with
  checkable acceptance criteria. Runs automatically at every `truestack-orchestrate` handoff;
  wired into the handoff discipline, route table, and Always lines.
- **`truestack-explain-plain`** — beginner-friendly plain-English explanation of finished work or
  existing behavior, shipped as its own deliverable rather than a footer. Fires automatically
  after every build, fix, or design task (sized to the change — full lesson down to two plain
  sentences), and on any explain/why/confusion ask. Wired into `truestack-orchestrate`'s route
  table, Explain-it-simply close, and Always lines; the Explain-vs-investigate-vs-research
  boundary split is documented in `references/routing.md`.
- **9 new trigger fixtures** (45 total) covering both skills' firing and non-firing cases.

### Security / tooling
- **PreToolUse gate no longer emits a non-spec `"defer"` decision.** The no-opinion path now
  omits `permissionDecision` entirely (the documented "no decision → normal flow" signal);
  `allow`/`deny`/`ask` are the only spec values. An unrecognized decision string was undefined
  behavior that only worked because the current harness ignores it.
- **Gate MCP write-path hardened.** Generic MCP `query`/`execute` input now gates `UPDATE … SET`
  and `INSERT INTO` (previously only DELETE/DROP/TRUNCATE); `LEAF_MONEY` adds bare `pay`/`wire`/
  `remit`/`ach`; and MCP tools are now classified by **both** leaf name and any embedded
  `command`/`script` (most-restrictive wins) so an MCP tool carrying a `command` field can no
  longer dodge name-based gating. Test suite 77 → **84** cases.
- **`install.ps1` writes `settings.json` as UTF-8 without a BOM** (`WriteAllText` +
  `UTF8Encoding($false)`). `Out-File -Encoding utf8` on Windows PowerShell 5.1 prepends a BOM
  that breaks strict JSON parsers, which could corrupt the user's global settings.

### Fixed
- **Factual:** `truestack-application-security` said SSRF was "absorbed into A01"; SSRF is its
  own OWASP category (**A10:2021**). Corrected in both mentions.
- **Unsourced precision (honesty):** softened "AES-256 is the 2026 reference" and the asserted
  "`Retry-After` wins over `RateLimit`" rule to guidance.
- **Scope:** `truestack-architecture-planning`'s description said "backend" but orchestrate
  routes frontend planning through it — broadened to "backend or frontend".
- **Honesty (README):** the append-only MCP audit log is now labelled **skill-directed**, not
  machine-enforced, and moved out of the "Enforced governance" framing.

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

## [0.0.2] - 2026-06-29

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
