# ORRY deploy/status check — 2026-05-28 04:46 +07

## Scope
Read-first inspection of `/mnt/d/01 Main Work/Boots/Agentic AI/mission-control/orry` to determine Vercel production status and smoke the live app against routes defined in the repo.

## Repo context
- Repo path: `/mnt/d/01 Main Work/Boots/Agentic AI/mission-control/orry`
- Git remote: `origin https://github.com/brtstore4340-glitch/orry-backoffice.git`
- Branch: `waste`
- Working tree: heavily dirty before this task; no app code changed by this check.

## Files inspected
- `package.json`
- `next.config.mjs`
- `.vercel/project.json`
- `.vercelignore`
- `src/app/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/auth/login/page.tsx`
- `src/app/(protected)/users/page.tsx`
- `src/app/(protected)/admin/users/page.tsx`
- `src/middleware.ts`
- `src/lib/orry-labels.ts`

## Key local findings
1. App shape
   - Next.js app router project.
   - Scripts include `dev`, `build`, `start`, `lint`, Prisma commands.
   - `vercel` is installed in repo dependencies.
2. Vercel link
   - `.vercel/project.json` points at project name `orry-serenity-erp`.
3. Route clues from repo
   - `/` redirects to `/dashboard` when authenticated, otherwise `/login`.
   - `/auth/login` redirects to `/login`.
   - `/users` redirects to `/admin/users`.
   - `/admin/users` exists as an ADMIN-only page.
   - Navigation labels reference `/admin/users` and `/admin/approvals`.
4. Build config risk
   - `next.config.mjs` sets `eslint.ignoreDuringBuilds = true` and `typescript.ignoreBuildErrors = true`.

## Vercel status probes run
Commands run from repo root:
- `pwd`
- `git rev-parse --show-toplevel`
- `git remote -v`
- `git status --short --branch`
- local presence probe for `.vercel/project.json`, `node_modules/.bin/vercel`, `~/.vercel/auth.json`, `VERCEL_TOKEN`
- `./node_modules/.bin/vercel whoami`
- `./node_modules/.bin/vercel inspect https://orry-serenity-erp.vercel.app`
- `./node_modules/.bin/vercel ls orry-serenity-erp`
- HTTP smoke probes against `https://orry-serenity-erp.vercel.app`

## Vercel status result
- Effective CLI context exists: `vercel whoami` returned user/context `e0993599799`.
- Alias inspected: `https://orry-serenity-erp.vercel.app`
- `vercel inspect` result:
  - project: `orry-serenity-erp`
  - target: `production`
  - status: `Ready`
  - created: `Wed May 27 2026 20:11:16 GMT+0700` (about 9 hours old at inspection time)
- `vercel ls orry-serenity-erp` result:
  - newest visible production deployments at 3h and 6h show `UNKNOWN`
  - older deployments at 9h and 10h show `Ready`
  - current live alias inspection resolves to the 9h `Ready` deployment

## Smoke results against live alias
Base alias tested: `https://orry-serenity-erp.vercel.app`

| Path from repo expectation | Expected from code | Live result | Verdict |
|---|---|---|---|
| `/` | redirect to `/login` or `/dashboard` | `200`, final URL `/setup`, title `ORRY Serenity ERP` | mismatch |
| `/login` | login page | `200`, final URL `/setup`, title `ORRY Serenity ERP` | mismatch |
| `/auth/login` | redirect to `/login` | `404` | mismatch |
| `/dashboard` | protected dashboard | `200`, final URL `/setup` | mismatch |
| `/admin/users` | admin page (auth/role gated) | `404` | mismatch |
| `/admin/approvals` | admin approval page (auth/role gated) | `404` | mismatch |

Additional page proof from live `/setup`:
- HTML title: `ORRY Serenity ERP`
- H1: `ORRY Serenity Setup & Bootstrap`

## Interpretation
The production alias is live, but the served application does not match the route structure in the current repo checkout:
- the repo has no `/setup` route in `src/app`
- live root/login/dashboard all land on `/setup`
- repo-defined admin routes return `404` on the live alias
- `vercel inspect` build output references locale-based routes (`[locale]`, `[locale]/accounting`, etc.), which also does not match the current repo’s top-level route shape

This strongly suggests one of:
1. the Vercel project is linked to a different codebase/build output than this checkout, or
2. the live production alias is serving an older/other app state than the current repo implies, or
3. newer production deployment attempts are not promoting cleanly (`UNKNOWN` rows), leaving the alias on an older ready deployment.

## Governor-ready status
- Deployed or not: `DEPLOYED`, but not matching the currently inspected repo routes.
- Latest blocker: production alias behavior is inconsistent with repo-defined login/admin flows; newer production rows show `UNKNOWN` while the live alias stays on an older `Ready` deployment.
- Admin login route from code: there is no separate admin login route; admin flows rely on the standard `/login` route, then `/admin/users` and `/admin/approvals` behind auth/role checks.
- Smoke/admin result: `/login` goes to `/setup`; `/admin/users` and `/admin/approvals` return `404` on the live alias.

## Risks
- Because the repo working tree is already very dirty, deployment provenance is hard to trust from local git state alone.
- The local project link may be correct by name but still not represent the same application currently expected from the repo.
- Build-time lint/type ignores increase the chance of silent production divergence.

## Secret-scan statement
- No secrets were printed into this report.
- No env values, tokens, cookies, org IDs, or project IDs are quoted here beyond the non-secret public project name and public alias.
- No source files were modified during the deploy check.

## Rollback path
No rollback performed. If the human decides to remediate later, the safe rollback path is Vercel dashboard rollback/re-promote of the last known-good deployment after first confirming which repo/build actually owns `orry-serenity-erp`.

## Recommended next action
1. Confirm whether `orry-serenity-erp` on Vercel is supposed to serve this repo checkout.
2. Inspect deployment provenance/commit mapping in Vercel dashboard for the live `Ready` deployment and the newer `UNKNOWN` deployments.
3. If this repo is the intended owner, reconcile why current code expects `/login` and `/admin/*` while live production serves `/setup` and locale-shaped output.