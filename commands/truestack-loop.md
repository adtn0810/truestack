---
description: Iterate to the goal — keep building/fixing and re-running truestack-quality-control until the acceptance criteria pass (or report an honest completion score if blocked).
argument-hint: [feature or bug to drive to done]
---
Drive the work to a proven-done state, don't stop at "it compiles".

Target: $ARGUMENTS

Use the **build loop** (truestack-backend-development) for a feature or the **verify-or-loop** (truestack-root-cause-debugging) for a
bug: implement/fix → run **truestack-quality-control** → if a criterion or the repro still fails, identify exactly
what and why, fix, and re-run. Loop until all acceptance criteria pass and (for a bug) the
original reproduction no longer triggers. If genuinely blocked, stop and report an honest score
(criteria met / total + what blocks each unmet one) rather than looping forever or claiming done.
