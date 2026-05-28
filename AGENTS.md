# ORRY Serenity Kiss B2B Back Office

This repository is the ORRY Serenity Kiss B2B Back Office. Treat the existing ORRY codebase as the source of truth. Prefer bounded, additive changes that preserve deployability and fit the current Next.js App Router architecture.

## Project Baseline

- Language: TypeScript
- Package manager: npm (`package-lock.json` is authoritative)
- Framework: Next.js App Router on React 19
- Runtime data stack: Prisma + PostgreSQL, with Supabase-hosted Postgres and Supabase SSR helpers
- Auth model: ORRY-managed user/session workflow backed by Prisma `User`, approval gates, and ORRY security/audit logic
- Styling: ORRY-branded premium dark UI defined by the existing `src/app/globals.css` and current component patterns
- Operating system target: Windows + PowerShell first

## Read First

Before changing code, inspect:

1. `README.md`
2. `.codex/rules/`
3. `.codex/skills/orry-frontend-workflow/SKILL.md`
4. Existing ORRY domain skills:
   - `.codex/skills/orry-phase1-backoffice/SKILL.md`
   - `.codex/skills/supabase-orry-auth/SKILL.md`
5. The target feature files and adjacent modules

If the task touches UI, also inspect `src/app/globals.css`, `src/components/`, and the nearest existing route in `src/app/`.

## Common Commands

Prefer existing scripts. Do not invent replacements when a repo script already exists.

- Install: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Prisma generate: `npm run prisma:generate`
- Prisma migrate dev: `npm run prisma:migrate`
- Prisma deploy: `npm run prisma:deploy`
- Prisma seed: `npm run prisma:seed`
- DB push: `npm run db:push`
- Build: `npm run build`
- Ad hoc type-check fallback if needed: `npx tsc --noEmit`

Current repo note:

- There is no dedicated `test` script yet.
- There is no dedicated `type-check` script yet.
- `next.config.mjs` currently allows ignored build-time ESLint and TypeScript errors, so validation should be reported honestly instead of assuming production safety.

## Working Principles

- Keep changes narrow and reviewable.
- Reuse existing route, component, and utility patterns before introducing new structure.
- Prefer server-side enforcement for auth, approval, role, and sensitive business rules.
- Do not replace the ORRY visual language with unrelated branding, especially Flowaccount or any external product branding.
- Do not rewrite the application to fit a template.
- Preserve Windows and PowerShell compatibility for scripts and instructions.
- Save review or analysis outputs into `reports/`.
- If validation fails, leave the repo recoverable and explain what failed.

## ORRY-Specific Guardrails

- Respect ORRY Phase 1 rules:
  - stock changes only when shipment/receipt state truly warrants it
  - creators do not approve their own transactions
  - warehouse scope remains `MAIN / คลังหลัก` unless the repo is explicitly expanded
- Respect ORRY auth guardrails:
  - `User` in Prisma remains the current source of truth unless an explicit migration is requested
  - approval state and active state must be enforced server-side
  - forgot-password responses stay generic
  - do not claim Supabase Auth is the source of identity unless the code actually migrates to it
- Treat `.env*`, service-role keys, SMTP/API keys, and tokens as sensitive. Never print secrets into logs, reports, or UI.
- Keep production-safe behavior. Do not add fake data or demo UI unless it is clearly isolated and labeled.

## UI Workflow

When implementing or reviewing UI:

1. Inspect the nearest existing route and shared components first.
2. Reuse the current layout shell, spacing rhythm, and token-like variables before adding new styling primitives.
3. Keep responsive behavior consistent with the current app shell.
4. Cover loading, empty, error, disabled, hover, and focus states where relevant.
5. Avoid introducing a parallel design system or a second styling approach without a strong repo-backed reason.

## Validation Workflow

Use the smallest relevant validation set:

1. `npm run lint`
2. `npx tsc --noEmit` if type safety needs explicit confirmation
3. `npm run build` for deployability-sensitive changes

If a command is unavailable or fails because of pre-existing repository conditions, report that clearly and do not hide it by disabling checks.

## Reports

Write substantial review, audit, architecture, accessibility, security, or test-fix outputs to `reports/` as Markdown. Include:

- scope reviewed
- commands run
- findings or decisions
- remaining risks

## Frontend Craft Integration

Project-local frontend-craft assets live here:

- Vendor source: `.frontend-craft/`
- Installed workflow skills: `.agents/skills/`
- Installed custom agents: `.codex/agents/`
- ORRY project rules: `.codex/rules/`

Use the ORRY-specific rules in this repo ahead of generic upstream defaults.
