# React engineering detail

## Component architecture
- One responsibility per component; keep them small. One component per folder (component + styles + test + index).
- Separate business logic from UI: custom hooks (`useX`) hold logic/data; components render.
- Pure render: output depends only on props/state/context — no side effects, no mutating externals during render. Side effects live in event handlers or effects.
- Prefer props over context/global state for reusability and testability. TypeScript (or PropTypes) defines every component's contract.
- Wrap critical UI in error boundaries.

## State decision tree
1. **Local UI state** → `useState` / `useReducer`.
2. **Low-frequency global** (theme, auth, locale) → Context. Split contexts so one update doesn't re-render the whole tree.
3. **Server state** (anything fetched) → TanStack Query or SWR — caching, dedup, revalidation, Suspense. Do **not** mirror server data into Redux.
4. **Complex shared client state** → Zustand (light) or Redux Toolkit (heavy, devtools). Only when 1–3 don't fit.

## Data fetching
- Suspense + skeletons for progressive loading; granular boundaries so one slow section doesn't block the rest.
- Avoid the client waterfall (mount → effect → fetch → re-render → next fetch). Fetch in parallel, colocate queries, prefetch on intent (hover/route change).
- Server Components (with a supporting framework): server-first for data/content; client islands only where interactive. Pure SPA: lean on code-splitting + Query.

## Performance checklist (Core Web Vitals)
- **Don't** reflexively hand-write `useMemo`/`useCallback` — if the React Compiler is enabled in the build config it handles memoization; without it, add targeted manual memo only where the Profiler shows a hot path.
- Code-split routes, modals, drawers, heavy charts (`React.lazy` + Suspense) — usually the single biggest initial-bundle cut; measure yours with the analyzer.
- Virtualize lists > ~100 rows (`@tanstack/react-virtual`); mandatory at 500+.
- Images: correct sizing, lazy-load below the fold, modern formats; reserve space to avoid layout shift.
- Targets: LCP < 2.5s, INP < 200ms, CLS < 0.1. Measure with Profiler + bundle analyzer + Lighthouse; monitor real-user metrics for regressions.

## Accessibility checklist
- Semantic elements (`button`, `nav`, `main`, `ul`, `label`) over `div`/`span` soup.
- Keyboard: every interactive element reachable and operable; visible focus ring; logical tab order; Esc closes overlays.
- Focus management: move focus into modals/drawers and restore it on close; move focus to the heading on route change.
- Contrast: WCAG AA (4.5:1 body text). Never encode meaning in color alone.
- Labels: every input has a label; icon buttons have accessible names. ARIA only when native semantics can't express the intent.
- Respect `prefers-reduced-motion`.

## Testing
- React Testing Library: query by role/label, interact as a user, assert on visible behavior — not implementation details or internal state.
- Cover: render with props, user interactions, async loading/error states, edge cases (empty, long text, error).
- jest-axe for automated a11y assertions; Playwright for critical end-to-end flows.
