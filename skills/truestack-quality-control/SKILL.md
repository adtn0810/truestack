---
name: truestack-quality-control
description: Run a deep truestack-quality-control sweep after ANY code change before the work is
  considered done. Use automatically after implementing a feature or fixing a bug, and
  whenever the user asks to "check", "QC", "verify", or "make sure it's solid". Runs
  tests, type-check and lint, a multi-axis review, a load/perf check, a safety pass, and
  an intent check. Invoked by truestack-backend-development and truestack-root-cause-debugging; also runs on request.
---

# truestack-quality-control

The gate between "I wrote it" and "it's done". Run every layer; a partial pass is a fail.
First, read the intent (task, acceptance criteria, plan) and project memory (`CLAUDE.md` +
`.ai/memory/`) so you're judging against the real goal, not a guess. Tooling is
per-language — **see `references/tooling.md`** for the test / type-check / lint / perf /
security tools for Node, .NET, and Python.

## 1. Tests (review tests first)
Detect the framework (jest/vitest, pytest, `go test`) and run the suite. Before trusting
them, check the tests themselves: do they exercise behavior through public interfaces, and
would they actually fail if the feature regressed? If changed code has no tests, write them
— happy path plus the edge cases the change touches. For data-accuracy-critical logic, add
**property-based or invariant tests** (properties that must hold across all inputs), not
just example cases — "all tests passed" is not the same as "matches intent". Any test
skipped, weakened, or deleted is a finding.

## 2. Type-check + lint
Run the type checker (tsc/mypy/`go vet`) and linter (eslint/ruff). Fix violations at the
source — **never suppress** a warning to make it pass; a suppression is a deferred bug.

## 3. Review across six axes
Read the diff and classify every finding by severity (**Critical** = security / data-loss /
broken behavior · **Required** = must fix before done · **Optional** · **Nit**):
1. **Correctness** — requirements, edge cases, errors, concurrency, state.
2. **Maintainability** — clear names, simple control flow, no dead code, no one-use abstractions; do a **simplify pass** (can duplicated logic merge? can a layer go without losing clarity?).
3. **Architecture** — ownership, small interfaces, validation at boundaries, dependency direction.
4. **Security** — OWASP Top 10: injection, broken auth/access control, secrets, untrusted input.
5. **Performance** — unbounded work, N+1, hot paths.
6. **Tests** — evidence matches risk.
Lead with high-impact findings; one real issue beats a long list of nits.

## 4. Load / performance (self-hosted focus)
The box has fixed resources — verify the change can't overload it: scan for N+1, unbounded
result sets, missing pagination, unbounded memory growth, missing timeouts/pooling. For hot
paths, sanity-check under representative load — measure, don't guess.

## 5. Safety pass
No secrets or sensitive data added · untrusted input validated before use · permission /
trust boundaries preserved or explicitly reviewed · risky changes have a rollback path. For
changes touching auth, input, data access, or external calls, run the OWASP-aligned checklist
— **see `references/security.md`**. For a dependency the change adds or bumps, **auto-research
current advisories** (CVEs / version-specific vulns) from authoritative sources — don't clear it from recall.

## 6. Intent + memory reconciliation (matches the plan? matches the code?)
Map each acceptance criterion to concrete evidence — a passing test, a runtime check, or a
verified behavior. A change that's clean but doesn't satisfy a criterion is **not done**.
Flag any drift between what was built and what was specified.

**Keep the tally.** Also reconcile committed memory with the code: if the change altered a command,
dependency, convention, architecture decision, or boundary that `.ai/memory/` or `CLAUDE.md` records,
that memory must be updated in the *same* change. Unreconciled memory-vs-code drift is a finding — the
tally must balance before "done" (it's `truestack-project-memory`'s contract; QC is where it's enforced).

## On failure
Fix it — or hand back to **truestack-root-cause-debugging** if it's a real defect — then **re-run the entire
sweep** from layer 1. A fix can break something upstream; don't re-check only the part that
failed.

## Explain it simply
Lead with a one-line plain-English verdict (done / not done / needs evidence). Present
findings as the severity list or a table, not prose paragraphs. Show command → result in a
small table so the evidence is scannable at a glance.

## Verdict + report
```
## QC Report
- Tests:        pass/fail — notes
- Types + Lint: pass/fail — notes
- Review:       findings by severity
- Load / perf:  pass/fail — notes
- Safety:       pass/fail — notes
- Intent:       criteria met? — drift noted
- Memory tally: reconciled? — memory-vs-code drift noted
Commands run:   <command → result>
Remaining risk: ...
Verdict: DONE / NOT DONE / NEEDS EVIDENCE
```
"Needs evidence" = the code looks fine but verification is insufficient to call it done.
Report only what you actually ran or checked — never write "tests pass" without running them,
or "done" without the evidence in hand.
