---
name: truestack-dependency-management
description: Own the ongoing dependency and supply-chain lifecycle of a self-hosted app — pinning,
  cooldown-gated update automation, vulnerability triage, SBOMs, license policy, and supply-chain
  risk. Use when the request is to add or install a package (npm install, pip install, dotnet add
  package), update or bump or upgrade dependencies, set up Renovate / Dependabot / cooldown /
  minimumReleaseAge / stabilityDays, edit a lockfile (package-lock.json, yarn.lock, pnpm-lock,
  uv.lock, packages.lock.json), pin versions, run npm audit / pip-audit / osv-scanner / dotnet list
  package --vulnerable, handle a CVE / GHSA / security advisory, judge if a package is safe or
  whether to upgrade or wait, respond to a supply-chain attack / compromised package / hijacked
  maintainer, generate an SBOM / CycloneDX / SPDX / VEX, enforce license compliance / GPL / AGPL /
  copyleft, or address typosquatting / dependency confusion / scoped namespace / install scripts /
  postinstall / provenance / SLSA / trusted publishing / transitive deps.
---

# truestack-dependency-management

Own the *policy* and lifecycle of everything the app pulls from a registry — what gets added, how
fast it updates, how it's pinned and verified, when a CVE blocks a build, and what ships in the
SBOM. On a self-hosted single server there is no blast-radius isolation: a poisoned install script
runs with the box's full ambient credentials (deploy keys, cloud metadata, `.env`). Accuracy and
stability over chasing latest; honesty over a green scan you didn't verify.

Read project memory first — `CLAUDE.md` is auto-loaded (Principles + Boundaries); consult
`.ai/memory/` for the stack, package manager, lockfiles, registries, and any pin/policy decisions
already recorded. If none exists, run `truestack-project-memory`. Keep the **code↔memory tally** balanced:
adding a dependency, changing a pin, or setting a cooldown/scanner policy is a decision — record it
in the same change.

**Auto-research, don't recall.** Never assert a CVE, GHSA, severity, fix-version, license, or SLSA
detail from memory — version- and advisory-specific facts go stale. Ground every claim in
authoritative sources at decision time (OSV/GHSA, the registry, NIST SSDF SP 800-218 / C-SCRM SP
800-161, SPDX, slsa.dev). Adopting a new dependency or a cooldown override is a real ingestion
decision — route a consequential one through **truestack-architecture-planning**'s approval gate. (The enforced
**PreToolUse gate in `hooks/`** does *not* stop a plain `npm/pip install`; it only catches a
postinstall that pipes a remote payload into a shell — so the add-time cooldown + triage here is the
real control, not the hook.)

**Where this skill sits (seams to respect):** this skill owns the *ongoing dep policy and
lifecycle*. **`truestack-ci-and-delivery`** SHA-pins its *own* GitHub Actions and runs the scanner *step* in
CI — but the policy that step enforces (pin mode, cooldown, the fail-on bar, the SBOM artifact)
is *this* skill's. **`truestack-quality-control`** runs the one-shot SAFETY pass on a given change (including
"this bump introduces a known CVE"); **truestack-application-security** owns the security DESIGN/discipline;
this skill owns the standing dependency posture between changes. **`truestack-mcp-integration`** owns
untrusted *tool-output*; the PreToolUse hook governs agent *actions* — both are different layers.
**`truestack-observability`** redacts PII in telemetry; **truestack-data-privacy** owns the privacy policy — neither is
license/SBOM. **`truestack-backend-development`** justifies *why* a dep is needed at code time; this skill
governs *whether and how* it enters and stays.

