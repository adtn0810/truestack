---
name: test-verify
description: Use when selecting or performing verification, adding meaningful regression tests, evaluating test evidence, or establishing whether a change meets its acceptance criteria.
---

# Test and verify

Choose checks that can reveal the material failure modes of the change. Read the repository's own commands in project instructions, package scripts, build files, test configuration, or CI. Identify the installed test framework and runner before choosing syntax. Do not invent commands or silently install a new testing stack; report when no suitable command exists.

Map each important acceptance criterion to observable evidence. Select a targeted test, type check, lint, build, integration probe, browser walkthrough, or runtime check based on what it can prove. A compile proves compatibility with the compiler; it does not prove authorization, a migration's data preservation, or a user's complete journey.

Use test-first work for new or corrected load-bearing logic such as calculations, authorization, state transitions, concurrency, parsing, or retry behavior when practical. Reproduce a bug with a failing test before the fix when a stable seam exists. Do not require new tests for reversible wording or styling edits, assert private implementation details, or discard existing implementation merely because test-first order was missed.

Write assertions against caller-visible outcomes and invariants. Use representative valid, invalid, boundary, ownership, duplicate, or failure cases according to the risk. Prefer deterministic inputs and existing injection seams. Add the smallest justified seam if uncontrolled time or I/O prevents meaningful verification; avoid broad production refactors solely for test convenience. Check integration boundaries when separately passing units cannot establish the contract.

Run the necessary repository checks and inspect their actual results. Separate pre-existing failures, environment blockers, skipped checks, and new regressions. Fix defects without weakening checks. After the relevant checks pass, repeat or broaden them only for a new change, failure, or unresolved concern. A full-suite ritual is not evidence of proportional judgment.

Implementation self-checks are useful. For consequential changes, or when project/user instructions require independent acceptance, give a fresh reviewer the scope, expected behavior, and raw artifacts; do not present an author's self-check as independent verification.

Report exact commands, meaningful results, and limits. Distinguish static inspection, executable tests, scenario reasoning, and observed runtime behavior. Claim completion only for the acceptance criteria supported by evidence; do not imply a deployment, live success, or coverage level from local checks alone.
