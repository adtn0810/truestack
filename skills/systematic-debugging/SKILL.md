---
name: systematic-debugging
description: Use when diagnosing broken, incorrect, flaky, slow, or resource-heavy behavior, or checking a claimed root cause. Require causal evidence before confirmation; skip routine implementation without a defect.
---

# Systematic debugging

Find the failing mechanism before changing it. Preserve the smallest useful reproduction, the observed result, the expected result, and the relevant environment or version. If a production issue cannot reproduce locally, collect bounded evidence from the affected path using existing authorized read access.

Trace the failing input through the code and component boundaries. Check recent changes, logs, exceptions, configuration, dependency versions, and stored state only as the evidence requires. Distinguish an observed fact from an explanation. An error message identifies where failure surfaced; it does not automatically identify its cause.

Form a testable hypothesis and choose a probe that can separate it from plausible alternatives. Change one meaningful variable at a time. Prefer inspecting an invariant, reproducing a boundary case, or tracing a request over speculative edits. Keep temporary diagnostics narrow, redact sensitive data, and remove them when no longer useful.

## Evidence before a diagnosis

Use explicit certainty labels: **observed symptom**, **suspected cause**, or **confirmed cause for a stated scope**. Do not announce “root cause found” merely because code looks wrong, a log correlates with the failure, or another agent sounds confident. A real defect in an unused path can be unrelated to the reported incident.

Before confirming, establish the reported failure, connect the proposed mechanism to the executed path and relevant input/state, and obtain a discriminating result. A controlled failure-before/fix-after reproduction with a matching trace or code path is strong evidence; so is decisive captured execution evidence when reproduction is unavailable. A passing suite, a workaround, or disappearance after several simultaneous changes does not by itself establish causality. If the evidence does not distinguish plausible causes, retain the hypothesis label and continue investigating within authorization.

Provide the proof with the diagnosis, without waiting to be asked: the observed failure, source/trace location, and probe or test result that supports the causal link. State the scope proved. A local reproducer does not automatically establish production attribution; that needs matching incident conditions/version evidence. Do not perform unauthorized production writes to obtain proof.

Preserve the certainty label and raw evidence in handoffs. If later evidence disproves a diagnosis, retract it explicitly and update the explanation; do not replace one unsupported confident claim with another. These rules gate claims, not progress: investigation and clearly labelled mitigation can continue while the cause is uncertain.

After two failed fixes for the same symptom, stop patching and revisit the model with fresh evidence or an independent investigation. Changing the patch does not reset the count. Do not repeat an identical unsuccessful attempt, mask an exception, loosen an assertion, or add arbitrary sleeps merely to make the signal disappear.

## Performance mode

Define the metric, workload, data size, concurrency, and environment that represent the complaint. Capture a comparable baseline. Use a profiler, trace, query plan, allocation/connection evidence, or browser timing to locate the actual bottleneck. Check query count and cardinality before adding indexes or caches. Apply one justified change, then remeasure under comparable conditions and confirm correctness. Report absolute measurements and conditions; separate measured improvement from expected production benefit.

## Fix and close

Choose the smallest fix that removes the cause while preserving unrelated behavior. Reproduce the original failure after the fix and add a meaningful regression guard when it protects a likely recurrence. Use test-verify for repository checks and database-api-evolution when the remedy changes persisted state or an API contract.

Conclude with the cause, evidence, changed behavior, and verification. If the cause remains uncertain, label the hypothesis and the next discriminating check. A workaround may be useful, but report its limits and remaining investigation honestly.
