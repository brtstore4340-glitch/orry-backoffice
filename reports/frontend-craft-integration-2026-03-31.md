# Frontend Craft Integration Report

> Date: 2026-03-31
> Repository: ORRY Serenity Kiss B2B Back Office
> Upstream source: `https://github.com/bovinphang/frontend-craft-codex`
> Upstream commit vendored: `bf9c598b24b5095bbfbcbc49a41f2e52527736e0`

## What Was Installed

- Project-local upstream snapshot under `.frontend-craft/`
- Selected frontend-craft skills copied into `.agents/skills/`
- Custom frontend-craft agents copied into `.codex/agents/`
- ORRY-specific project guidance added in `AGENTS.md`
- ORRY-specific Codex rules added in `.codex/rules/`
- ORRY-specific workflow skill added in `.codex/skills/orry-frontend-workflow/`
- Operator guide added in `docs/frontend-craft-operator-guide.md`

## Skills Installed For ORRY

- `accessibility-check`
- `frontend-code-review`
- `frontend-craft-review`
- `frontend-craft-scaffold`
- `implement-from-design`
- `nextjs-project-standard`
- `react-project-standard`
- `security-review`
- `test-and-fix`

## Agents Installed For ORRY

- `frontend-architect`
- `performance-optimizer`
- `ui-checker`
- `figma-implementer`
- `design-token-mapper`

## What Was Trimmed Or Left Out Of The Active ORRY Install

The upstream vendor snapshot still contains all original assets for traceability, but the active ORRY install intentionally did not copy these generic or irrelevant items into live skill paths:

- `vue3-project-standard`
- `nuxt-project-standard`
- `legacy-web-standard`
- `legacy-to-modern-migration`
- `monorepo-project-standard`
- `e2e-testing`
- `frontend-craft-init`
- Generic template rules that assumed pnpm, Vite, Tailwind, SPA folders, or unused i18n/CI defaults

## ORRY-Specific Customization

- Switched project guidance to npm and the actual `package-lock.json` workflow.
- Replaced generic template assumptions with ORRY’s real stack:
  - Next.js App Router
  - React 19
  - Prisma + PostgreSQL
  - Supabase-hosted Postgres and SSR helpers
  - ORRY-managed auth and approval logic
- Added ORRY-specific constraints for:
  - server-side auth and approval enforcement
  - environment safety and secret handling
  - bounded edits in a dirty worktree
  - preserving ORRY’s current premium dark UI language
  - avoiding Flowaccount or unrelated external branding
  - preserving deployability
- Rewrote the scaffold skill so it targets `src/app/`, `src/components/`, and `src/lib/` instead of generic `src/pages/` SPA scaffolding.
- Rewrote the validation skill so it uses ORRY’s actual available commands and honestly reports missing test infrastructure.
- Reframed the Next.js and agent instructions around ORRY’s route groups, document-heavy screens, and protected back-office workflows.

## Files Added Or Updated By The Integration

- `AGENTS.md`
- `.codex/config.toml`
- `.codex/config.toml.pre-frontend-craft.bak`
- `.codex/rules/react.md`
- `.codex/rules/design-system.md`
- `.codex/rules/testing.md`
- `.codex/rules/git-conventions.md`
- `.codex/rules/performance.md`
- `.codex/rules/api-layer.md`
- `.codex/rules/state-management.md`
- `.codex/rules/error-handling.md`
- `.codex/rules/naming-conventions.md`
- `.codex/rules/code-comments.md`
- `.codex/rules/refactoring.md`
- `.codex/rules/supabase-auth.md`
- `.codex/rules/orry-domain.md`
- `.codex/skills/orry-frontend-workflow/SKILL.md`
- `.agents/skills/accessibility-check/SKILL.md`
- `.agents/skills/frontend-code-review/SKILL.md`
- `.agents/skills/frontend-craft-review/SKILL.md`
- `.agents/skills/frontend-craft-scaffold/SKILL.md`
- `.agents/skills/implement-from-design/SKILL.md`
- `.agents/skills/nextjs-project-standard/SKILL.md`
- `.agents/skills/react-project-standard/SKILL.md`
- `.agents/skills/security-review/SKILL.md`
- `.agents/skills/test-and-fix/SKILL.md`
- `.codex/agents/frontend-architect.toml`
- `.codex/agents/performance-optimizer.toml`
- `.codex/agents/ui-checker.toml`
- `.codex/agents/figma-implementer.toml`
- `.codex/agents/design-token-mapper.toml`
- `docs/frontend-craft-operator-guide.md`
- `reports/frontend-craft-integration-2026-03-31.md`
- `.frontend-craft/` vendor snapshot

## Validation Notes

Validation was run after the integration and stayed isolated from unrelated application changes.

| Command | Result | Notes |
|---|---|---|
| `npm run lint` | Failed | `next lint` is deprecated and resolves a broken `@typescript-eslint` dependency chain from `D:\01 Main Work\Boots\Agentic AI\mission-control\node_modules`, ending with `Cannot find module './referencer'`. |
| `npx tsc --noEmit` | Passed | Explicit type-check completed successfully. |
| `npm run build` | Passed | `prisma generate && next build` completed successfully. Next.js still reports that lint and type validation are skipped during build because of current repo config. |

The integration itself was kept additive and isolated to project-local Codex/frontend-craft assets plus documentation.
