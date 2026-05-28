# Frontend Craft Operator Guide For ORRY

## Where The Assets Live

- Upstream vendor snapshot: `.frontend-craft/`
- Installed workflow skills: `.agents/skills/`
- Installed custom agents: `.codex/agents/`
- ORRY-specific rules and workflow guardrails: `.codex/rules/`, `.codex/skills/orry-frontend-workflow/`, `AGENTS.md`

## Skills ORRY Should Use Most Often

- `orry-frontend-workflow`
  - Load this first for ORRY-specific guardrails.
- `frontend-craft-review`
  - Best for reviewing recent frontend changes and saving a report to `reports/`.
- `frontend-code-review`
  - Best for deeper file-level frontend review.
- `frontend-craft-scaffold`
  - Use for bounded route or component scaffolding that must fit App Router.
- `security-review`
  - Use for auth, user input, uploads, API routes, env usage, and sensitive UI flows.
- `accessibility-check`
  - Use for WCAG-oriented checks on forms, tables, dialogs, and nav.
- `implement-from-design`
  - Use when a design file, screenshot, or detailed mock is available.
- `test-and-fix`
  - Use to run validation commands, fix failures, and write a report.
- `nextjs-project-standard`
  - Use when changing route structure, App Router patterns, middleware, or rendering mode.
- `supabase-orry-auth`
  - Use for login, registration, reset password, admin user management, and approval-gated access.
- `orry-phase1-backoffice`
  - Use for documents, inventory, shipping, approvals, and stock-related UI.

## Agents ORRY Should Use Most Often

- `frontend-architect`
  - For page decomposition, directory planning, and bounded refactors.
- `ui-checker`
  - For layout regressions, spacing issues, responsive problems, and design fidelity checks.
- `performance-optimizer`
  - For slow tables, large client bundles, and rerender hotspots.
- `figma-implementer`
  - For design-to-code work using available design context.
- `design-token-mapper`
  - For mapping new design values into existing ORRY styling conventions.

## Example Prompts

### UI Review

`Use orry-frontend-workflow and frontend-craft-review to review the recent changes to the protected dashboard and save the findings to reports/.`

### Feature Scaffold

`Use orry-frontend-workflow and frontend-craft-scaffold to scaffold a protected settings page for payment channels that matches the existing ORRY route structure.`

### Accessibility Pass

`Use accessibility-check on src/app/(protected)/users/page.tsx and related components, then save the report to reports/.`

### Security Review

`Use supabase-orry-auth and security-review to audit the forgot-password and reset-password flows and write a report under reports/.`

### Design-To-Code Implementation

`Use orry-frontend-workflow, implement-from-design, and figma-implementer to implement this new billing note page without changing ORRY branding.`

### Test And Fix

`Use test-and-fix to run ORRY’s available validation commands for the files I changed, fix only the scoped failures, and save the summary in reports/.`
