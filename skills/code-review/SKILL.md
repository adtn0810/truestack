---
name: code-review
description: Use for an explicit review of a defined diff, pull request, file, or code scope for actionable defects and regressions. Does not authorize an unsolicited rewrite or replace native delegated review routing.
---

# Code review

Review the requested scope with enough surrounding context to understand callers, invariants, and existing behavior. Read project review instructions and the actual diff before forming conclusions. If the host already provides a dedicated review agent or review workflow, preserve that routing; use this guidance within the assigned review rather than creating another review loop.

Look for consequential correctness, regression, security, data-integrity, compatibility, concurrency, failure-handling, or performance defects. Follow changed values across boundaries when a local expression looks correct but its caller uses different units, ownership, state, or error semantics. Consider invalid input, missing authorization, retries, partial failures, and competing requests where the change makes them relevant.

A finding needs a plausible failing scenario and evidence that the changed code causes or exposes it. State the trigger, the affected behavior, why it matters, and the smallest useful location. Confirm framework or language behavior against the actual version or authoritative documentation when uncertain. Avoid speculative failure claims and style preferences presented as bugs.

Inspect tests for whether assertions protect the intended behavior and whether the changed path is actually exercised. Missing tests are worth a finding when they leave a specific material risk unexplained; do not demand a test for every method or mirror implementation details. Run a focused reproduction or existing check when it can resolve uncertainty within scope. Preserve the distinction between reading a test and executing it.

Return findings first, ordered by severity. For each, give a concise title, location, trigger, impact, and evidence; include a suggested correction only when useful. Separate open questions and unverified assumptions from confirmed findings. If there are no actionable findings, say so plainly and identify material coverage limits. Do not manufacture issues to fill a quota.

Do not edit application code during a review unless fixes were requested. Do not broaden into unrelated cleanup, introduce dependencies, or commit/push as a side effect. When the user asks to fix findings, implement the agreed scope and use test-verify to establish the resulting behavior.
