---
name: truestack-observability
description: Instrument a self-hosted backend so you can see what it's doing in production —
  structured logging, metrics, distributed tracing, health checks, and SLO/burn-rate alerting.
  Use whenever the user wants to "make this service observable", "add observability", set up
  "structured logging" / "JSON logs", add "OpenTelemetry" / "OTel" / "OTLP" / an "OTel Collector",
  add "metrics" / "Prometheus" / "Grafana" / "RED" / "USE", add "distributed tracing" / "spans" /
  a "correlation ID" / "request ID" / "trace ID in logs", expose a "health" / "readiness" /
  "liveness" endpoint as a monitoring signal, set up "SLOs" / "error budget" / "burn-rate alerts",
  or fix "noisy alerts", "high cardinality" / "too many timeseries", "logs filling the disk",
  "redact PII from logs", or "I have no telemetry yet / can't see what my service is doing".
---

# truestack-observability

Make one box tell you the truth about itself — counts as metrics, narrative as logs, causality as
traces — without the telemetry pipeline becoming the thing that takes the box down. On a self-hosted
single server CPU, memory, connections, and disk are finite; the observability stack is a strictly
bounded, lower-priority tenant, never a co-equal of the app.

Read project memory first — `CLAUDE.md` is auto-loaded (Principles + Boundaries); consult
`.ai/memory/` for the stack, existing log/metric conventions, and the backend it runs on. If none
exists, run `truestack-project-memory`. Keep the **code↔memory tally** balanced: if you add a health endpoint,
an OTLP endpoint, a Collector config, or a dashboard, record the command/decision in the same change.

Adding a Collector, wiring an OTLP exporter on the request path, or changing a health probe an
orchestrator already restarts on is **shippable infra** — route it through `truestack-architecture-planning`'s
approval gate before writing it, and let `truestack-quality-control` gate it before "done". Destructive or
deploy/migration steps (dropping a metrics volume, repointing a probe in prod) hit the enforced
PreToolUse gate in `hooks/` — they need an explicit yes, not just an intent.

**Where this skill sits:** it builds the *standing* telemetry that lets you see production — it
**feeds evidence to** `truestack-root-cause-debugging` (it is not the active bug investigation) and is not
the one-shot load/perf check `truestack-quality-control` runs on a change. The container/compose healthcheck
and the cutover probe are `truestack-deploy-and-runtime`'s; this skill owns exposing app/dependency health as
a *monitoring* signal wired to SLOs/alerting — reuse whatever probe paths `truestack-deploy-and-runtime` /
`.ai/memory/` already recorded rather than inventing new ones.

## 1. The three signals — pick the right one
- **Metrics** = counts and durations, cheap, bounded, always-on. Aggregate numbers, never identifiers.
- **Logs** = narrative for one event, structured JSON, sampled. Where high-cardinality detail lives.
- **Traces** = causality across calls/processes — the spine root-cause work walks.
Emit a counter; don't count log lines to fake a metric. Put the user/request id on the log or trace,
**never** on the metric.

## 2. Bound metric cardinality at the source (the #1 single-box footgun)
The OTel SDK caps each metric stream at ~2000 timeseries per cycle by default; everything past it
collapses into a synthetic `otel.metric.overflow=true` bucket and **silently corrupts the data**.
- Never put unbounded values in a metric attribute: `user_id`, `request_id`, raw URL path, email,
  full SQL, error-message string. Those belong on traces/logs.
- Template high-variability dimensions: `http.route="/users/{id}"`, never `/users/4821`.
- Set explicit per-metric limits via the View API / `aggregation_cardinality_limit` — don't rely on
  catching it after the dashboards already lied.

## 3. RED for services, USE for the box — the only two dashboards you maintain
- **RED** per endpoint — **R**ate, **E**rrors, **D**uration — answers "are requests served well?"
- **USE** on CPU/memory/disk/network — **U**tilization, **S**aturation, **E**rrors — answers "is the
  host the bottleneck?" On one server the **Saturation** signals (run-queue length, disk I/O wait,
  swap, connection-pool wait) are what actually predict the outage and the ones most teams omit
  because the cloud usually hid them. Wire them.

## 4. Health: liveness ≠ readiness (the restart-loop trap)
Split the endpoints and never let liveness touch anything external:
- **`/health/live`** = "is the process wedged?" — in-process only, checks **nothing** downstream.
- **`/health/ready`** = "can I serve traffic right now?" — checks DB/cache/downstream; this is the
  one you flip to drain traffic.
