# Dashboard Prompt Font Integration

## Scope reviewed

- Root font loading in `src/app/layout.tsx`
- Protected shell boundary in `src/app/(protected)/layout.tsx`
- Global typography tokens in `src/app/globals.css`
- Dashboard route boundary in `src/app/(protected)/dashboard/*`
- Dashboard UI styles and content in `src/components/dashboard/*` and `src/lib/dashboard/dashboard-data.ts`

## Commands run

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

## Decisions

- Kept font loading on the existing framework-native path with `next/font/google`.
- Centralized font loaders in `src/app/fonts.ts` instead of adding another one-off loader.
- Scoped Google Prompt to `/dashboard` with a dedicated route layout so the rest of the protected app is unchanged.
- Applied the dashboard font at the dashboard shell boundary and retained the existing sans font for Latin-heavy metrics and chart numerals to reduce visual drift.
- Replaced dashboard copy with Thai-facing labels so the Prompt integration is visibly exercised on live dashboard UI surfaces.

## Findings

- Existing global typography used `Plus Jakarta Sans` and `Cormorant Garamond` through CSS variables from the root layout.
- The protected layout does not own typography; it only wraps content with `AppShell`, so dashboard-specific font scoping is safe at the nested `/dashboard` route.
- The dashboard module previously inherited the global sans font and contained only English content, which would not satisfy the requirement to visibly render Thai text with Prompt.
- Several dashboard heading and label styles used aggressive tracking and tight line-height that were acceptable for Latin text but riskier for Thai. These were softened in the dashboard CSS module.

## Validation results

- `npx tsc --noEmit`: passed
- `npm run build`: passed
- `npm run lint`: failed with `Cannot find module './referencer'` from the repository's ESLint dependency chain under the parent `mission-control` node_modules path. This does not appear to be introduced by the dashboard font change.

## Remaining risks

- No browser runtime inspection was completed in this session, so visual verification is based on code-level review rather than live rendering.
- Prompt is currently scoped to `/dashboard` only. Expanding it to all protected Thai-facing screens should be a separate decision after visual review across those surfaces.
