# Lint Root Cause

## Exact cause

The current lint failure was caused by a repo-local lint toolchain gap, which let module resolution leak outside the ORRY repo root.

- `package.json` used the deprecated `next lint` wrapper.
- The ORRY repo had no local ESLint config file.
- The ORRY repo had no local `eslint` package installed.
- As a result, `eslint` resolved from a parent workspace path:
  - `D:\01 Main Work\Boots\Agentic AI\mission-control\node_modules\.pnpm\eslint@9.39.2_jiti@1.21.7\node_modules\eslint\package.json`

That proved the failure path was not a clean, self-contained ORRY lint execution.

## Package/config files involved

- `package.json`
- `package-lock.json`
- `eslint.config.mjs`

## Fix applied

- Changed lint script from `next lint` to `eslint .`
- Added local dev dependencies:
  - `eslint@^9.39.1`
  - `eslint-config-next@15.5.14`
- Added `eslint.config.mjs` and wrapped `eslint-config-next` with `FlatCompat` for ESLint 9 compatibility

## Why this was the minimum-risk fix

- It fixed the primary root defect first: parent-workspace resolution leakage.
- It avoided broad package churn.
- It avoided changing application code just to suppress lint.
- It preserved type-check and build behavior.

## Current status after fix

- The repo-level lint crash is fixed.
- `npm run lint` now runs and reports real code issues in the repository.
- Remaining lint failures are source-level findings, primarily existing `@typescript-eslint/no-explicit-any` violations, not toolchain-resolution failures.
