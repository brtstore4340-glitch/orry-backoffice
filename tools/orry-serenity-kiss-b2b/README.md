# ORRY Serenity Kiss B2B

Lean luxury back-office preview for ORRY Serenity Kiss B2B.

## Stack

- Vite 6
- React 19
- TypeScript
- Tailwind CSS v4 via `@tailwindcss/vite`
- `lucide-react` icons
- `motion` for subtle UI transitions

## Scope

This package is a static front-end preview under the parent ORRY repository:

`tools/orry-serenity-kiss-b2b/`

It does not currently connect to Supabase, Prisma, or any live backend. The login screen is a local preview gate only; production auth and approval rules must be implemented server-side before this is treated as a real back office.

## Run locally

```bash
npm install
npm run dev
```

Default dev server: `http://localhost:3000`

## Validate

```bash
npm run lint
npm run build
```

## Deployment notes

- Build command: `npm run build`
- Output directory: `dist`
- No client-side API key is required.
- Do not add service-role keys or private API tokens to Vite `define` values; they would be bundled into browser code.
