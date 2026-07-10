# Per-engine migration mechanics

The principles in `SKILL.md` are engine-neutral; the mechanics below are not. Detect the
engine from project memory (`.ai/memory/`) first — applying Postgres recipes to MySQL (or
vice versa) is itself a migration bug.

## Postgres

### Lock + timeout SQL (skill §2)
```sql
SET lock_timeout = '2s'; SET statement_timeout = '...'; <DDL>;
```
Wrap in the retry loop with exponential backoff + jitter. The lock a DDL waits on is
`ACCESS EXCLUSIVE` — that is what queues plain `SELECT`s behind a stuck `ALTER`.

### DDL classification (skill §3)
- **Instant (metadata-only):** add a nullable column; add a constant default (Postgres 11+).
- **Dangerous (rewrites/scans, full lock):** `NOT NULL` directly, a VOLATILE default, a type
  change, an inline `UNIQUE`/`FK`/`CHECK`.
- **Safe rewrites:** add nullable → backfill → enforce `NOT NULL` via a `CHECK ... NOT VALID`
  then `VALIDATE` (validate takes a weak lock that doesn't block reads/writes); add `FK`
  `NOT VALID` then validate separately; build indexes with `CREATE INDEX CONCURRENTLY`.

### `CONCURRENTLY` traps
`CREATE INDEX CONCURRENTLY` **cannot run inside a transaction**, yet most frameworks wrap
each migration in one by default: disable the wrapper for that migration
(`disable_ddl_transaction` / non-transactional flag), and make the migration **idempotent
about a leftover INVALID index** — a failed concurrent build leaves one that must be dropped
before retry.

### Linter
**Squawk** — the CI / pre-commit migration linter that blocks dangerous Postgres DDL
mechanically.

## MySQL / MariaDB

- **Timeout:** `lock_wait_timeout` is the analogue of Postgres `lock_timeout` — keep it short
  and use the same retry-with-backoff discipline.
- **Ask for the cheap algorithm explicitly** — `ALTER TABLE ... , ALGORITHM=INSTANT` (or
  `INPLACE`): MySQL then errors instead of silently falling back to a full `COPY` rewrite.
  What qualifies as INSTANT is version-specific (most arrived in 8.0) — verify against the
  installed version, not from memory.
- **Index builds:** `ADD INDEX` runs INPLACE on InnoDB (concurrent DML allowed) — no
  `CONCURRENTLY` equivalent needed, but it still takes metadata locks, so the timeout
  discipline stands.
- **pt-online-schema-change** (trigger-based) and **gh-ost** (binlog-based) rebuild the table
  as a shadow copy and swap it in — built for fleets with replicas and load headroom. On a
  single self-hosted box they double the table's disk and I/O while production serves —
  usually **not** your path; prefer native INSTANT/INPLACE DDL + expand/contract + throttled
  backfills (skill: "On this single server").