## 1. Cooldown — the highest-leverage, most-skipped control
The dominant 2025–26 attack is a hijacked-maintainer release the registry pulls within ~4–5 hours
of report (Aug 2025 nx/chalk; 2026 axios). A maturity gate that quarantines fresh releases
neutralizes the whole class.
- Set Renovate **`minimumReleaseAge`** (formerly `stabilityDays`) or Dependabot **`cooldown`** to
  **3–7 days** (Mend's best-practices preset now defaults npm to 3 days, opt-out). Longer for major,
  shorter for patch.
- **Critical nuance most teams miss:** cooldown applies to *routine version bumps only* — **never**
  to security/CVE updates. Those flow immediately. You wait out poisoning without delaying real
  fixes. Wire the two paths separately.

## 2. Pin exactly *and* verify hashes — pinning alone is a false sense of security
A pinned version with no integrity check still resolves to whatever the registry serves. The real
control is the lockfile's cryptographic hash plus a **frozen, hash-verifying install**:
- **`npm ci`** (never `npm install` in build), **`pip install --require-hashes`** / a `uv.lock` or
  `pylock.toml`, **`dotnet restore --locked-mode`** with `packages.lock.json` committed.
- Commit lockfiles for apps. The deployed artifact is **built from the committed lockfile** — never
  a fresh floating resolve on the box. (arXiv "Pinning Is Futile": local pinning is necessary, not
  sufficient.)

## 3. Disable install scripts by default — that's where the payload runs
Nearly every npm supply-chain worm executes in `pre`/`post`-install lifecycle scripts at *install*
time, before any code is imported. On a single box with no isolation this is doubly dangerous.
- Run **`npm ci --ignore-scripts`** (or `npm config set ignore-scripts true`) and **allowlist** the
  handful of packages that genuinely need a build step. Most teams never touch this setting.

## 4. Scan polyglot-first, then ecosystem-deep — always include transitives
For a multi-stack box, ecosystem-native tools each see only their own world.
- **`osv-scanner`** is the backbone: it reads npm/PyPI/NuGet/Go/Maven lockfiles against the unified
  OSV database in one pass and is the only OSS tool with guided remediation. Run it in CI for
  breadth.
- Layer ecosystem depth: **`npm audit --audit-level=high`**, **`pip-audit`**,
  **`dotnet list package --vulnerable --include-transitive`**. The `--include-transitive` flag is
  mandatory — without it `dotnet` shows only *direct* deps, and most CVEs live transitively.

## 5. Triage by reachability + VEX, not by CVE count — fail on a real bar, not "zero CVEs"
Raw scanner output is mostly noise: it flags every matching CVE whether or not the vulnerable
function is on any code path.
- **Practical gate:** fail CI only on a finding that (a) is at/above your severity bar **AND** (b)
  has an available fix you're not on. Reachability-aware tools cut volume 70–90%; emitting/consuming
  **VEX** ("not affected" / "fixed") suppresses 80–90% of non-actionable findings.
- Record every deliberate accept/defer as **VEX** so the same dead CVE doesn't re-block every build.
- Run a **CVE SLA, not a zero-CVE fantasy**: e.g. Critical 48h, High 7d, with documented exceptions.

## 6. SBOM every build and diff it — a static one-off SBOM is compliance theater
Generate **CycloneDX** (OWASP, ECMA-424; security/VEX-native) or **SPDX** (ISO/IEC 5962:2021;
license-strong) — or both, conversion is cheap — **on every build from the resolved lockfile**,
attach it to the artifact, and **diff against the last release**. The diff *is* the control: an
unexpected new transitive dep or a maintainer/namespace change is your earliest hijack/confusion
signal. Meet the CISA/NTIA minimum elements (supplier, component, version, unique IDs, dependency
relationships, author, timestamp) plus the 2025 CISA draft additions (hash, license, tool,
generation context).

## 7. License policy as a hard CI gate — on transitives too
A permissive direct dep can pull a copyleft (GPL/AGPL) or no-license transitive that legally taints
distribution. Maintain an allow/deny list and **fail the build** on a disallowed *or unknown*
license anywhere in the resolved tree (SPDX's license fields are strongest here). **"Unknown /
UNLICENSED" must fail, not pass** — absence of a license is *more* restrictive than a permissive
one, not less.

## 8. Confusion vs typosquat — know which control solves which
SLSA L2+ provenance binds package+version to a canonical source/build, so a *dependency-confusion*
package fails verification — but SLSA **cannot** stop *typosquatting* (it can't read intent at the
moment a wrong name is typed). Pair them correctly:
- **Confusion** → reserve your org scope/namespace (`@org/*`); set a scoped registry with **no
  public fallback** for internal names.
- **Typosquat** → name-similarity heuristics / managed ingestion **at add-time** — no cryptographic
  check helps once the bad name is in the lockfile.
- Adopt **npm Trusted Publishing** (OIDC, no long-lived tokens) for anything you publish — but treat
  provenance as necessary-not-sufficient (the axios bypass).

## 9. Map controls to the standards so the policy is auditable, not vibes
Name the anchor for each control: lockfile + provenance verify → **PS.2 / PS.3** (read against
SLSA); vuln scan + triage SLA → **RV.1 / RV.2 / RV.3**; SBOM → **EO 14028 §4e + NTIA elements**;
component selection/ingestion → **PW.4 + SP 800-161 C-SCRM**. This turns "we scan" into a defensible
posture and shows what's missing.

## Honest exit
SHA-pinning Actions (which `truestack-ci-and-delivery` already does) closes the CI-runner chain — it does
**nothing** for the app's runtime npm/PyPI/NuGet tree, which is where the 2025–26 attacks landed.
Verify the real surface: lockfile-frozen installs, the scanner gate actually *failing* the build on
policy (not just "the scan runs"), cooldown on app dependency PRs, and SBOM emission for the
deployed artifact. Claim only what you verified firing; if a control can't be wired (no scanner, no
registry scope, an unreachable advisory feed), say so with a completion score rather than a false
green (honesty contract). Update `.ai/memory/` when a pin/policy/dep changes, then hand off to
**truestack-quality-control** before "done".

## Explain it simply
Say it in one plain line: "wait a few days before taking a new release so a hacked package can't
reach you, but take security fixes immediately; lock exact versions and check their fingerprints;
don't let packages run install scripts; scan for known holes and only block on the ones that are
both serious and fixable; and ship a list of everything inside, compared to last time." Cooldown
catches the hijack; the lockfile hash catches the swap; `--ignore-scripts` catches the payload; the
SBOM diff catches the surprise.