# Wiring a job spec to a real scheduler

Pick the first mechanism that exists on the host — verify it exists (run `--version` / list the
tool) before claiming it's wired. Every recipe runs the **self-contained run prompt** from the
job spec; keep Ask-first actions draft-only (the spec's Boundaries line) regardless of mechanism.

## 0. The harness's own scheduler (check first)
Some Claude Code environments expose native scheduling tools to the agent (e.g. cron-style
tools visible in the session's tool list). If present, they are the best option: the run fires
inside the harness with the user's own permission config. Discover by looking at the available
tools — don't assert from memory that they exist (they vary by surface and version).

## 1. System cron (Linux / macOS)
Store the run prompt in the repo so it's versioned, then:

```cron
# crontab -e   (06:00 daily, box timezone — pin it in the spec)
0 6 * * * cd /path/to/repo && claude -p "$(cat .ai/jobs/daily-check.prompt.md)" >> .ai/jobs/daily-check.log 2>&1
```

- `claude -p` is headless print mode; it uses the project's committed settings/permissions.
  Do **not** reach for permission-bypass flags to make a job "just work" unattended — an
  unattended run must operate within allowed tools, or produce a draft for human review.
- Log to a file (delivery evidence) and let the spec's failure policy decide alerting.

## 2. Windows Task Scheduler
```powershell
schtasks /Create /TN "truestack\daily-check" /SC DAILY /ST 06:00 `
  /TR "cmd /c cd /d C:\path\to\repo && claude -p ""$(Get-Content .ai\jobs\daily-check.prompt.md -Raw)"" >> .ai\jobs\daily-check.log 2>&1"
```
Simpler and more robust: point `/TR` at a small `.cmd` wrapper in the repo that reads the
prompt file and runs `claude -p` — avoids quoting bugs. Confirm with `schtasks /Query /TN ...`.

## 3. CI cron (GitHub Actions)
```yaml
on:
  schedule:
    - cron: "0 6 * * *"   # UTC — convert the spec's timezone
permissions:
  contents: read
jobs:
  scheduled-run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<full-40-char-SHA>   # SHA-pin (truestack-ci-and-delivery)
      - run: npm install -g @anthropic-ai/claude-code@<pinned-version>
      - run: claude -p "$(cat .ai/jobs/daily-check.prompt.md)"
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```
Notes: GH Actions cron is UTC and best-effort (runs can be delayed/skipped on busy periods);
the schedule lives on the default branch. Least-privilege permissions per
`truestack-ci-and-delivery`.

## Confirm-it-fired checklist
- State the first fire time (with timezone) back to the user.
- The job writes a delivery artifact (log line, file, message) every run — silence must be
  distinguishable from failure.
- Re-running is safe (idempotent; overlap-guarded if a run can outlast the interval).
