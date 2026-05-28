# Design System Rules

Use this rule for UI implementation, styling changes, design-to-code work, and visual QA.

## Priorities

1. Reuse existing ORRY layout and component patterns.
2. Extend local styles in the smallest safe scope.
3. Add new reusable UI only when repeated usage is already clear.

## ORRY Visual Constraints

- Preserve ORRY’s premium dark visual system and spacing rhythm from `src/app/globals.css`.
- Avoid introducing another brand’s colors, copy, icons, or visual language.
- Do not replace the app shell, navigation, or typography direction unless the task explicitly requires it.
- Use existing CSS variables or shared class patterns where available before hardcoding values.

## State Coverage

For non-trivial UI work, think through:

- loading
- empty
- error
- hover
- focus
- disabled
- selected or active where applicable
- mobile and desktop layouts

## Accessibility Baseline

- Prefer semantic HTML first.
- Every form control needs an accessible label.
- Icon-only buttons need an accessible name.
- Focus indicators must remain visible.
- Real tabular data must use table semantics.
