---
name: truestack-explain-plain
description: Explain finished work or existing behavior in short, beginner-friendly plain
  English — big picture first, jargon defined in one line, an analogy when it helps, and
  the reasoning behind choices rather than just the mechanics. Use automatically after the
  work is finished to say what was done and why, and whenever the user says "explain this",
  "what does this do", "walk me through what you did", "in simple terms", "make it
  simple", "teach me", "so I can learn", "I don't get it", or asks why you built it that
  way. Made for a junior developer who needs to understand and learn from the result, not
  just receive working code. Scoped to work just done or code already in context; when
  understanding first requires investigating an unfamiliar artifact or system, route
  through truestack-reverse-engineering first and explain the findings after.
---

# truestack-explain-plain

Working code the user can't follow teaches nothing. The set's skills close their reports
with a one-line "explain it simply" footer — but a footer is not a lesson. This skill fires
when the explanation *is* the deliverable: what was built, why it's shaped that way, how
the piece the user points at behaves — in plain English a junior developer can absorb,
remember, and reuse. It is translation, not investigation: it explains what is already
known or readable in place, and digs up nothing new.

## When to use (and when not)
- **Automatically, after every build, fix, or design task** — no request needed. Say what
  was done and why, sized to the change: substantial work gets the full lesson, a trivial
  change gets two plain sentences in the close. Either way it is one close — never the
  sibling's footer *and* a lesson stacked on top of each other.
- **Whenever the user asks to understand** — "what does this do", "why did you build it that
  way", "walk me through it" — or signals confusion. "I don't get it" fires this skill,
  never a defense of the previous answer.
- **Not this skill:** producing a verified model of an unfamiliar or shared artifact, or an
  upgrade path from it → **truestack-reverse-engineering**; a question about a third-party
  system with nothing shared to open → **truestack-deep-research**. When comprehension needs
  real investigation first, chain them — investigate, then explain the findings plainly.
  Reading the one file the user points at is translation; needing to chase its imports,
  callers, or an unfamiliar system to answer is investigation — chain it through
  **truestack-reverse-engineering** first.

## 1. Big picture first
Open with the *what* and the *why* in one or two sentences a beginner could repeat back.
The reader who stops after the opening still leaves holding the idea; detail comes after,
never instead.

## 2. Plain English — jargon pays a tax
No technical term unless it earns its place, and every term that stays gets a one-line
definition at first use: "middleware — code that runs on every request before your route
handler sees it." Expert framing that assumes prior knowledge is the failure mode, not a
style choice.

## 3. Keep it short
First reply ≤ ~150 words — roughly three to six sentences or one tight bullet list, never
a wall of text. When the topic genuinely needs more, layer it: big picture → one level of
detail → offer to go deeper, expanding only the part the reader picks. Exhaustive is not
the goal; understood is.

## 4. One analogy, when it clicks
A simple analogy or mental model when it makes the concept land ("the connection pool is a
taxi rank — cars wait ready so nobody phones for one from scratch") — and none when it
doesn't. A forced analogy confuses more than the jargon it replaced.

## 5. Teach the reasoning, not just the mechanics
Say *why* this shape: what breaks without it, what it trades away, and when to reach for
the same pattern again. The reader should come away able to do it themselves next time —
the pattern, not just this instance. Ground the why in the actual decision — memory, the
plan, or the code itself; a generally-true benefit of the pattern is not *this project's*
reason, and when you're inferring the reason, say you're inferring.

## 6. Point, don't re-dump
Reference the load-bearing spots as `path:line` and explain the idea they implement. Never
re-paste the full code; walk line-by-line only when the user asks about a specific line.

## When they still don't get it
"I don't get it" means the explanation failed, not the reader. Re-explain *differently* —
a new angle or analogy, a smaller piece, or one concrete request traced end to end — and
ask once which part lost them. Repeating the same explanation louder is a defect.

## Simplifying never bends facts
The honesty contract holds in teaching voice: omit detail freely, misstate nothing. An
analogy that leads the reader to a wrong prediction is a defect, not a simplification. And
when you don't actually know why something works, say so plainly — an honest "I'm not sure,
let's check" teaches more than an invented clean story.

## Explain it simply
Close each lesson with one line naming what the reader can now do: "You can now trace a
request through the middleware chain yourself."
