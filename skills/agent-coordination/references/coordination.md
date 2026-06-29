# Coordination templates & merge protocol

## Task ledger — `.ai/agents/tasks.md`
Each agent reads all rows, writes ONLY its own.

```
# Parallel run: <feature>   contracts: <link/section>   merge order: A -> B -> C

| Task          | Owner   | Scope (files/dirs)  | Depends on | Status      | Branch      |
|---------------|---------|---------------------|------------|-------------|-------------|
| A: schema     | agent-A | prisma/, src/db/    | -          | done        | feat/schema |
| B: auth routes| agent-B | src/routes/auth/    | A          | in-progress | feat/auth   |
| C: tests      | agent-C | tests/              | A, B       | queued      | feat/tests  |
```
Status: queued · in-progress · blocked · done. Update your row when you start, block, or finish.

## Status file — `.ai/agents/<task>.status` (or `RESULTS.md` in the worktree)
```json
{ "task": "B", "status": "done", "summary": "5 auth endpoints, 12 tests green",
  "files_changed": ["src/routes/auth/*"], "branch": "feat/auth", "needs": [] }
```

## Scope ownership rules
- One owner per file/dir. No two tasks list overlapping paths.
- Shared contracts (interfaces, schema, OpenAPI) are defined and committed BEFORE parallel implementation; only the assigned agent edits them.
- Off-limits unless assigned: lockfiles, migrations, root config (tsconfig, eslint, CI), shared types.

## Merge protocol
1. Agent finishes -> runs its own tests in its worktree -> marks done + writes status.
2. Orchestrator reviews the diff against the task's acceptance criteria.
3. Merge in dependency order, one at a time, re-running the suite after each (frequent checkpoints contain breakage to one branch).
4. A failing result is re-dispatched with specific corrections, not restarted from scratch.
5. After all merges, run `quality-control` on the integrated branch; clean up worktrees (`git worktree remove`).

## Concurrency caps
2–3 agents to start; ~5–10 before merge/review becomes the bottleneck. Above that you're gated on review, not on the model.

## Isolation vs coordination (don't confuse them)
- Worktrees prevent file overwrites at the branch level — they do NOT make agents agree on architecture or contracts.
- Read-only research agents need coordination (synthesis) but not isolation.
- Writing agents need both: a worktree (isolation) AND a ledger row + defined contracts (coordination).

## Team preset templates
Each preset is a ledger seed + merge order. Trim to the actual work; never exceed the caps.

| Preset    | Agents (roles)                                   | Isolation | Parallel / sequential                  | Gate / merge |
|-----------|--------------------------------------------------|-----------|----------------------------------------|--------------|
| review    | security · performance · architecture · tests    | none (RO) | all parallel                           | synthesize by severity → quality-control |
| debug     | hypothesis×3 → fixer                              | fixer only| hypotheses parallel, fix sequential    | first confirmed cause wins; regression test |
| feature   | contracts → backend ∥ frontend → tests           | per writer| contracts first, then parallel, then tests | merge backend→frontend→tests; quality-control |
| security  | injection · authz · secrets/deps · mcp-governance| none (RO) | all parallel                           | block on Critical |
| migration | migrator + verifier                              | migrator  | sequential (never parallel writes)     | Ask-first; rollback proven |
| research  | deep-research fan-out (RO)                        | none (RO) | all parallel                           | cross-verify before acting |

Read-only (RO) presets need coordination (synthesis) but not worktrees; any writing role needs both.
