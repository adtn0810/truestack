---
name: truestack-data-privacy
description: Owns a self-hosted app's data-privacy and compliance policy — classify PII,
  retain/erase lawfully, encrypt personal data at rest. Use when the request mentions "privacy
  policy", "GDPR", "CCPA / CPRA", "HIPAA / PHI / ePHI", "right to be forgotten / erasure", "delete
  my data", "DSAR", "PII / personal data", "data inventory / classification / mapping", "retention /
  scheduled purge / auto-delete old personal data", "lawful basis / consent / opt-out / Global
  Privacy Control", "pseudonymization / anonymization / de-identification", "encryption at rest /
  crypto-shredding", "audit / access log / who accessed this data", "breach notification / 72
  hours", "define what counts as PII in logs / telemetry" (policy only — redaction wiring, log
  rotation, disk cleanup are truestack-observability), "suppression list / delete from backups",
  or "is this compliant with privacy law (GDPR/CCPA/HIPAA) / store sensitive data" — package
  CVE/license compliance is truestack-dependency-management.
---

# truestack-data-privacy

Personal data is a liability you must be able to find, justify, delete, and prove you
deleted. This skill owns the **privacy policy** for a self-hosted single server: what counts
as personal data, why you may hold it, how long, who may touch it, and how it leaves. On one
box there is no managed compliance plane — the controls have to live in the schema and the
code. Accuracy and provability over good intentions; abstain rather than assert a compliance
claim you can't ground.

Read project memory first — `CLAUDE.md` is auto-loaded (Principles + Boundaries); consult
`.ai/memory/` for the data model, stack, and which regimes apply. If none exists, run
`truestack-project-memory`. Keep the **code↔memory tally** balanced: a new data class, retention rule,
lawful basis, or purge job is a recorded decision — update memory in the same change.

**Auto-research, don't recall.** Regulatory and standards facts drift — never state a GDPR
article, CCPA/CPRA effective date, HIPAA Security Rule requirement, ENISA/NIST method, or
OWASP/CVE detail from memory. Ground each load-bearing claim in an authoritative source
(EDPB/ICO, the regulation text, NIST, HHS) before asserting it — the regime-specific
citations behind the rules below live in `references/regimes.md`; re-verify them at use time.
Defining a retention policy, a deletion pipeline, or crypto-shredding is **consequential,
often irreversible** work — route the design through `truestack-architecture-planning`'s approval gate
before building. **If** the PreToolUse gate is wired (`hooks/README.md` — check it is actually
installed and active), it forces a human-yes before a hard-delete / purge / key-destruction
runs — verify that before relying on it; if it isn't wired, treat the approval as manual and
obtain the explicit human yes yourself.

**Where this skill sits:** it owns the privacy *policy and discipline*, not the mechanics of
every neighbor. `truestack-quality-control` runs the one-shot SAFETY pass on a change and
`truestack-application-security` owns the security *design*; this skill owns the data-handling *rules*
they enforce. `truestack-observability` redacts PII in telemetry but **defers the classification and
redaction policy to here** — it implements; this skill decides what is PII. `truestack-mcp-integration`
owns untrusted tool-output; the PreToolUse hook governs agent *actions* (a different layer).
`truestack-backend-development` implements the deletion/consent APIs (and `truestack-database-migrations`
authors the purge/erasure DDL + bounded backfill) but `truestack-api-design` owns their contract;
`truestack-architecture-planning` does system design.

## 1. Make the PII inventory the source of truth — derive it from the schema
A spreadsheet drifts from the DB the day it's written — regulators' top recurring failures
are *no internal procedures* and *unclear retention periods* (`references/regimes.md`). Tag
every personal-data column — via column comments or a `data_classification` registry the code
reads — with `{data class, lawful basis, purpose, retention clock, deletion method}`. An
untagged column holding personal data is a finding.

## 2. Minimize — the cheapest field to protect is the one you never collected
Collect only what a stated purpose needs; don't keep "just in case" (CPRA caps retention,
HIPAA expects the minimum necessary). Every field you add is inventory, retention, deletion,
and breach surface — justify it against a purpose or drop it.

## 3. Retention = a per-record clock + a scheduled purge, never ad-hoc DELETEs
Each record carries a computed `delete_after` derived from **its purpose** — per purpose, not
the longest window across all activities (a flagged regulator mistake). A daily, **idempotent**
purge job hard-deletes expired rows and **cascades into every copy** — child tables, caches,
search indexes, exports, denormalized views — or the PII left behind is still retained
personal data.

