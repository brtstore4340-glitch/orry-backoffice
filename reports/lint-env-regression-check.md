# Lint Env Regression Check

## Exact command path

- `cwd`: `D:\01 Main Work\Boots\Agentic AI\mission-control\orry`
- `package.json` lint script before fix: `next lint`
- `package.json` lint script after fix: `eslint .`

## Module resolution evidence

- `next/package.json` resolved from:
  - `D:\01 Main Work\Boots\Agentic AI\mission-control\orry\node_modules\next\package.json`
- `eslint/package.json` resolved before fix from:
  - `D:\01 Main Work\Boots\Agentic AI\mission-control\node_modules\.pnpm\eslint@9.39.2_jiti@1.21.7\node_modules\eslint\package.json`
- `npm ls eslint @typescript-eslint/scope-manager --depth=3` from ORRY root returned an empty tree before fix.

## Env loading expectation

- The lint command does not depend on Next runtime env loading for the failure seen here.
- Repo env files exist at the ORRY root:
  - `.env`
  - `.env.local`
  - `.env.production.local`
- Current lint failure path was not caused by missing env files.

## Does this match the earlier env/path issue?

- `Yes, partially.` The primary defect was still path-related: lint was resolving outside the ORRY repo root because the repo had no local ESLint toolchain.
- `No, not as a pure env regression.` The current failing symptom was not an env-load problem. From the correct repo root, `next lint` failed with `Could not find config file.`

## Fix applied

- Added repo-local lint ownership:
  - local `eslint`
  - local `eslint-config-next`
- Replaced deprecated `next lint` wrapper with direct ESLint CLI: `eslint .`
- Added root `eslint.config.mjs` using `FlatCompat` so the installed `eslint-config-next` legacy config can run under ESLint 9.

## Why this was minimal-risk

- No broad package upgrade was performed.
- No framework migration was performed.
- The fix only touched the lint script, local lint config, and the minimum lint dependencies required to stop leaking into a parent workspace.

## Validation summary

- `npm run lint`: now runs from the ORRY repo and reports real source issues instead of crashing on wrapper/resolution failure.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
