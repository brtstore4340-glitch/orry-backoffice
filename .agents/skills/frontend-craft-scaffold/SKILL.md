---
name: frontend-craft-scaffold
description: Create ORRY-aligned page, feature, or component scaffolding for this Next.js App Router repository. Use when a user wants a new route, business module, or shared component without rewriting the existing app structure.
---

# ORRY Frontend Scaffold

Create new frontend structure that matches ORRY instead of generic SPA folders.

## Required Inputs

Parse:

- `type`: `page` | `feature` | `component`
- `name`: requested module name

If the request is ambiguous, infer the safest ORRY-aligned target from surrounding routes before asking for clarification.

## Repository Alignment

- This repo uses Next.js App Router under `src/app/`.
- Shared UI lives in `src/components/`.
- Business and data helpers live in `src/lib/`.
- Use npm-oriented commands and current ORRY patterns.
- Do not scaffold `src/pages/`, Vue files, Tailwind-only shells, or generic `services/request` layers that do not exist here.

## Scaffold Rules

### `page`

- Put new routes under the relevant App Router segment in `src/app/`.
- Prefer matching existing route groups such as `(auth)` or `(protected)`.
- Reuse existing page shell and headers where possible.
- If the route needs supporting UI, create local components only when the route would otherwise become hard to read.

### `feature`

- For reusable business logic, prefer a focused module in `src/lib/` or a route-adjacent helper file.
- Create only the files that the requested feature actually needs.
- Keep domain vocabulary aligned to ORRY documents, contacts, inventory, billing, or settings terminology.

### `component`

- Place shared UI in `src/components/<area-or-name>/`.
- Match the surrounding file naming and styling pattern.
- Do not create empty test folders by default because the repo has no active frontend test harness yet.

## Hard Constraints

- Do not create scaffolding that conflicts with App Router.
- Do not generate fake demo business flows.
- Do not introduce a second design system or unrelated branding.
- Keep changes additive and minimal.

## Output

After scaffolding:

- list created files
- explain how the structure fits the existing ORRY layout
- note any follow-up validation command that should run
