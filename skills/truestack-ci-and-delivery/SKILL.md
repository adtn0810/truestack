---
name: truestack-ci-and-delivery
description: Set up CI/CD and ship safely to a self-hosted server — pipeline stages (lint,
  type-check, test, build), SHA-pinned Actions, least-privilege workflow permissions and
  GitHub Actions secrets (runtime secrets/.env on the server belong to
  truestack-deploy-and-runtime), semver + CHANGELOG releases, and health-gated deploy with
  rollback. Use whenever the user says "set up CI", "set up CI/CD",
  "GitHub Actions workflow", "lint and tests on PR", "required status
  checks", "branch protection", "merge queue", "pin actions", "SHA pin", "workflow
  permissions", "GITHUB_TOKEN", "OIDC (keyless cloud/deploy credentials for
  workflows)", "cache dependencies", "Docker layer caching", "release automation",
  "semantic versioning", "bump the version", "generate changelog", "tag a release",
  "conventional commits", "the CI pipeline that ships a release to production",
  "health-gated deploy step", "rollback in CI", "smoke test before traffic", or
  "sequence a migration step in the deploy".
---

# truestack-ci-and-delivery

The path from a green PR to a running server, made boring on purpose. CI proves the change;
delivery ships the *exact* artifact CI proved and can undo it in seconds. One self-hosted
box, no autoscale — so the pipeline must be cheap, the deploy reversible, and the secrets
never leave the server. Accuracy and reversibility beat clever automation.

Read project memory first — `CLAUDE.md` is auto-loaded (Principles + Boundaries); consult
`.ai/memory/` for the existing CI provider, deploy target, image registry, branch rules, and
release tooling. Don't invent a workflow that contradicts what's recorded. If none exists,
run `truestack-project-memory`.

Deploys, migrations, and force-pushing tags are **irreversible / data-touching** — route the
*design* of a new pipeline or deploy strategy through **truestack-architecture-planning**'s approval
gate before wiring it, and know that the PreToolUse gate in `hooks/` will already stop a
destructive/deploy/migration command at run time (it forces a human yes). See `hooks/README.md`.

**Where this skill sits:** it owns the *pipeline* — encoding the checks as automated CI (it does
not replace the one-shot `truestack-quality-control` pass on the current change; it makes those checks run
on every PR), the release/versioning, and the deploy *step* that gates and triggers a release.
The on-box cutover mechanics (nginx reload, container swap, SIGTERM drain, the rollback runbook)
belong to `truestack-deploy-and-runtime`; authoring the migration DDL/backfill belongs to
`truestack-database-migrations`; a cron trigger *inside* a workflow lives here, but scheduling an
assistant/agent run is `truestack-task-scheduling`.

## 1. Pipeline stages — fast, required, in order
On every PR run the cheap gates first so failures surface in seconds: **lint → type-check →
unit tests → build**. Fail fast, run independent jobs in parallel, and keep the whole PR run
under a few minutes so the box (and the team) isn't waiting. Build the deployable artifact in
CI, not on the server — the server only *pulls* what CI proved.

## 2. Gate the branch on a small, stable set of checks
Protect the default branch with a **GitHub Ruleset** (layers cleanly, auditable) — not ad-hoc
branch toggles. Make **required** only the fast, deterministic checks (lint, type-check, unit,
build). Keep slow or flaky jobs (e2e, perf, optional scanners) **non-required / informational**
so a flake can't wedge every merge. Require checks to run on the PR's **merge result**, not a
stale branch ("require branches up to date"). A **merge queue** is usually overkill for a small
team — but *if* you enable one, the checks must also trigger on the `merge_group` event (and
third-party CI on the `gh-readonly-queue/<base>` prefix), or queued PRs merge with **no checks
actually running**. Hand the pre-merge depth (test review, six-axis review, safety) to
**truestack-quality-control** — these checks are the gate, QC is the judgment.

