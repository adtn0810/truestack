# Design system: brainstorm → critique → build

Work in two passes; do most iteration in your head and show the user only high-confidence ideas.

## Pass 1 — compact token system
Ground in the subject first: if the brief doesn't pin down the product, audience, and the
page's single job, pin them yourself and state your choice. Then draft:
- **Color** — 4–6 named hex values chosen for this subject, not a generic palette.
- **Type** — 2+ roles: a characterful display face used with restraint, a clean body face, and a utility face for captions/data if needed. Set a scale with intentional weights, widths, spacing.
- **Layout** — a layout concept in one-sentence prose + an ASCII wireframe to compare options.
- **Signature** — the single element the page is remembered by, embodying the subject.

## Pass 2 — critique against the brief (before coding)
For each part, work the same brief as a generic prompt and see if you'd land in the same
place. If a choice reads like the default you'd produce for *any* similar page, revise it and
say what changed and why. AI design currently clusters around three looks — don't spend a free
axis on them:
1. Warm cream bg (~#F4F1EA) + high-contrast serif + terracotta accent.
2. Near-black bg + one acid-green / vermilion accent.
3. Broadsheet layout: hairline rules, zero border-radius, dense columns.
Where the brief specifies a direction, follow it exactly — the brief's words always win.

## Build
Derive every color and type value from the revised plan. Watch CSS specificity — a type-based
selector (`.section`) vs an element/class one (`.cta`) can cancel paddings/margins between
sections. Match execution to vision: maximalist needs elaborate detail; minimal needs
precision in spacing and type. Elegance is executing the chosen vision well.

## Copy is design material
Write from the user's side of the screen — name things by what people control, not how the
system is built (a person manages notifications, not webhook config). Active voice on controls
("Save changes", not "Submit"); keep an action's name consistent through its flow (a "Publish"
button → a "Published" toast). Errors explain what happened and how to fix it — never vague or
apologetic. Empty states are an invitation to act. Each element does exactly one job.

## Restraint
Spend boldness in one place; keep everything around the signature quiet; cut any decoration
that doesn't serve the brief. Before shipping, remove one accessory (Chanel's rule). Jot notes
on what you've tried so the next pass explores somewhere new — and remember not taking a risk
is itself a risk.
