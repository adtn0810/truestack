---
name: ui-ux-review
description: Use when reviewing an existing interface for usability, visual hierarchy, responsive layout, accessibility, or interaction problems. Assessment is read-only unless the user requests fixes or redesign.
---

# UI and UX review

Assess the actual interface against the user's goal. Establish the target screen or flow, intended audience, primary task, and requested scope. Inspect the current UI in a browser when available, including the relevant viewport and interaction states. If only source or screenshots are available, say what they can and cannot establish.

Review the most consequential issues first:

- Task clarity: can the user tell what the screen is for, what to do next, and whether an action succeeded?
- Information hierarchy: do headings, typography, spacing, density, alignment, grouping, and emphasis support reading and comparison? Keep product vocabulary precise.
- Interaction: are actions discoverable, labels clear, destructive actions understandable, forms recoverable, and feedback timely? Inspect loading, empty, error, disabled, permission, and long-content states where relevant.
- Accessibility: check semantics and labels, keyboard order and operation, visible focus, dialogs, contrast, zoom/reflow, and reduced motion. Do not infer keyboard behavior from a static image.
- Responsive behavior: look for overflow, obscured controls, fragile layouts, and poor touch use at the widths the product supports.

Tie each finding to a concrete screen, element, or reproducible interaction. State its user impact and a practical correction. Prioritize blockers and repeated friction over personal stylistic preference. Explain when a visual choice violates an existing design convention versus when it is simply an alternative.

Keep the result concise: findings ordered by severity, evidence, and recommended correction. Include a short statement when no material issues were found and list important coverage gaps. Avoid scoring the entire product from a single screenshot or claiming full accessibility compliance from an automated scan.

Review alone does not authorize code changes, new dependencies, branding changes, or a redesign. When fixes are requested, pass the prioritized findings into frontend-engineering and verify the changed interaction. Use code-review for implementation correctness and systematic-debugging for a measured performance or functional defect; do not expand this review into a generic engineering audit.
