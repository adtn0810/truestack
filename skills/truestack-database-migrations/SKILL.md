---
name: truestack-database-migrations
description: Author safe schema and data migrations — expand/contract (parallel-change),
  zero/low-downtime online changes, reversible up/down scripts, and idempotent bounded
  backfills. Use whenever the user says "migration", "schema change", "alter table", "add
  / drop / rename column", "change column type", "add constraint / not null / foreign key
  / index", "create index", "backfill", "repopulate", "data migration", "zero / low
  downtime", "online schema change", "expand contract", "dual write", "rollback /
  reversible migration", names a tool (flyway, alembic, rails, django, prisma migrate, ef
  core, liquibase), or reports "this migration locked the table / timed out / is slow".
  High-risk and ask-first; pairs with the approval gate and the PreToolUse gate.
---

# truestack-database-migrations

Changing a live schema is the highest-risk routine work on a self-hosted single server:
there is no replica to fail over to, and one stuck lock can freeze the whole app. The job is
to evolve the schema **without an outage and without losing data** — accuracy and stability
over cleverness, every breaking change split across deploys.

First, read project memory — `CLAUDE.md` is auto-loaded (Principles + Boundaries); consult
`.ai/memory/` for the DB engine, migration tool, and recorded commands. If none exists, run
`truestack-project-memory`. This is **ask-first, high-risk** work: route the plan through
`truestack-architecture-planning`'s approval gate **before** writing any migration, and remember the
PreToolUse gate in `hooks/` makes `DROP`/`TRUNCATE`/destructive DDL a hard stop — it forces a
human yes *before* the command runs, even if settings would allow it. See `hooks/README.md`.

**Where this skill sits:** it owns the migration *artifact* — reversible up/down DDL, the backfill,
the expand/contract sequencing. The data-access code that uses the new schema is
`truestack-backend-development`; sequencing the migrate step in the deploy pipeline is `truestack-ci-and-delivery`.

## 1. Never break in one deploy — expand then contract
A zero-downtime breaking change is physically impossible in a single release. Old and new app
code run side by side during a deploy, so the schema must stay compatible with **both** at
once. Split it:
- **Expand** (deploy 1) — add the new column/table, **dual-write** old+new, **backfill**, leave
  the old schema intact. Nothing breaks: both code versions still work.
- **Contract** (a later deploy, after the new code has soaked) — flip reads to the new path,
  stop writing the old, then drop. Sequence the irreversible drop as its **own final** deploy.

The phase boundary is your safe checkpoint: if anything looks wrong you **pause indefinitely
on the prior phase** instead of rolling back under fire.

## 2. Lock + timeout discipline (the single most-missed safeguard)
Before any DDL, set a short timeout and retry — even seasoned DBAs skip this:
```sql
SET lock_timeout = '2s'; SET statement_timeout = '...'; <DDL>;
```
Wrap it in a **retry loop with exponential backoff + jitter**. The real danger: a DDL waiting
for an `ACCESS EXCLUSIVE` lock queues *behind* a long-running query, and then every later
query — plain `SELECT`s included — queues behind the DDL. One stuck `ALTER` cascades into a
full app freeze, and on a single box that is a total outage. **Pre-check** for transactions
older than ~1 min before running. A failed-and-retried migration always beats an outage.

## 3. Know instant DDL from a full-table rewrite — rewrite the dangerous ones
- **Instant (metadata-only):** add a nullable column; add a constant default (Postgres 11+).
- **Dangerous (rewrites/scans, full lock):** `NOT NULL` directly, a VOLATILE default, a type
  change, an inline `UNIQUE`/`FK`/`CHECK`.
