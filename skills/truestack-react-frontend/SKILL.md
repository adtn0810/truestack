---
name: truestack-react-frontend
description: Build or reshape React UI to a professional bar — distinctive visual design
  AND sound front-end engineering. Use whenever the user is building a React component,
  page, screen, or app, or styling or improving an existing React interface — even if
  they only say "build the dashboard" or "make this page nicer" (whole-app architecture
  for a brand-new build still starts in truestack-architecture-planning). Covers design taste,
  component architecture, state, data fetching, performance, accessibility, and testing.
---

# truestack-react-frontend

A professional frontend is two things at once, and most generated UI fails one of them: it
either looks templated (generic AI design) or it's pretty but badly built (needless
re-renders, no accessibility, data waterfalls). This skill holds **both** bars — a
distinctive, intentional design *and* clean, fast, accessible React.

Read project memory first (`CLAUDE.md` + `.ai/memory/`) for the design language, component
conventions, and stack. If the request is ambiguous, clarify first (same loop as
`truestack-architecture-planning`) — and for a new build, the planning/scoping step itself
belongs to `truestack-architecture-planning`; this skill picks up at implementation.
Ground framework claims in the project's actual dependencies (React version, compiler/bundler
config) and current docs — don't assert library behavior from recall.

## 1. Design with a point of view (don't ship AI slop)
Approach it as the design lead giving this product an identity that couldn't be mistaken for
anyone else's. Ground every choice in the actual subject — its world, vocabulary, materials.
- **Hero is a thesis** — open with the most characteristic thing in the subject's world, not the template (big number + gradient accent).
- **Typography carries personality** — pair a characterful display face with a clean body face on an intentional scale; not the families you'd reach for on any project.
- **One signature element** — the single thing the page is remembered by. Spend your boldness there; keep everything else quiet.
- **Structure encodes meaning** — numbering / eyebrows / dividers only when they reflect something true (a real sequence), never decoration.
- **Motion deliberately** — one orchestrated moment beats scattered effects; respect `prefers-reduced-motion`. Excess animation reads as AI-generated.
- **Avoid the AI-design clusters** — cream-bg + serif + terracotta; near-black + acid accent; broadsheet hairline columns. Legitimate for some briefs, but defaults; don't spend a free axis on them.

For the full token-system process (color / type / layout / signature brainstorm, the
self-critique pass, and copywriting) → **`references/design-system.md`**. When a dedicated
design skill (e.g. frontend-design) is installed in this environment, defer the visual-design
pass to it — it is the maintained source of this guidance and `references/design-system.md`
is the fallback when none is present. The engineering pass below always runs here.

## 2. Engineer it right (the part design skills skip)
- **Components** — single responsibility, small and focused, one per folder. Pull reusable logic into **custom hooks**; keep components **pure** (no side effects in render). Prop-driven over global state. TypeScript contracts on props.
- **State** — climb the four-step tree (local → Context → server-state lib → client store) only as far as the level below can't hold it; **never store fetched data in Redux**.
- **React 19 + Compiler** — the **React Compiler is a separate, opt-in build plugin, not part of React 19 itself**; whether to hand-memoize depends on whether it's enabled (memoization rule in the reference). Use **Actions + `useOptimistic` + `useFormStatus`** for forms/optimistic UI, **`use()`** for promises/context, native `<title>`/`<meta>`, and `ref` as a prop (no `forwardRef`).
- **Data** — wrap fetches in **Suspense** with real skeletons; avoid the client waterfall (mount → effect → fetch → re-render). With a framework that supports Server Components, render server-first and keep interactivity in small client islands.
- **States** — error boundaries around critical pieces; design the empty and error states as deliberately as the happy path.

For the architecture detail, state decision tree, performance and a11y checklists, and
testing → **`references/engineering.md`**.

## 3. Performance (architectural, not memo cargo-cult)
The wins that move Core Web Vitals: **code-split** modals / drawers / routes / heavy charts
(`React.lazy` + Suspense); **virtualize** any list over ~100 rows (`@tanstack/react-virtual`);
shift data fetching off the client where possible. Target **LCP < 2.5s, INP < 200ms,
CLS < 0.1**; watch bundle size. Measure with the React Profiler + a bundle analyzer before
optimizing — don't guess.

## 4. Accessibility (a quality floor, not optional)
Semantic HTML over `div` soup; full keyboard operability with visible focus; manage focus on
route/modal changes; WCAG AA contrast; label every control; ARIA only when native semantics
can't express it; honor reduced motion.

## 5. Verify (frontend QC, then hand off)
Before done: run an **a11y pass** (axe + keyboard walkthrough), check **CWV / bundle** on
changed routes, write **React Testing Library** tests that exercise behavior through user
interactions (not implementation details), and confirm **responsive** down to mobile +
reduced-motion. Drive the actual UI in a browser (**Playwright**) and **screenshot it at
desktop and mobile widths** to catch visual/layout breaks a unit test won't — check it against
the design intent, not just that it renders. Then hand off to **truestack-quality-control** for the generic sweep
(types / lint / review / intent).

## Explain it simply
Name the design direction in plain terms — the concept, the signature element, and why it
fits the product — before the code. When you change UI, say in one line what changed and what
the user will see. Use a small table for any before/after metrics (bundle, LCP).

Quality floor, always: responsive, keyboard-navigable, reduced-motion respected, no console errors.