A single `/health` that pings the DB is the dominant production failure: the DB blips → the
supervisor restarts the app → the restart still can't reach the DB → restart loop on top of the
outage. Set readiness `failureThreshold` to 3–5 and `timeout` above your dependency's tail latency
so a normal latency spike doesn't eject the only node.

## 5. Correlate logs to traces automatically (don't thread an ID by hand)
Let the OTel log SDK stamp the active `trace_id`/`span_id` onto every log record — zero per-call
effort, and it's what makes "jump from a slow trace to the exact logs it emitted" work. Adopt **W3C
`traceparent`** propagation so the IDs survive across process/queue boundaries. Log volume can then
be sampled in lockstep with traces (same `trace_id`), so root-cause work starts from a trace and
pivots to logs instead of grepping.

## 6. Structured logs: small fixed field set, no DEBUG in prod
JSON only, with consistently-named semantic-convention fields (`service.name`,
`http.response.status_code`, …) and `level` as a first-class field. The classic mistakes: inconsistent
field names across modules (can't query), DEBUG left on in prod (drowns disk and signal), and log
lines used as a stand-in for metrics. Counts → metrics, narrative → logs, causality → traces.

## 7. Keep secrets and PII out of telemetry — in the pipeline, not just at call sites
Add a **redaction processor** in the OTel Collector (or SDK log processor) that pattern-matches and
scrubs emails, tokens, card numbers, auth headers, and connection strings, so a stray `log.info(user)`
can't leak. This is a hard GDPR/PCI/HIPAA requirement and the most common silent compliance breach.
Stripping PII here also keeps it from ever becoming a metric attribute (double duty with §2). What
counts as PII and the redaction *policy* is `truestack-data-privacy`'s to define; observability **implements** it here.

## 8. Cap volume so one box can't fill its own disk
- **Head-based (probabilistic) sampling** is the default on a single node — tail sampling buffers
  whole traces in memory and is exactly what melts a lone collector under load. Always-sample errors
  and slow outliers; sample the boring 200s down hard.
- **Bounded local retention**: size-capped rotating log files, a disk-usage ceiling, and a retention
  window on traces/metrics. An observability stack that OOMs or fills the disk takes the app with it.
- The pipeline is a bounded tenant: `memory_limiter` + drop on backpressure, never block the app.

## 9. One seam: app → OTLP → local Collector → local backend
Export OTLP to a Collector on the same box; the Collector owns buffering (`memory_limiter` + `batch`
+ retry/queue), redaction, sampling, and fan-out. The app **fires and forgets** — never blocks on
export, degrades gracefully if the backend is down. This single seam is what lets you swap
Prometheus/Grafana/Tempo/Loki/SigNoz later without touching application code, and keeps observability
overhead off the request path. Use **exemplars** to bridge metrics→traces: a latency-histogram bucket
carries a real `trace_id`, so you click from a spiking dashboard straight to a representative slow
trace — the cardinality-free way to answer "which request was slow", and the evidence trail that
feeds `truestack-root-cause-debugging`.

## 10. Alert on SLO burn rate, not raw thresholds (the cure for noisy alerts)
A static "error rate > X" pages on every blip or misses a slow budget drain. Use multi-window
multi-burn-rate (Google SRE tiers as the start): **14.4× over 1h → page now**, **6× over 6h →
page/ticket**, **1× over 3 days → ticket**. Require **both** a short and a long window hot before
paging, so a transient spike lights the short window but not the long one and stays quiet. The
most-skipped, most-valuable tier is the slow 3-day ticket that catches gradual degradation no one
would otherwise notice.

## Honest exit
Instrument only what you can actually verify firing — trigger the path, see the metric/trace/log
appear, then claim it. Don't report "fully observable" off a config that was never exercised. If a
signal can't be wired (no backend, missing access, a dependency you can't reach), say so plainly and
report what's covered vs. what's left (honesty contract) rather than a false green. When the work
changes a recorded command or decision, update project memory in the same change; then hand off to
**truestack-quality-control** before "done".

## Explain it simply
Say which signal answers which question in one plain line — "metrics tell you *that* it's slow,
traces tell you *where*, logs tell you *why*". Show the burn-rate tiers and the live-vs-ready split as
small lists or a table, not prose. After wiring anything, state in one line what you can now see that
you couldn't before.