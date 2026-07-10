---
name: truestack-task-scheduling
description: Set up work that runs automatically later or on a recurring cadence — a daily
  check, a weekly report, a periodic sync, a deferred run — instead of doing it once now.
  Use whenever the user says "every day", "each morning", "weekly", "nightly", "cron",
  "schedule this", "remind me", "run this at", or wants a task to recur or fire in the future. (A standing behavior rule — hooks or
  settings config — is not a schedule.) Produces a self-contained job spec (trigger, the
  exact prompt the run executes, delivery, and failure policy) and wires it to the host's
  scheduler.
---

# truestack-task-scheduling

A scheduled run happens with **no memory of this conversation** — only the job spec you write
and whatever lives in committed project memory. So the whole skill is about making the future
run self-sufficient, grounded at run time, and safe to repeat. Get the spec right and it runs
unattended for months; get it vague and it silently does the wrong thing every morning.

## 1. Is it actually a schedule?
- A **cadence** ("every morning", "each Monday", "hourly") → schedule it.
- A time phrase describing the **subject**, not the timing ("summarize yesterday's standup") →
  that's a one-off; just do it now.
- **Ambiguous?** Do it once now, then offer to make it recurring — don't assume.

## 2. Write the job spec
Capture four things, precisely:
- **Trigger** — a recurring cadence (cron, e.g. `0 6 * * *` for 06:00 daily) or a one-time
  fire-at timestamp. Pin the timezone.
- **The run prompt** — the exact, self-contained instruction the run will execute. It must name
  its own data sources and re-fetch them at run time; it cannot rely on anything from this chat.
- **Delivery** — what "done" produces and where it goes (a file, a message, a report, a memory
  update), so a silent run isn't a useless run.
- **Failure policy** — what to do on error or empty result: skip quietly, retry, or alert — and
  explicitly *don't* spam the user with "nothing to report" every day unless they asked.

## 3. Ground at run time (never bake in stale facts)
The single biggest scheduled-task bug: freezing today's data into the prompt. The run must read
**live** sources and current memory when it fires — "yesterday" is computed at run time, prices
and statuses are re-fetched, the repo is re-read. Author the prompt so it pulls fresh, not so it
repeats a snapshot.

## 4. Make repeated runs safe
- **Idempotent / bounded**: a run must be safe to fire again; guard against overlap if one run
  can outlast its interval; cap the work so a busy day can't blow up.
- **Side-effects stay gated**: a scheduled job still obeys the boundaries — it may *prepare* a
  message, payment, or destructive change, but anything Ask-first needs human approval, not an
  automatic 6am execution. Schedule the *draft*, not the irreversible send, unless the user
  explicitly authorized the action itself.

## 5. Wire it to the host
Discover, don't assume: check what scheduler actually exists here, in this order — (1) the
harness's own scheduling tools if the session exposes them (some Claude Code environments ship
Cron tools — look for them before shelling out), (2) system `cron` / Windows Task Scheduler
running headless `claude -p "<run prompt>"`, (3) a CI cron (GitHub Actions `schedule:`).
Concrete copy-paste recipes for each → **`references/wiring.md`**. This skill defines the spec;
create the schedule with the host's scheduler and confirm the first run's timing back to the
user. If no scheduler is available, say so and hand back the spec to run manually — never
pretend a schedule exists.

## Output
```
# Scheduled job: [name]
## Trigger: <cron / fire-at + timezone>
## Run prompt: <self-contained instruction, re-fetches live data>
## Delivery: <what it produces, where>
## Failure policy: <retry / skip / alert; no-spam rule>
## Boundaries: <any Ask-first action kept as draft-only>
```

## Explain it simply
Confirm in one plain line what will run, when, and what the user will receive ("Every weekday
7am: a fresh open-PR digest saved to reports/ — nothing sent anywhere"). State the first run
time. Recurring research uses **truestack-deep-research**; recurring checks use **truestack-quality-control** / the test run.
