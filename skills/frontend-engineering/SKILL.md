---
name: frontend-engineering
description: Use when building, styling, fixing, or reshaping an interface, component, page, or frontend interaction. Use ui-ux-review for a read-only assessment of existing UI.
---

# Frontend engineering

Build the requested experience within the product's design language and actual frontend stack. Inspect the changed route, shared components, tokens, state/data conventions, assets, and build configuration first. Reuse working patterns; do not upgrade frameworks or introduce a component library as a side effect.

For a new interface or requested redesign, choose a visual direction tied to the product, audience, and content. Set a coherent type scale, spacing rhythm, hierarchy, and restrained color system. Put emphasis where the user's primary task needs it. Avoid decorative cards, gradients, motion, or oversized headings that obscure the information. Preserve existing visual identity on a narrow fix.

Model the user journey and its states: initial, loading, empty, success, validation error, service failure, disabled, and permission-limited where relevant. Keep input during recoverable errors. Prevent duplicate submissions when they create duplicate effects. Make optimistic updates reversible and stale responses harmless. Match local, shared, and server state ownership to the application's existing architecture; do not impose a framework-specific state ladder.

Use semantic elements and appropriate labels. Support keyboard navigation, visible focus, sensible tab order, and focus management for dialogs and route changes. Check contrast, zoom/reflow, reduced motion, and accessible error feedback in the affected UI. ARIA should supplement native semantics when needed.

Check that users can find the requested actions, identify the entity they are editing, and distinguish an unsaved preview from persisted settings. Compare initial defaults with validation rules and existing saved state; explain real state differences instead of dismissing a contradictory UI as user error. Exercise save and reload when persistence matters. Preserve existing capabilities during simplification. If the user requests a preview for approval, prepare it before implementing that design; do not impose this gate on other UI work.

Keep component responsibilities clear and avoid unnecessary derived state, render side effects, data waterfalls, and unbounded DOM lists. Confirm compiler and framework capabilities before using version-specific APIs or adding manual memoization. Profile a reported slowdown with systematic-debugging before optimizing it.

Use existing repository checks and test-verify for the changed behavior. When browser access is available, exercise the actual flow, inspect loading/error behavior, check console/runtime errors, and view relevant mobile and desktop widths. Review screenshots against the intended hierarchy and layout; a passing build does not prove visual quality. Use available accessibility tooling plus a keyboard walkthrough where the interaction warrants it.

Report what the user can now see or do, the checks actually performed, and concrete limitations such as an unavailable backend or browser. Do not claim screenshots, live integration, or accessibility conformance that was not established.
