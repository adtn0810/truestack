---
name: truestack-agent-coordination
description: Coordinate multiple agents and multiple sessions on the same repo without
  overwriting or colliding with each other. Use whenever work is big enough to split across
  parallel agents, when running research or planning as a fan-out of sub-agents, or when
  continuing work another session started. Covers task decomposition, worktree isolation, a
  shared task ledger, and the merge protocol.
---

# truestack-agent-coordination

Multiple agents go fast only when ownership is clean and the merge path is engineered — the
classic failure is **uncoordinated parallel writes** cascading across everyone. Keep two
mechanisms separate: **isolation** stops agents overwriting each other's files;
**coordination** stops them disagreeing on contracts and tasks. You need both.

## Go parallel only when it pays
Right-size first. Small, sequential, or tightly dependent work stays **single-agent** —
coordination overhead grows faster than linearly with agent count, and review (not the
model) is the real bottleneck. Parallelize only genuinely independent work. Start with
**2–3 agents**; ~5–10 is the practical ceiling before merging dominates.

## 1. Plan and decompose before spawning anything
As the orchestrator, and with human approval before dispatch:
- **Define shared contracts first** — API request/response shapes, TypeScript interfaces, the DB schema/migration. Never let parallel agents invent these independently.
- **One non-overlapping scope per task** — a directory, a layer, a test surface; not an abstract idea. Overlapping paths cause merge conflicts even with isolation.
- **SPEC-test each task** before dispatch: clear scope, single owner, explicit acceptance criteria, a done/test command. If you can't specify it cleanly, you lack context — gather more, don't dispatch.
- **Map dependencies**: serialize dependent tasks into phases, parallelize independent ones (Phase 1: schema + scaffolding in parallel → Phase 2: routes → Phase 3: tests + docs).
- **Off-limits unless assigned**: lockfiles, migrations, root config, shared interfaces.

## 2. Isolate every writing agent
Give each implementing agent its own **git worktree + branch** so parallel sessions never
touch the same working files (Claude Code: launch the subagent with `isolation: worktree`,
or run separate sessions in `git worktree add` checkouts). Per-worktree CLAUDE.md, plan, and
memory come along automatically. **Read-only research/explore agents don't need isolation** —
unless they run scripts, install packages, or otherwise perturb the directory.

## 3. Coordinate through surfaces, not by hoping
- **Shared task ledger** (`.ai/agents/tasks.md`): every agent reads the whole thing but **writes only its own row** — claim a task (in-progress + agent id + time), update status, mark done. No agent rewrites another's row.
- **Result/status file per agent** (`RESULTS.md` in its worktree, or `.ai/agents/<task>.status`): status, summary, files changed — so the orchestrator and the next session know what happened without reading the whole diff.

## 4. Research / planning fan-out
For exploration, dispatch several **read-only** sub-agents in parallel (each in clean
context: codebase map, prior art, options) and synthesize — then **verify their findings
against each other** before acting. This is the cheap, safe parallelism: no writes, no
isolation needed.

## 5. Integrate (merge without collapse)
Decide the protocol **up front**: PR-per-agent (clean, auditable) or orchestrated
**sequential merge in dependency order**. Merge in small, frequent checkpoints so a bad
change is contained to one branch, not cascaded. Review each result against its acceptance
criteria; if one fails, **re-dispatch with corrections**, don't restart. Run `truestack-quality-control` on the
integrated result, then clean up worktrees.

## Team presets (named starting points)
Don't re-derive a team each run — start from a preset, then trim. Each defines roles, parallel vs
sequential, and merge order; all still obey isolation (worktrees) + the ledger. Right-size first —
a preset is a starting point, not a mandate. Caps still apply (2–3 to start).
- **review** — read-only reviewers in parallel: security · performance · architecture · tests → synthesize by severity → `truestack-quality-control`. (No isolation; read-only.)
- **debug** — 3 hypothesis agents probe in parallel (per `truestack-root-cause-debugging`); first evidence-confirmed root cause wins; one fixer applies the fix + regression test.
- **feature** — contracts first (schema/API), then parallel **backend (`truestack-backend-development`) ∥ frontend (`truestack-react-frontend`)**, then tests; sequential merge backend → frontend → tests.
- **security** — parallel: OWASP/injection · authn/authz · secrets/deps · MCP-governance; gate on Critical before merge.
- **migration** — one owned migration stream (Ask-first) + a verifier stream (correctness + rollback). **Never** parallel writers on a migration.
- **research** — read-only `truestack-deep-research` fan-out; cross-verify findings against each other before acting.
Full role/merge templates → `references/coordination.md`.

## Multi-session continuity
A later session resumes from the committed memory + the task ledger + result/status files —
not from a vanished transcript. Update the ledger as you go so the next agent never re-does or
clobbers finished work. The committed `.ai/memory/` is the shared source of truth, merged via
git like code.

## Explain it simply
Show the decomposition as a short phased list (who owns what, parallel vs sequential, the
merge order) and get a yes before spawning. Report each agent's result in one line.

For the task-ledger and status-file templates and the full merge protocol →
**`references/coordination.md`**.