- **Safe rewrites:** add nullable → backfill → enforce `NOT NULL` via a `CHECK ... NOT VALID`
  then `VALIDATE` (validate takes a weak lock that doesn't block reads/writes); add `FK`
  `NOT VALID` then validate separately; build indexes with `CREATE INDEX CONCURRENTLY`.

Enforce this **mechanically** with a migration linter (Squawk for Postgres) in CI / pre-commit
— humans miss it every time. `CONCURRENTLY` **cannot run inside a transaction**, yet most
frameworks wrap each migration in one by default: disable the wrapper for that migration
(`disable_ddl_transaction` / non-transactional flag), and make it **idempotent about a leftover
INVALID index** (a failed concurrent build leaves one that must be dropped before retry). This
is the single highest-frequency mistake in real migration PRs.

## 4. Backfill in idempotent, bounded batches — never one giant UPDATE
A single `UPDATE 50M rows` holds a lock and bloats exactly like the DDL you were avoiding, and
a long transaction is the catch-up storm that wedges everything. Instead:
- **Bounded batches** of ~1k–5k rows, each its **own short transaction**.
- **Keyset pagination** — `WHERE id > :last_id ORDER BY id LIMIT n`. Never `OFFSET` (re-scans
  from the top; degrades from seconds to minutes as it advances).
- **Idempotent** — only touch rows still needing it (`WHERE new_col IS NULL`), so a partial
  failure + retry never double-applies and resumes from the last id.
- On one box the backfill competes directly with production: **sleep between batches**, watch
  primary CPU/IO and MVCC bloat, run `VACUUM` after, and throttle or pause on degradation.

## 5. Reversible by design — but the down script is a tested artifact, not a comfort blanket
Write an explicit **down** for every up and test it in CI (apply → rollback → re-apply).
Auto-generated/irreversible downs (dropped data, lossy type changes) are a false safety net
that shatters under real data. The deeper rule: **prefer roll-FORWARD over rollback** for
anything that touched data — a dropped column's data is gone, so the real recovery path is the
next expand step, not a down migration. Reserve true reversibility for cheap metadata-only
steps; for a destructive step the "rollback" is the prior deploy still running, because you
sequenced the drop last.

## 6. Verify parity before flipping reads and before the drop
The dual-write window is where silent divergence hides — a missed code path (a raw SQL update,
a bulk job, a second service) lets new data drift, and you only find out after dropping the
old column. So:
- Run a **count/checksum comparison** (old vs new) over the full set before trusting the new path.
- Ideally **shadow-read** on live traffic (read both, compare, log mismatches) for a soak period.
- **Gate the contract step on a clean parity report**, not on "the backfill finished".
- **Decouple the app from the column before dropping it** — most ORMs `SELECT *`/list all mapped
  columns, so dropping a column the deployed app still reads errors every query instantly. Order:
  ship code that stops referencing it → confirm all instances are on that build → drop later. Same
  for **renames**: never rename a live column/table in place — add-new + dual-write + backfill +
  switch + drop-old.

## On this single server
The trigger-based online-DDL tools (gh-ost, pt-online-schema-change) assume replication and a
place to shift load — usually **not** your path here. Your toolkit is native transactional DDL
+ expand/contract + throttled batched backfills, all on the one box that also serves users.
So: schedule heavy backfills for low-traffic windows; keep **disk headroom** (rewrites and
`CONCURRENTLY` temporarily duplicate the table/index — a "safe" migration can still fill the
disk and crash the box); and lean doubly on the lock-timeout + retry discipline and the
"expand is always non-breaking" rule, because there is no replica to fail to.

## Gate, then hand off
Require, before any risky migration runs: a CI migration linter (Squawk) that blocks dangerous
DDL, a PR sign-off label, a written rollback/forward-recovery plan, a fresh backup/PITR
checkpoint taken **immediately before**, and a confirmation of which app versions run
concurrently. **Dry-run the exact migration against a production-sized copy** to measure real
lock duration and runtime — "it was instant on a 1k-row dev table" is how teams meet the
40-minute production rewrite. Implement the scripts via `truestack-backend-development`; run
`truestack-quality-control` before "done". If the change altered a recorded command or decision, update
`.ai/memory/` in the same change so the code↔memory tally stays balanced.

## Explain it simply
Say in one plain line what each step does and to which deploy it belongs ("Deploy 1 adds a
nullable `email_verified` and backfills it; reads still use the old flag"). Show the
expand→contract sequence as a short ordered list so the user sees that the drop comes last and
separately. Before anything irreversible, state the recovery path in one sentence and get an
explicit yes — never run a destructive migration on a prompt's say-so alone.
