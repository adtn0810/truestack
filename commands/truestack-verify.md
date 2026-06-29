---
description: Run a full truestack-quality-control quality sweep on the current changes — tests, types/lint, 6-axis review, load/perf, safety, and intent — and return a verdict.
argument-hint: [optional path or scope]
---
Use the **truestack-quality-control** skill to run a complete truestack-quality-control sweep.

Scope: $ARGUMENTS
If no scope is given, check all current uncommitted changes. Read the intent (plan / acceptance
criteria) and project memory first, run every layer, and end with the QC verdict (DONE / NOT
DONE / NEEDS EVIDENCE) and the evidence behind it. Report only what you actually ran.
