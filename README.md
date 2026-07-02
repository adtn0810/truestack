# truestack

A lightweight, **honesty-first** coding skill set for Claude Code — packaged as a **plugin**
that bundles 21 skills, 8 slash commands, and an MCP integration layer, all behind a single
**`truestack-orchestrate`** router that reads the request, right-sizes it, and dispatches to the right
skill in the right order. Language-aware backend skills (Express · .NET · Python), a pro React
frontend skill, multi-agent / multi-session coordination, an always-on honesty contract,
committed repo-memory, verified deep research, scheduling, and **real tool integrations** —
with process that sizes itself to the work.

**Highlights:**
- **`truestack-orchestrate` router** — classifies any request, right-sizes it, runs the canonical chain, and gates everything through `truestack-quality-control`; routes to the best skill even when it lives in another installed set.
- **Enforced governance** — a PreToolUse hook denies catastrophic and asks on money/destructive/schema/outbound tool calls (77-case tested), plus an append-only MCP audit log. *Enforced once wired:* automatic with plugin install, a one-time settings merge with drop-in install (step 2 below).
- **Honesty, machine-checked** — an always-on grounding contract, a code↔memory reconciliation tally, and auto-research of current-fact decisions from authoritative sources.
- **Full lifecycle** — plan · backend/frontend · API contract · migrations · deploy · CI/CD · observability · security · dependencies · data-privacy · debugging · reverse-engineering · research · scheduling · multi-agent coordination · self-evaluation.
- **Self-measuring** — ships its own deterministic skill lint + a behavioral routing eval, both run in CI.

## The skills (21)

| Skill | Fires on | Job |
|---|---|---|
| `truestack-orchestrate` | **first, on any non-trivial request** | front-door router: ground → right-size → route to the right skill(s) → run the canonical chain → gate through `truestack-quality-control` |
| `truestack-project-memory` | first task / "remember" / stale facts | study the repo, maintain committed memory + the always-on contracts (honesty, communication, clarify, boundaries, tool-use) |
| `truestack-architecture-planning` | designing/scoping new work | right-size → clarify (loops) → architecture → testable criteria → tasks (parallel vs sequential) → gate risk |
| `truestack-backend-development` | implementing backend | match/recommend stack (Express · .NET · Python) → accurate, load-safe code; **build loop** to acceptance, or an honest score |
| `truestack-react-frontend` | building/reshaping React UI | distinctive design **and** sound React engineering (arch, state, perf, a11y, browser + visual QA) |
| `truestack-root-cause-debugging` | a bug/error/regression | reproduce → confirm root cause → permanent fix → **verify-or-loop** until proven fixed |
| `truestack-quality-control` | after any change | tests (+property) · types/lint · 6-axis review · load/perf · safety (OWASP) · intent check |
| `truestack-agent-coordination` | parallel agents / research fan-out / continuing a session | decompose → worktree isolation → shared task ledger → merge protocol |
| `truestack-mcp-integration` | a task needs live data or a real external action | use connected MCP tools with accuracy/security/honesty discipline; configure `.mcp.json` |
| `truestack-database-migrations` | schema/data change · migration · backfill (high-risk) | expand/contract · zero-downtime DDL · reversible up/down · idempotent batched backfills |
| `truestack-deploy-and-runtime` | deploy/run on a VPS · "my deploy causes downtime" | Docker · nginx · TLS · systemd · SIGTERM drain · blue-green + instant rollback |
| `truestack-ci-and-delivery` | CI/CD · GitHub Actions · release · "ship it" | pipeline gates · SHA-pinned actions · required checks · semver release · health-gated deploy |
| `truestack-observability` | logging/metrics/tracing · SLOs · "no telemetry yet" | structured logs · OTel metrics/traces · RED/USE · burn-rate alerts · bounded on one box |
| `truestack-application-security` | "is this secure" · auth · access control · OWASP · injection · secrets | authn/authz (deny-by-default, IDOR/BOLA) · OWASP Top 10 · structural injection prevention · Argon2id · CSRF/SSRF · STRIDE |
| `truestack-api-design` | API contract · REST/GraphQL/gRPC · versioning · pagination · idempotency | contract-first · RFC 9457 errors · cursor pagination · idempotency keys · OpenAPI/contract tests |
| `truestack-dependency-management` | add/pin a dependency · CVE/SBOM/license · "is this package safe" | lockfile/pinning · Renovate cooldown · CVE/GHSA triage · SBOM · license · typosquat/SLSA |
| `truestack-data-privacy` | PII · GDPR/CCPA · right-to-erasure · retention · consent | PII inventory/classification · retention + erasure · consent · audit logging · breach readiness |
| `truestack-deep-research` | "research / compare / what's best/latest" | parallel search → primary sources → adversarial verification → cited answer + confidence |
| `truestack-reverse-engineering` | shared code/reference · "how does this work" · "adopt this" · upgrade from a reference | verified model (verified vs inferred) → transferable idea → gated, license-aware upgrade path |
| `truestack-task-scheduling` | "every day / weekly / remind me / run at" | self-contained job spec (trigger · run prompt · delivery · failure policy) wired to the host scheduler |
| `truestack-skill-evaluation` | "score / rate / audit / improve" a skill | static lint + judge + behavioral trigger test → scorecard with fixes; its own quality gate |

