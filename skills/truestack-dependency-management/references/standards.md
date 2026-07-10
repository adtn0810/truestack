# Standards mapping — audit anchors for the dependency policy

Load on demand when writing or defending the policy for an audit. Standards revisions and draft
statuses drift — **auto-research the current revision** (NIST SSDF SP 800-218, SP 800-161, CISA
SBOM guidance) before citing any of this in an audit artifact.

## Control → anchor mapping (NIST SSDF SP 800-218 unless noted)

| Control | Anchor |
|---|---|
| Lockfile + provenance verify | **PS.2 / PS.3** — read against SLSA (slsa.dev) |
| Vuln scan + triage SLA | **RV.1 / RV.2 / RV.3** |
| SBOM on every build | **EO 14028 §4e** + NTIA minimum elements |
| Component selection / ingestion | **PW.4** + **SP 800-161 C-SCRM** |

## SBOM minimum elements

- **CISA/NTIA minimum**: supplier, component name, version, unique IDs, dependency relationships,
  author, timestamp.
- **2025 CISA draft additions**: hash, license, tool, generation context — a *draft* when captured;
  verify its current status before treating the additions as required.
