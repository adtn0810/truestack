# Regime citations — grounding for the rules in SKILL.md

Everything here drifts. **Re-verify against the primary source (EDPB/ICO, the regulation
text, NIST, HHS) before citing** — these entries say where to look, not what to assert
from recall.

## GDPR / EDPB

- **Erasure enforcement (EDPB coordinated enforcement)** — the coordinated right-to-erasure
  review names *lack of internal procedures* and *difficulty determining retention periods*
  as top recurring failures, and flags applying "the longest retention timeframe across all
  activities" as a top mistake — assess retention **per purpose**. Verify the current report
  before citing it.
- **Art. 17(3) refusals** — refusing erasure under an exception requires a written,
  case-by-case justification (a coordinated-enforcement expectation).
- **Backups** — data awaiting overwrite must be put "beyond use"; document the backup
  rotation window to the subject.
- **Art. 4(5) / Recital 26** — pseudonymized data is still personal data; only irreversible
  anonymization exits GDPR scope. EDPB reviews call out controllers "substituting
  pseudonymization or partial masking for true anonymization" — don't.
- **Art. 7(3)** — withdrawing consent must be as easy as giving it; withdrawal triggers the
  same purge pipeline as erasure.
- **Art. 33 / 34** — notify the supervisory authority within **72h of *awareness*** (phased
  reporting allowed); notify individuals on "high risk". The **ENISA severity methodology**
  makes the notify/no-notify call defensible.

## CCPA / CPRA

- **Opt-out, not consent** — opt-**out** of sale/share plus "Limit the Use of My Sensitive
  Personal Information"; the **Global Privacy Control** signal must be honored — a
  long-standing CPRA requirement, not a new obligation (verify the current reg text rather
  than dating it from memory).
- **Retention cap** — CPRA imposes a hard data-minimization retention cap: keep personal
  data no longer than the disclosed purpose requires.

## HIPAA

- **Security Rule NPRM** — proposes making encryption-at-rest **required**, removing the old
  "addressable" escape. It is a proposed rule — **verify its current status before asserting
  it as binding**.
- **Minimum necessary** — collection, use, and access limited to the minimum the purpose
  needs.
- **Audit logs** — NIST SP 800-92r1 + the HIPAA NPRM expect forensic-reconstruction-grade
  logs: who / what / when / which record, **reads included**.

## Cross-regime baselines

- **GDPR ≠ CCPA** — they diverge on opt-out vs. consent, GPC, sale/share, and sensitive
  personal information; compliance with one does not imply the other. HIPAA applies only
  where PHI/ePHI exists.
- Anchor the security baseline to **ISO/IEC 27001** or **NIST CSF**.
- **AES-256(-GCM)** is the standard at-rest choice per current NIST guidance.