## Slash commands (8)

| Command | Does | Routes to |
|---|---|---|
| `/truestack-verify [scope]` | full QC sweep + verdict | `truestack-quality-control` |
| `/truestack-loop <target>` | iterate to proven-done, or honest score | `truestack-backend-development` / `truestack-root-cause-debugging` |
| `/truestack-simplify [target]` | maintainability simplify pass, behavior unchanged | `truestack-quality-control` |
| `/truestack-run [tests\|build\|lint\|all]` | run the stack's checks, report in a table | `truestack-quality-control` tooling |
| `/truestack-deep-research <question>` | verified, cited multi-source answer | `truestack-deep-research` |
| `/truestack-schedule <what> <when>` | set up a recurring/deferred run | `truestack-task-scheduling` |
| `/truestack-onboard [focus]` | study repo + build committed memory | `truestack-project-memory` |
| `/truestack-eval [target]` | score/audit skills — lint + judge + trigger test | `truestack-skill-evaluation` |

`/truestack-onboard` is intentionally **not** `/init` (that name is a built-in Claude Code command).

## Integrations (MCP) — guidance that can finally *act*
`truestack-mcp-integration` turns the set from advice into action through connected MCP servers, while
keeping the discipline: **discover before you assume**, treat tool output as **untrusted data**,
**read freely / write carefully**, and keep **money, destructive ops, schema changes, and
outbound sends Ask-first**. Idempotency on retried writes; verify the real effect afterward. Every Ask-first call also leaves an **approval receipt + append-only audit row** (`.ai/agents/mcp-audit.md`) so external effects are reviewable like code.
Servers are declared in a committed, **secret-free** `.mcp.json` (env-var expansion `${VAR}`);
this ships with an empty `.mcp.json` plus a `.mcp.example.json` template — connect only what a
project needs. Full schema + per-category checklist (DB · vector · payments · webhooks · search)
in `skills/truestack-mcp-integration/references/mcp-config.md`.

## Honesty & anti-hallucination (always-on)
Seeded into `CLAUDE.md` so it applies to every reply, with the full contract in
`skills/truestack-project-memory/references/honesty.md`. In impact order: **ground, don't recall**;
**abstain** when evidence is thin; **verify** consequential claims before finalizing; **truth
over agreement**; separate verified / inferred / unknown; never fabricate paths, APIs, or
numbers. Hallucination is structural — the contract makes it rare and always flagged, not "solved."

## Multi-agent & multi-session (no overwrite, no collapse)
`truestack-agent-coordination` separates **isolation** (each writing agent in its own git worktree + branch)
from **coordination** (shared contracts up front, a task ledger where each agent writes only its
own row, non-overlapping scope, defined merge order). Memory writes are append-or-section; a
later session resumes from committed memory + the ledger + status files. Caps at 2–3 agents to start.

## Language-aware backend & pro React frontend
`truestack-backend-development`/`truestack-quality-control` adapt to the project's language — stack idioms live in
`truestack-backend-development`'s `references/stacks.md`, and the OWASP-aligned security checklist for
**Express.js · .NET · Python** lives in `truestack-quality-control`'s `references/security.md`.
`truestack-react-frontend` holds two bars at once — anti-AI-slop visual design and the engineering a
design-only skill skips (architecture, state/data, React 19, Core Web Vitals, a11y, testing).

## How they chain
- Entry point: `truestack-orchestrate` reads the request, right-sizes it, and dispatches into one of the chains below (skip it for a trivial one-off).
- Backend: `truestack-architecture-planning` → `truestack-backend-development` → `truestack-quality-control`
- Frontend: `truestack-architecture-planning` → `truestack-react-frontend` → `truestack-quality-control`
- External effects: `truestack-backend-development` → `truestack-mcp-integration` → `truestack-quality-control`
- Parallel: `truestack-architecture-planning` → `truestack-agent-coordination` → (workers run `truestack-backend-development`/`truestack-react-frontend`) → `truestack-quality-control`
- Fixes: `truestack-root-cause-debugging` → `truestack-quality-control`
- Research / recurring: `truestack-deep-research` (← `truestack-agent-coordination` fan-out); wrap with `truestack-task-scheduling` to recur
- All read project memory first; `truestack-project-memory` owns it.

