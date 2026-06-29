---
description: Run a maintainability simplify pass on the target — merge duplication, drop needless layers and dead code, clarify names — without changing behavior.
argument-hint: [file, module, or current changes]
---
Use **quality-control**'s maintainability axis as a focused **simplify pass**.

Target: $ARGUMENTS (default: the current changes)

Reduce complexity without changing behavior: merge duplicated logic, remove one-use
abstractions and dead code, flatten needless layers, and clarify names. Every simplification
must keep the tests green — run them before and after. Present the changes as a short
before/after list and confirm behavior is unchanged. Flag anything that *looks* removable but
carries non-obvious meaning instead of deleting it blind.
