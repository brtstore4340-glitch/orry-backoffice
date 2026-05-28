---
name: orry-frontend-workflow
description: ORRY-specific frontend workflow guardrails for Next.js App Router, Prisma, Supabase-backed auth, and the existing dark premium back-office UI. Use when implementing, reviewing, or scoping ORRY frontend work so future Codex runs stay aligned with this repo.
---

# ORRY Frontend Workflow

Use this skill for ORRY frontend work in this repository.

## Read First

1. `AGENTS.md`
2. `.codex/rules/`
3. The closest route in `src/app/`
4. The nearest shared components in `src/components/`

Also load these ORRY-specific skills when relevant:

- `orry-phase1-backoffice`
- `supabase-orry-auth`

## Workflow

1. Inspect the existing implementation before proposing structure changes.
2. Keep edits bounded to the affected route, component, and supporting `src/lib/*` modules.
3. Reuse existing UI patterns and ORRY terminology.
4. Keep auth, approval, and sensitive business rules on the server.
5. Validate with the smallest relevant commands already available in the repo.
6. Save substantial analysis or review outputs into `reports/`.

## Hard Constraints

- Do not rewrite the app around a generic template.
- Do not add Flowaccount branding or unrelated external branding.
- Do not claim production safety if lint, type checks, or build status is unknown.
- Do not weaken deployability to make a change appear complete.
