# SLO burn-rate alerting — tiers and math

Load when wiring burn-rate alerts (SKILL.md §10) or tuning noisy pages.

## Burn rate, defined
burn rate = observed budget spend ÷ the spend the SLO allows. **1×** = spending exactly the whole
error budget over the SLO window; **14.4×** = a 30-day budget gone in ~2 days.

## Google SRE multi-window multi-burn-rate tiers (30-day SLO — the starting point, tune per service)
| Burn rate | Long window | Short window | Budget consumed | Action |
|---|---|---|---|---|
| **14.4×** | 1h | 5m | 2% in 1h | **Page now** |
| **6×** | 6h | 30m | 5% in 6h | Page / ticket |
| **1×** | 3 days | 6h | 10% in 3 days | Ticket |

## Rules that keep it quiet
- **Both windows hot** before firing — the short window (~1/12 of the long) proves the burn is
  *still* happening; a transient spike lights the short window only and stays silent.
- The slow **3-day 1× ticket** is the most-skipped, most-valuable tier — it catches the gradual
  degradation no static threshold ever pages on.
- Alert on burn rate, never raw error rate — a static "error rate > X" pages on every blip or
  misses a slow budget drain.
- Recovery: long windows keep an alert hot after the incident ends — reset expectations, or use
  the short window as the clear condition.
