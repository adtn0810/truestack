---
name: truestack-data-privacy
description: Owns the data-privacy and compliance policy for a self-hosted app — PII
  inventory / data classification / mapping, data minimization, retention and deletion (GDPR
  right-to-erasure, scheduled purge), lawful basis / consent, pseudonymization,
  encryption-at-rest, access / audit logging of personal data, and 72-hour breach readiness.
  Use whenever the request mentions "privacy policy", "GDPR", "CCPA / CPRA", "HIPAA / PHI /
  ePHI", "right to be forgotten / erasure", "delete my data", "DSAR", "PII / personal data",
  "data inventory / classification / mapping", "retention / scheduled purge / auto-delete old
  data", "lawful basis / consent / opt-out / Global Privacy Control", "pseudonymization /
  anonymization / de-identification", "encryption at rest / crypto-shredding", "audit / access
  log / who accessed this data", "breach notification / 72 hours", "define what counts as
  PII in logs / telemetry", "suppression list / delete from backups", or "is this compliant /
  store sensitive data".
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
(EDPB/ICO, the regulation text, NIST, HHS) before asserting it. Defining a retention policy,
a deletion pipeline, or crypto-shredding is **consequential, often irreversible** work —
route the design through `truestack-architecture-planning`'s approval gate before building, and
remember the PreToolUse gate in `hooks/` makes a hard-delete / purge / key-destruction a
human-yes *before* it runs, even if settings would allow it. See `hooks/README.md`.

**Where this skill sits:** it owns the privacy *policy and discipline*, not the mechanics of
every neighbor. `truestack-quality-control` runs the one-shot SAFETY pass on a change and
`truestack-application-security` owns the security *design*; this skill owns the data-handling *rules*
they enforce. `truestack-observability` redacts PII in telemetry but **defers the classification and
redaction policy to here** — it implements; this skill decides what is PII. `truestack-mcp-integration`
owns untrusted tool-output; the PreToolUse hook governs agent *actions* (a different layer).
`truestack-ci-and-delivery` runs the dependency scan in CI but `truestack-dependency-management` owns the dep
lifecycle; `truestack-backend-development` implements the deletion/consent APIs (and `truestack-database-migrations`
authors the purge/erasure DDL + bounded backfill) but `truestack-api-design` owns their contract;
`truestack-architecture-planning` does system design.

## 1. Make the PII inventory the source of truth — derive it from the schema
A spreadsheet drifts from the DB the day it's written; the EDPB's coordinated erasure
enforcement work has repeatedly named *lack of internal procedures* and *difficulty
determining retention periods* as top recurring failures (verify the current report before
citing it). On one server, **derive the inventory from the schema** so it cannot lie:
tag every personal-data field at the column level — via column comments or a
`data_classification` registry the code reads — with `{data class, lawful basis, purpose,
retention clock, deletion method}`. An untagged column holding personal data is a finding.

## 2. Minimize — the cheapest field to protect is the one you never collected
Collect only what a stated purpose needs; don't keep "just in case". CPRA imposes a hard
data-minimization retention cap; HIPAA expects the minimum necessary. Every field you add is
inventory, retention, deletion, and breach surface — justify it against a purpose or drop it.

## 3. Retention = a per-record clock + a scheduled purge, never ad-hoc DELETEs
Each record carries a computed `delete_after` derived from **its purpose** (assess
per-purpose — the EDPB flagged applying "the longest retention timeframe across all
activities" as a top mistake). A daily, **idempotent** purge job hard-deletes expired rows
and **cascades into every copy**: child tables, caches, search indexes, exports, denormalized
views. Most teams delete the row and leave PII in the derived copies — that is still
retained personal data.

## 4. Right-to-erasure: hard-delete live, suppress backups
On a deletion / DSAR-erasure request, delete from live systems immediately, then solve the
backup conflict the way most teams miss: you cannot surgically edit immutable backups, so log
the subject in an **append-only suppression/erasure list** and **re-apply it on every
restore** before the data is usable — so an erased subject can't silently resurrect. Backups
may persist until overwritten but must be put "beyond use"; document the rotation window to
the subject. When you **refuse** erasure under an Art. 17(3) exception, write a case-by-case
justification (an EDPB coordinated-enforcement expectation).

## 5. Pseudonymization is NOT anonymization and NOT erasure
Pseudonymized data is **still personal data** (GDPR Art. 4(5) / Recital 26); only irreversible
anonymization exits GDPR scope. EDPB enforcement reviews call out controllers "substituting
pseudonymization or partial masking for true anonymization" — don't. Treat reversible
tokenization/masking as a **security control**, never as a way to dodge a deletion request,
and keep the re-identification key in a **separate keystore** from the pseudonymized data —
co-located, it's worthless.

## 6. Encrypt PII at rest with envelope encryption; treat key destruction as deletion
AES-256 is the 2026 reference; the HIPAA Security Rule NPRM makes encryption-at-rest
**required** (removing the old "addressable" escape). On one box the hard part is keys: never
store the data key beside the ciphertext or in the same DB. **Per-tenant / per-subject data
keys** let you render data unrecoverable by destroying one key — **crypto-shredding** — the
only practical way to "erase" from immutable backups.

## 7. Log every ACCESS to personal data — reads included — tamper-evident and off-box
Append-only audit log capturing **who / what / when / which record / why**, for reads as well
as writes (NIST SP 800-92r1 + the HIPAA NPRM expect forensic-reconstruction-grade logs).
Single-server pitfall: ship the audit log **off-box** or to a store the app user can't rewrite,
so a server compromise can't erase the evidence — your access log *is* your breach-scoping
tool. Access to the audit log must itself be logged.

## 8. Keep PII out of telemetry by contract — own the classification here
Define the policy `truestack-observability` enforces: **deny-by-default** — structured fields only,
never free-text blobs; **no PII in URLs, log messages, exception payloads, or trace
attributes**. Maintain the **allowlist of safe telemetry fields** here so redaction is a
policy, not a guess. Most leaks ride in stack traces, query logs, and error-report request
bodies. This skill defines what's PII; `truestack-observability` does the scrubbing.

## 9. Lawful basis and consent are first-class, queryable state — with proof and withdrawal
Don't bury consent in a boolean. Store `{purpose, basis, notice/policy version shown,
timestamp, source}` so you can **prove** it, and so withdrawing consent (GDPR Art. 7(3))
triggers the **same purge pipeline** as erasure. CCPA/CPRA differs: it's opt-**out** of
sale/share, plus "Limit the Use of My Sensitive Personal Information", and you must honor the
**Global Privacy Control** signal — a long-standing CPRA requirement, not a new obligation
(verify the current reg text rather than dating it from memory).

## 10. Build the 72-hour breach machinery before you need it
A written runbook with a **named decision-maker**, a severity method (the ENISA methodology
makes the notify/no-notify call defensible), and **pre-drafted notification templates**. GDPR
Art. 33 = notify the authority within 72h of *awareness* (phased reporting allowed); Art. 34
= notify individuals on "high risk". Teams without a runbook burn the first day on "who owns
this?". If your audit/access logs are gone, you must assume worst-case scope.

## 11. Right-size to the strictest regime that actually applies — and prove deletion ran
Don't bolt on HIPAA with no ePHI; don't assume GDPR covers CCPA (they diverge: opt-out, GPC,
sale/share, SPI). Anchor the security baseline to a recognized standard (ISO/IEC 27001, NIST
CSF). And **attest deletion completed** — a deletion receipt / log entry, not "we ran a job".
"We ran a job" is not evidence.

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
