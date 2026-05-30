# start
## Objective
- [x] Revise the ORRY theme/UI toward a more premium, cohesive, modern presentation without changing business logic, auth rules, inventory rules, approval rules, API contracts, or schema.
- [x] Complete a strict audit covering build, dev startup, lint, type safety, key route rendering, responsiveness, and presentation consistency.
- [x] Deploy to Vercel only if every audit item is green.
- [x] Trigger the repo-aligned orchestrator or task runner to execute `todo.md` automatically, or document a hard blocker with exact evidence if no such entry point exists.

## Scope Guardrails
- [x] Freeze implementation scope before editing.
- [x] Keep edits bounded to shared theme files plus the live dashboard module that currently defines `/dashboard`.
- [x] Avoid schema changes, contract changes, auth flow changes, or workflow redesign unless a minimal technical fix is strictly required for the theme to work.
- [x] Prefer shared tokens and shared classes over one-off page styling.
- [x] If any audit item fails, do not deploy until fixed or blocked with exact evidence.
- [x] Rollback note: revert only the files listed in `File Targets` if this theme pass must be backed out.

## File Targets
- [x] `src/app/globals.css`
- [x] `src/components/app-shell/app-shell.tsx`
- [x] `src/components/app-shell/page-header.tsx`
- [x] `src/components/app-shell/workspace.tsx`
- [x] `src/components/data-table/data-table.tsx`
- [x] `src/components/forms/simple-form.tsx`
- [x] `src/components/detail-panel/detail-panel.tsx`
- [x] `src/components/status/status-badge.tsx`
- [x] `src/components/dashboard/dashstack-dashboard.tsx`
- [x] `src/components/dashboard/dashstack-dashboard.module.css`
- [x] `src/app/(auth)/login/page.tsx`

## Implementation Tasks
- [x] Inspect repo guidance and ORRY UI guardrails before editing.
- [x] Inspect theme tokens, global styling, app shell, tables, forms, badges, auth, and the active dashboard route.
- [x] Replace stale bugfix-oriented `todo.md` with this theme implementation plan.
- [x] Tighten global spacing, surfaces, borders, shadow system, and focus states in shared CSS.
- [x] Improve sidebar, topbar, page header, and workspace framing to feel more cohesive and production-ready.
- [x] Refine shared table, form, button, empty-state, and badge presentation for stronger consistency.
- [x] Bring the active dashboard module into the ORRY premium dark direction instead of the current conflicting pastel showcase.
- [x] Polish the login page presentation and state messaging without altering auth behavior.
- [x] Review touched files for dead imports, abandoned styling, and inconsistent copy.

## Audit Tasks
- [x] Run `npm run lint`
- [x] Run `npx tsc --noEmit`
- [x] Run `npm run build`
- [x] Run a dev startup smoke check.
- [x] Smoke-check key routes: `/login`, `/dashboard`, and one representative protected table/form route if the runtime environment allows it.
- [x] Verify: build passes.
- [x] Verify: dev startup passes.
- [x] Verify: no new TypeScript errors caused by theme work.
- [x] Verify: no new lint-breaking issues caused by theme work.
- [x] Verify: key ORRY pages render.
- [x] Verify: theme is coherent across major screens.
- [x] Verify: no business logic regression observed from touched screens.
- [x] Verify: forms remain usable.
- [x] Verify: tables remain usable.
- [x] Verify: navigation remains usable.
- [x] Verify: loading, empty, and error states still render safely.
- [x] Verify: mobile layout does not obviously break.
- [x] Verify: no severe contrast or readability issues remain.
- [x] Verify: no dead imports or placeholder styling were left behind.

## Deploy Tasks
- [x] Confirm Vercel linkage and the safest deploy command for this repo.
- [x] Deploy only after all audit items pass.
- [x] Capture deploy output to `reports/orry-theme-audit-deploy.md`.
- [ ] Record the deployment URL and final status.

## Orchestrator Tasks
- [x] Locate the repo’s orchestrator entry point, automation runner, or task execution mechanism.
- [x] If one exists, trigger it against `todo.md` and capture the exact command and result.
- [x] If none exists, document the hard blocker, evidence searched, and the safest next action in `reports/orry-theme-audit-deploy.md`.

## Evidence
- [x] Save implementation and audit notes to `reports/orry-theme-audit-deploy.md`
- [x] Record commands run, outcomes, and remaining risks.
- [x] Record deploy evidence if deployment succeeds.
- [x] Record orchestrator evidence or blocker evidence.

## Final Status
- [x] Status: BLOCKED ON STRICT GATE
- [x] Theme revision complete
- [ ] Audit checklist fully green
- [ ] Vercel deployment complete
- [x] Orchestrator handoff complete
# end
