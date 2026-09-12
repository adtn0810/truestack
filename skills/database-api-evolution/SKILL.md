---
name: database-api-evolution
description: Use when designing or changing database schemas, migrations, persisted-data transformations, indexes, API contracts, or compatibility across consumers and deployed versions.
---

# Database and API evolution

Define the old and intended contract before changing it. Identify the database engine/version or API protocol, affected producers and consumers, data ownership, deployed versions, and the source of truth. Read existing migration and compatibility conventions. Ordinary backend implementation without a contract or persisted-data change stays in backend-engineering.

For APIs, describe request/response fields, units, nullability, errors, authorization/ownership, pagination and stable ordering, retry/idempotency behavior, and limits as relevant. Consider clients that tolerate added fields differently and consumers that still send the old shape. Follow existing versioning conventions; introduce a version or deprecation period when required by a real incompatibility. Use the project's contract artifacts and validators rather than inventing a second specification.

For database changes, inspect keys, constraints, indexes, cardinality, transaction boundaries, and the query patterns the change supports. Check engine-specific locking and online-operation behavior before asserting that a migration is safe. Estimate the affected rows and resource costs from available evidence. Do not assume every engine can roll back DDL or restore deleted rows.

Choose a rollout that fits the risk: expand compatible structure, deploy tolerant readers/writers, migrate bounded batches with checkpoints, reconcile, then retire the old path when no consumers need it. Use shadow comparisons or flags when they materially reduce risk, not as compulsory steps for every local schema edit. Define retry identity and restart behavior for backfills. A successful command with zero affected rows may still mean the intended work did not happen.

For calculations and reporting, specify intended value changes and preserved invariants, including currency, rounding, tenant/account scope, grain, date axis, deduplication, ordering, and strict-table rules where applicable. A neutral refactor needs equality evidence; a correctness fix needs evidence for the expected delta. Never silently preserve known wrong output or loosen accuracy checks to pass.

Prepare the migration/contract artifacts, local tests, compatibility checks, and recovery procedure before any separately unauthorized production write. Verify backup/restore capabilities before relying on them. Existing explicit authorization remains valid within its scope; ask only for an additional live mutation that has not been authorized.

Report the consumer impact, validation evidence, rollout/recovery limits, and runtime steps actually performed. Use test-verify for acceptance evidence and systematic-debugging for measured query or migration performance investigation.
