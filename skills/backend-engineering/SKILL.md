---
name: backend-engineering
description: Use when implementing or refactoring server logic, endpoints, jobs, persistence, integrations, or backend concurrency. Contract and schema changes also use database-api-evolution.
---

# Backend engineering

Implement agreed behavior using the application's existing conventions. Confirm actual dependencies, framework versions, interfaces, and configuration before relying on an API.

Trace the request or job from entry point through authorization, validation, domain logic, data access, and its caller. Keep transport models separate from persisted entities when direct binding could expose protected fields. Enforce ownership on the server; an unguessable identifier is not authorization. Preserve established errors, cancellation, timeouts, and logging conventions.

For writes, identify the transaction boundary and the invariant that must hold if processing fails halfway. Use database constraints where appropriate, and make retryable side effects idempotent with a stable operation identity. Consider duplicate delivery, ordering, concurrent requests, and partial external failures for the paths affected by the change. Do not add distributed coordination to a problem handled by an existing transaction or constraint.

Bound request sizes, result sets, concurrency, queues, connection use, and caches according to the workload. Paginate or stream large data. Avoid N+1 queries and hidden blocking in asynchronous paths. For an actual performance problem, use systematic-debugging's measured performance mode before choosing an optimization. Define cache ownership and invalidation before caching mutable data.

Preserve precision and units in monetary or measured values using the domain's representation and explicit rounding rules. A requested correctness fix may intentionally change wrong output: define the expected difference and reconcile it. Apply project-specific financial, tenant, date-axis, replay, and strict-table requirements where they exist; do not impose output neutrality on every bug fix.

Implement one coherent change at a time. Select verification with test-verify: test load-bearing behavior before implementation when useful, then exercise meaningful happy, invalid, unauthorized, conflict, retry, or failure cases according to the affected risk. Check the actual component boundary when separately passing units cannot establish integration.

Finish with the observable behavior, relevant check results, and any unverified runtime effect. Keep credentials and personal data out of diagnostics. Respect existing authorization for external actions; prepare a concrete change and local evidence before requesting any additional production-write approval.