## 3. Supply chain — pin, then wait
- **SHA-pin every third-party action** to the full 40-char commit SHA, never `@v4` / `@main`. Tags are mutable: real compromises (tj-actions in 2025 among others) rewrote tags out from under pinned-by-tag users — auto-research a current example before citing one. Pin your **own reusable workflows** too.
- **Pinning is necessary but not sufficient.** New SHAs need a **7–14 day cooldown** before adoption — most supply-chain compromises are detected within days of publication, so the delay catches the bulk of them. This skill sets the **initial SHA pins** and wires the pipeline stage that enforces the policy; the ongoing bump-and-cooldown bot policy (Renovate/Dependabot config — the github-actions ecosystem included — plus app deps, CVEs, SBOMs) is `truestack-dependency-management`.

## 4. Least-privilege permissions & secrets
- Default `permissions: contents: read` at the **workflow** level, then grant the minimum extra scope **per job** — only the release job gets `contents: write`, only a PR-comment job gets `pull-requests: write`. The legacy read/write default means one compromised action can push to the repo.
- **Never** expose secrets to `pull_request_target` or to fork-triggered runs. Mask and minimize what CI ever sees.
- **OIDC is a cloud feature** (AWS/GCP/Azure/Vault) — it does **not** apply to a bare self-hosted box. The self-hosted equivalent: don't put the server's SSH key or root creds in CI. Give CI a **narrow dedicated deploy identity** (a deploy user that can only pull the image + run the deploy script, or a registry token scoped to one repo). Keep **app runtime secrets on the server** (env file / secrets manager), injected at container start — never baked into the image or echoed through Actions logs.

## 5. Caching — fast, but untrusted
Key dependency and Docker-layer caches on the **lockfile hash**, and write a dependency-first
Dockerfile (copy lockfile → install → *then* copy source) so only the code layer rebuilds.
But treat the cache as an **attack surface**: Actions cache is only branch-scoped server-side,
so a poisoned cache (e.g. via a Dependabot-bumped hash) can be restored into a trusted run.
Never cache build secrets, and segregate PR caches from main.

## 6. Release — build once, version automatically
- **Build the artifact once; deploy that exact immutable image everywhere.** Reference it by content digest (`sha256:…`) or an immutable tag — **never `:latest`**. Tag images with **both** the git SHA and the semver. This is what makes rollback an image-swap, not a rebuild, and guarantees the tested thing is the shipped thing.
- **Automate semver + CHANGELOG from Conventional Commits** (release-please / semantic-release): merging to main computes the bump, generates the CHANGELOG, creates the git tag and Release — no human version-bump errors, a traceable tag per deploy. Keep the release job least-privileged and **separate from the build job**.

## 7. Migrations — decouple from the deploy, get the order right
This is the #1 deploy-incident cause. Use **expand/contract** and make every migration
backward-compatible with the *currently running* app:
- **Adding** a column → migrate **first**, then deploy code that uses it.
- **Removing** a column → deploy code that stops using it **first**, then drop it later in a separate contract migration.
- On Postgres use `CREATE INDEX CONCURRENTLY` and backfill large tables in **batches** — never one giant locking statement on the single box.

This skill owns *ordering* the migration in the pipeline (migrate-first vs code-first relative to
the cutover); **authoring** it — reversible up/down, idempotent batched backfills, lock/timeout
discipline — is `truestack-database-migrations`.

## 8. Deploy — health-gated, rollback in seconds
The pipeline's deploy step ships the exact immutable digest and owns **go/no-go**: a health
check + smoke test against the new container **before any traffic switches**, and automatic
revert to the last known-good digest when the post-switch check fails. The cutover sequence
itself — colors, digest recording, proxy flip, `nginx -t`, drain windows, SIGTERM/readiness
mechanics — is **`truestack-deploy-and-runtime`**'s runbook (its blue/green atomic-swap and
idempotent-runbook sections): execute that, don't re-derive it here — a second copy of a
runbook only exists to drift.

## 9. Close the loop
When the pipeline changes a recorded command, deploy step, branch rule, or release process,
**update `.ai/memory/`** in the same change so the code↔memory tally balances. Before calling
delivery "done", hand to **truestack-quality-control** (the workflow YAML and deploy script are code —
they get the same security and intent pass). Report against the goal honestly: if a check is
flaky, a secret can't be scoped as tightly as ideal, or rollback isn't yet proven, say so with
a completion score rather than declaring a done you can't prove (honesty contract).

## Explain it simply
Say it in one plain line: "CI checks your code on every PR; release tags a version; deploy
swaps in the new container only if it's healthy, and flips back instantly if it isn't."