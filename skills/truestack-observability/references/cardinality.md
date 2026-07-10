# Metric cardinality — caps, overflow, View API

Load when setting per-metric limits (SKILL.md §2) or diagnosing "too many timeseries" / overflowed
metrics.

## The default cap and what overflow does
- The OTel SDK caps each metric stream at **~2000 timeseries per collection cycle** by default
  (spec default — verify your SDK's current value, it varies by language/version).
- Past the cap, every *new* attribute combination collapses into one synthetic datapoint stamped
  **`otel.metric.overflow=true`**. Totals still add up, so dashboards keep rendering while
  per-dimension data is silently corrupted.
- The overflow attribute is the smoke alarm — **alert on its presence**; don't wait to notice a
  dashboard lying.

## Set explicit limits — don't ride the default
- **Per-metric**: register a **View** for the instrument and set its
  **`aggregation_cardinality_limit`** to what the dashboard actually needs (often 10–100, not 2000).
- **Views also cut cardinality by dropping attributes**: an attribute allow-list on a View keeps
  only the dimensions you chart and discards the rest before aggregation — cheaper than a limit hit.
- Set the limit where the metric is *created* (SDK), not downstream — the Collector can drop or
  relabel, but by then the SDK has already paid the memory and the overflow may have fired.

## When a metric overflows, in order
1. Find the unbounded attribute (id, raw path, email, error string) — move it to traces/logs (§1).
2. Template the dimension (`http.route="/users/{id}"`) if it's genuinely chart-worthy.
3. Only then raise the limit — a higher cap on an unbounded attribute just delays the overflow.
