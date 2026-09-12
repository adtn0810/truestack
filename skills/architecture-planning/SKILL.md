---
name: architecture-planning
description: Use when new cross-module work, unclear system boundaries, or a costly architecture decision needs an implementation plan. Skip small changes with an obvious approach.
---

# Architecture planning

Make the material decisions that allow implementation to proceed. Match the depth of the plan to uncertainty, reversibility, and the number of affected components.

1. Read the repository instructions and relevant established patterns. Locate the entry points, callers, data owners, configuration, and existing verification commands. Build only the repository map needed for this task; do not read the whole tree by default.
2. State the user-visible outcome, scope, constraints, and acceptance criteria. Separate evidence from assumptions. Resolve routine choices from the code and user context. Ask only about missing information that would materially change the result; continue independent work while waiting.
3. Trace the proposed flow across UI, services, APIs, storage, and external dependencies as applicable. Define ownership, trust boundaries, failure behavior, retry/concurrency semantics, and resource limits where the change depends on them. Preserve the existing stack unless changing it is part of the request.
4. Compare alternatives only for a real tradeoff. Explain why the recommended approach fits the current workload and maintenance needs. Avoid adding services, abstractions, dependencies, or a migration merely to make the plan look complete.
5. Break the change into coherent, reviewable steps with affected files or modules and a check for each material outcome. Identify compatibility, rollout, recovery, and integration risks where applicable. Use database-api-evolution for a changing persisted-data or consumer contract; do not repeat its full workflow here.

Deliver a concise plan with assumptions, decisions, implementation order, and repository-specific verification. Record durable decisions in the project's existing location when useful; do not create a new memory system automatically.

Proceed to authorized implementation after the plan. A planning skill does not create a new approval gate. If the request is explicitly planning-only, stop at the reviewable plan. Use delegation for bounded work that can usefully run independently or for a required independent assessment; do not spawn an agent for every task.
