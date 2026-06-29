---
description: Set up a recurring or deferred automatic run — define the trigger, the self-contained run prompt, delivery, and failure policy, then wire it to the host scheduler.
argument-hint: <what to run> <when, e.g. every weekday 7am>
---
Use the **truestack-task-scheduling** skill to set up automated work.

Request: $ARGUMENTS

Produce the job spec (trigger + timezone · the self-contained run prompt that re-fetches live
data at run time · delivery · failure policy), keep any Ask-first side-effect as draft-only
unless the user authorized the action itself, then create it with the host's scheduler and
confirm the first run time. If the request is a one-off (the time phrase describes the subject,
not a cadence), do it once now and offer to make it recurring instead.