## 4. Right-to-erasure: hard-delete live, suppress backups
Delete from live systems immediately. You can't surgically edit immutable backups, so log the
subject in an **append-only suppression/erasure list** and **re-apply it on every restore** —
an erased subject must never silently resurrect. Backups may persist until overwritten but
must be put "beyond use". A **refusal** under an erasure exception (GDPR Art. 17(3)) needs a
written case-by-case justification (`references/regimes.md`).

## 5. Pseudonymization is NOT anonymization and NOT erasure
Pseudonymized data is **still personal data**; only irreversible anonymization exits GDPR
scope. Treat reversible tokenization/masking as a **security control**, never a way to dodge
a deletion request, and keep the re-identification key in a **separate keystore** from the
pseudonymized data — co-located, it's worthless.

## 6. Encrypt PII at rest with envelope encryption; treat key destruction as deletion
AES-256(-GCM) is the standard at-rest choice; HIPAA's proposed Security Rule update makes
encryption-at-rest required, not "addressable" — verify current status (`references/regimes.md`).
On one box the hard part is keys: never store the data key beside the ciphertext or in the
same DB. **Per-tenant / per-subject data keys** enable **crypto-shredding** — destroy one key
to render data unrecoverable, the only practical "erase" for immutable backups.

## 7. Log every ACCESS to personal data — reads included — tamper-evident and off-box
Append-only audit log capturing **who / what / when / which record / why**, for reads as well
as writes (forensic-reconstruction grade). Ship it **off-box** or to a store the app user
can't rewrite — a server compromise must not erase the evidence; your access log *is* your
breach-scoping tool. Access to the audit log is itself logged.

## 8. Keep PII out of telemetry by contract — own the classification here
Define the policy `truestack-observability` enforces: **deny-by-default** — structured fields only,
never free-text blobs; **no PII in URLs, log messages, exception payloads, or trace
attributes**. Maintain the **allowlist of safe telemetry fields** here — most leaks ride in
stack traces, query logs, and error-report request bodies. This skill defines what's PII;
`truestack-observability` does the scrubbing.

## 9. Lawful basis and consent are first-class, queryable state — with proof and withdrawal
Don't bury consent in a boolean. Store `{purpose, basis, notice/policy version shown,
timestamp, source}` so you can **prove** it, and withdrawing consent triggers the **same
purge pipeline** as erasure. CCPA/CPRA is opt-**out** (sale/share + sensitive-data limits)
and the **Global Privacy Control** signal must be honored — divergences in `references/regimes.md`.

## 10. Build the 72-hour breach machinery before you need it
A written runbook: a **named decision-maker**, a severity method that makes the notify /
no-notify call defensible, and **pre-drafted notification templates** — deadlines and
thresholds in `references/regimes.md`. Teams without one burn the first day on "who owns
this?". If your audit/access logs are gone, you must assume worst-case scope.

## 11. Right-size to the strictest regime that actually applies — and prove deletion ran
Don't bolt on HIPAA with no ePHI; don't assume GDPR covers CCPA. Anchor the security baseline
to a recognized standard (ISO/IEC 27001, NIST CSF). And **attest deletion completed** — a
deletion receipt / log entry, not "we ran a job". "We ran a job" is not evidence.

## Honest exit
This skill produces engineering guidance, **not legal advice** — lawful-basis determinations,
Art. 17(3) refusals, and breach-notification calls need qualified counsel or a DPO; say so
when one is in play. State which regimes you confirmed apply, which controls exist vs. are
missing, and which compliance claims you grounded vs. couldn't verify — never assert
"compliant" off an unexercised policy (honesty contract). A defensible "GDPR erasure path works; CCPA GPC
handling is still a gap" beats a false all-green. Update project memory when a data class,
retention rule, or basis changes; then hand off to **truestack-quality-control** before "done".

## Explain it simply
Say what each rule *protects* in one plain line — "retention is a clock, not a cleanup;
crypto-shredding deletes the key so the data can't be read; pseudonymized still means
personal". Show the regime differences (GDPR vs. CCPA vs. HIPAA) and the field tags as a
small list or table, not prose. After defining a policy, state in one line what is now
provable that wasn't before.