## Install

This repo is itself a valid Claude Code plugin (`.claude-plugin/plugin.json` +
`marketplace.json`, `skills/`, `commands/`, `.mcp.json`). Pick one method.

> **Names are already namespaced.** Every skill and command carries a `truestack-` prefix
> (`truestack-orchestrate`, `/truestack-verify`, …) so they never collide with other installed
> sets. This means **drop-in is the recommended install** — it keeps those flat names as-is.
> Plugin-marketplace install *also* namespaces by plugin id, so it would double up to
> `truestack:truestack-orchestrate`; use it only if you prefer plugin-managed updates.

**Drop-in, kept current with `git pull` — recommended.** Two steps: link the skills/commands,
then wire the hooks (skills and commands auto-load from `~/.claude/`; **hooks never do** — an
unwired gate is silently dead).

*Step 1 — link.* macOS / Linux (symlinks):
```sh
git clone <your-fork-url> ~/.claude/truestack
mkdir -p ~/.claude/skills ~/.claude/commands
for d in ~/.claude/truestack/skills/truestack-*;      do ln -s "$d" ~/.claude/skills/;   done
for f in ~/.claude/truestack/commands/truestack-*.md; do ln -s "$f" ~/.claude/commands/; done
# update anytime:  cd ~/.claude/truestack && git pull
```
Windows (PowerShell — junctions for skill folders need **no** admin or Developer Mode; command
*files* can't be junctioned, so copy them and re-copy after each `git pull`):
```powershell
git clone <your-fork-url> "$HOME\.claude\truestack"
New-Item -ItemType Directory -Force "$HOME\.claude\skills","$HOME\.claude\commands" | Out-Null
Get-ChildItem "$HOME\.claude\truestack\skills\truestack-*" -Directory | ForEach-Object {
  New-Item -ItemType Junction -Path "$HOME\.claude\skills\$($_.Name)" -Target $_.FullName }
Get-ChildItem "$HOME\.claude\truestack\commands\truestack-*.md" | ForEach-Object {
  Copy-Item $_.FullName "$HOME\.claude\commands\$($_.Name)" -Force }
# update anytime:  cd "$HOME\.claude\truestack"; git pull   # then re-run the Copy-Item loop
```
(True symlinks on Windows need an elevated shell — or PowerShell 7+ with Developer Mode;
Windows PowerShell 5.1 can't create them unelevated even with Developer Mode. Junctions avoid
all of that.) Or run the bundled one-shot: `powershell -ExecutionPolicy Bypass -File .\install.ps1 -WireHooks`
— it links/copies everything, migrates a stale pre-namespacing install to a backup folder, and
wires the hooks (Step 2) with a settings backup.

*Step 2 — wire the hooks.* Merge this into `~/.claude/settings.json` (adjust the clone path;
full options + per-project variant in [`hooks/README.md`](hooks/README.md)):
```json
{ "hooks": {
  "PreToolUse": [ { "matcher": "*", "hooks": [
    { "type": "command", "command": "node \"$HOME/.claude/truestack/hooks/pretooluse-gate.mjs\"", "timeout": 30 } ] } ],
  "UserPromptSubmit": [ { "hooks": [
    { "type": "command", "command": "node \"$HOME/.claude/truestack/hooks/truestack-orchestrate-reminder.js\"", "timeout": 10 } ] } ]
} }
```
Verify: `node ~/.claude/truestack/hooks/test-gate.mjs` (77/77) and `/hooks` inside Claude Code.

Finally, merge the `truestack/.mcp.example.json` entries you need into your project `.mcp.json`.

**Drop-in, one-time copy (simplest; re-copy after each `git pull`):**
```sh
git clone <your-fork-url> truestack
cp -r truestack/skills/*   ~/.claude/skills/      # the 21 truestack-* skills
cp -r truestack/commands/* ~/.claude/commands/    # the 8 /truestack-* slash commands
```
Then do *Step 2 — wire the hooks* above (copying files never wires hooks).

**As a plugin via marketplace (double-prefixes the names — see note above; hooks auto-load, no Step 2 needed):**
```sh
git clone <your-fork-url> truestack
```
Then, in Claude Code:
```text
/plugin marketplace add ./truestack
/plugin install truestack@truestack
```

Validate the bundle anytime with `claude plugin validate .`. Claude Code auto-detects skills and
commands — no restart. Configure `.mcp.json` with your own servers (secrets via env vars) before
using `truestack-mcp-integration`.
