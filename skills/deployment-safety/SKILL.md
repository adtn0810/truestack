---
name: deployment-safety
description: Prepare and execute deployments with user-confirmed server identity and destination, a usable rollback, health checks, and bounded release-backup retention. Applies to deployment and redeployment, not ordinary local edits or read-only server diagnosis.
---

# Deployment safety

Every deployment needs a concrete target confirmation and recoverable release. Prepare the work and authorized read-only checks first; request confirmation immediately before live mutation. Preserve existing permissions and project deployment procedures.

## Prepare a reviewable deployment

Use project instructions and read-only connection evidence to establish the actual destination. Do not infer it from an SSH alias alone. Check hostname/server identity, connected IP, environment, resolved absolute deployment path, and affected service. Explain any proxy, container, cluster, or load-balancer distinction; list every affected host and path for a multi-target deployment. If identity cannot be established, resolve it before deployment.

Show the user a compact deployment card:

- **Target:** server name, verified IP/address, environment, absolute server path, and affected service(s).
- **Change:** exact revision/artifact, deployment command or procedure, checks already run, and expected interruption.
- **Rollback:** previous known-good release or first-deploy recovery state, exact recovery command/procedure, data/config implications, and health checks.
- **Storage:** current release plus retained rollback points, proposed count/byte limit, peak space needed, and exact managed cleanup scope.

Ask the user to confirm this deployment's target and plan. Use a decision tool only when it is available and permitted for approvals, with clear choices to deploy, change the target, or cancel; otherwise ask one concise plain-text confirmation question. Wait for explicit confirmation. A generic earlier “deploy it” is not confirmation of an undisclosed target. If this exact target and plan were already presented and confirmed for this operation, continue without asking again. Changed targets, artifacts, or material recovery/cleanup scope require renewed confirmation. Authorization for one deployment does not silently authorize the next.

## Make rollback usable

Before changing the running release, preserve and identify the recoverable state. Record artifact identity/checksum and relevant config references; protect secrets. Verify required files/artifacts are present and readable and that the recovery procedure can restore service. Use an isolated restore rehearsal where practical; distinguish a rehearsed rollback from an inspected but unexecuted plan. Do not label either as production-tested without evidence.

Application files alone cannot undo database writes, destructive migrations, or external side effects. Establish compatible migrations, data recovery and consistency steps, and any loss/downtime implications before approval. If a usable recovery path cannot be prepared, block that deployment and explain the gap; do not claim rollback is available.

Include rollback triggers and authorization in the presented plan. After deployment, check the running version and agreed health/behavior criteria. If they fail, follow the approved rollback and verify recovery; otherwise obtain missing authorization before a live recovery action. Report actual deployment or rollback results and remaining uncertainty.

## Bound backup storage

Use the project's documented retention policy if it provides bounded storage and protects recovery. Otherwise propose **the current release plus the two most recent verified healthy rollback releases**, with a concrete byte ceiling based on measured artifact sizes and available capacity. This is a proposed default, not permission to delete existing files. Include cleanup in the deployment plan's authorization.

Preflight enough free space for the new artifact, temporary files, and recovery state at peak usage. If it will not fit, stop before mutation and resolve capacity or a reviewed cleanup plan. Never prune the only usable rollback to make room.

Keep release artifacts separate from uploads, databases, logs, and other persistent data. Exclude the backup directory from its own snapshots to prevent recursive backup growth. After health checks pass, remove only explicitly identified obsolete artifacts inside the resolved deployment-managed backup/release directory, within the approved retention count and byte ceiling. Protect the active release, pinned releases, and required recovery dependencies. Do not delete unrelated backups, follow links outside that directory, or run broad age-based cleanup. If protected files prevent the limit being met, report the capacity conflict instead of silently exceeding it or deleting them.

Remove failed candidate artifacts only after a healthy running/recovered state is verified and within the approved cleanup scope. Record retained release IDs, sizes, available space, and rollback command after cleanup. A rollback point remains usable only if its dependencies remain available.
