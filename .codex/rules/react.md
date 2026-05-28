# React Rules

Apply this rule whenever work touches React components in ORRY.

## Stack Alignment

- React 19 + TypeScript
- Next.js App Router, not a standalone SPA router
- Existing styling comes from ORRY global CSS and local component classes, not Tailwind
- Prefer server components by default and client components only when interaction requires them

## Component Rules

- Keep components small and focused.
- Reuse shared pieces in `src/components/` before adding new abstractions.
- Prefer explicit props and domain types from `src/lib/types.ts` or nearby typed modules.
- Avoid `any`. Use exact types or `unknown`.
- Do not add a second component API style if the surrounding module already has a pattern.
- When a page mixes data loading and rendering, split reusable UI into components before creating a new global abstraction.

## ORRY-Specific Notes

- Preserve the dark premium ORRY UI language already in the repo.
- Do not introduce Flowaccount branding or unrelated third-party product language.
- Business components should use ORRY labels and document terminology already present in the codebase.
- If a route already has a page shell pattern, extend it instead of replacing it.
