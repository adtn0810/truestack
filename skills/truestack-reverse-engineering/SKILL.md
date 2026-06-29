---
name: truestack-reverse-engineering
description: Reverse-engineer a reference — a repo, code snippet, doc/spec, or a legacy system —
  into a verified model of how it works, then derive a safe upgrade path for the user's own
  system. Use whenever the user shares code or a reference and asks how it works or how it's
  built, says "reverse engineer this", "how does X do it / achieve this", "study this repo and
  upgrade mine", "port / adopt / replicate this pattern", "modernize my system based on this", or
  needs to understand an unfamiliar codebase before changing it. Grounds every claim in the actual
  artifact (verified vs inferred), respects license/IP (adapt patterns, never copy proprietary
  source; adopting licensed code is Ask-first; authorized targets only), and routes the upgrade
  through truestack-architecture-planning's approval gate and truestack-quality-control.
---

# truestack-reverse-engineering

Understand the reference *for real*, then **adapt — not clone**. The deliverable is a verified
model of **how** it works and **why**, turned into a **safe upgrade** for the user's system. Honesty
over assumption: a guess about how code works is a future bug, so every claim is grounded in the
actual artifact and labelled **verified vs inferred**. Adapt the idea; respect the IP.

Read project memory first — `CLAUDE.md` is auto-loaded (Principles + Boundaries); consult
`.ai/memory/` for the user's stack and conventions so the upgrade grafts onto what's really there.
If none exists, run `truestack-project-memory`. **Authorized targets only**: the reference must be something
the user may study — their own code, OSS under a compatible license, or a system they're cleared to
analyze. Studying a system's *observable behaviour* to rebuild a capability is legitimate;
exfiltrating secrets or defeating protection for misuse is not — decline that and say why.

## 1. Scope, provenance, and license — before reading deeply
Establish what the reference is (repo / snippet / binary / doc), where it came from, and **under
what license**. Record the license and any constraint (copyleft, attribution, no-derivatives). Then
frame the real question: *"how does it do X"* (learn) vs *"get its capability into my system"*
(adopt). If the goal is to adopt **code** (not just the idea), license compatibility is an
**Ask-first gate** — never paste licensed/proprietary source into the user's tree without an explicit yes.

## 2. Map the spine before the details (static pass)
Read outside-in: entry points, the module/dependency graph, the data model, the key interfaces, and
configuration. Name the architecture style and the few **load-bearing decisions** that make it work.
Don't drown in line-by-line reading — find the spine first. Track what you can read directly
(**verified**) separately from what you can only **infer**.

## 3. Confirm behaviour — run it, don't assume (dynamic pass)
A static read shows what it *looks like* it does; confirm what it *actually* does wherever you can:
run it, exercise the path, read its tests, trace inputs → outputs, debug a real invocation. For a
binary or black box, observe at the boundary (I/O, network, API responses). **"Probably X" is not
confirmation** (same bar as `truestack-root-cause-debugging`). Tag each finding **verified** (saw it happen)
or **inferred** (read-only) — and keep that label all the way into the report.

## 4. Extract the transferable idea — the WHY, not the lines
Isolate what actually makes it work for the user's goal: an algorithm, a data structure, a protocol,
an architectural seam, an ordering, a caching/consistency choice. Separate the **essential idea**
(transferable) from **incidental implementation** (its stack, names, framework) and from **what
won't fit the user's context** (its scale, its constraints, its era). You're carrying the idea
across, not transplanting code that assumes a different world.

## 5. Auto-research before adopting
The reference leans on libraries, patterns, and APIs you must not trust from recall — **auto-research
their current docs, versions, and advisories** from authoritative sources (`context7` / official
docs) before adopting (per the always-on contract). A pattern that was best practice in the
reference's era may be superseded; confirm it's still the right call **now**, for an enterprise-grade result.

## 6. Map it onto the user's system — the upgrade, gated
Produce the upgrade path: what changes, where it grafts onto existing code, what it replaces, the
migration/rollout, and the risks. Changing a working system from an external model is
**high-risk-shaped** — route the plan through **truestack-architecture-planning**'s approval gate **before any
code**, especially where it touches accuracy-critical paths, data, money, or schema. Hand
implementation to **truestack-backend-development** (or the right builder), gate "done" through
**truestack-quality-control**, and keep the **code↔memory tally** balanced — record the decision *and its
source/reference* so the next session knows where the design came from.

## Hard rules (sharpened for this skill)
- **Honesty** — label every "it works by X" verified or inferred; never fabricate a mechanism. If you can't confirm, say so and name what you'd need (a runnable build, access, the missing module).
- **IP / license** — adapt patterns and behaviour; **never copy proprietary source verbatim**. Surface the license; adopting licensed code is Ask-first; authorized targets only; refuse misuse.
- **Safe upgrade** — an external model is *not* proven for the user's system: it goes through plan → build → QC, never straight to prod.

## Explain it simply
Open with the essential idea in one plain line — *how* the reference works — before any detail, then
what you'd change in the user's system and why. Show the map as a short list/diagram, state the
**verified-vs-inferred** split explicitly, and present the upgrade as a **gated plan**, not a
finished change. Never dress an inferred mechanism up as confirmed.

## Honest exit
If the reference can't be fully understood (obfuscated, missing pieces, no runnable path) or its
license blocks adoption, say so plainly and report what's verified vs still open and what's needed —
don't claim a clean understanding or a safe upgrade you can't prove (honesty contract). Then hand the
gated upgrade plan to **truestack-architecture-planning** → **truestack-backend-development** → **truestack-quality-control**; for
deep external/landscape research, pair with **truestack-deep-research**.
