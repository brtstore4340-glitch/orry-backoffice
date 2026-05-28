# Supabase And Auth Rules

Apply this rule for auth, session, user management, protected routes, email delivery, and env handling.

## Current Reality

- Supabase currently hosts Postgres and SSR/session helpers.
- Prisma `User` remains the current identity source of truth.
- Approval gating, active flags, password reset, and audit/security logging are ORRY-managed concerns.

## Rules

- Do not claim a migration to native Supabase Auth unless the repo truly performs it.
- Keep auth checks server-side.
- Keep forgot-password responses generic.
- Never expose service-role credentials to client code.
- Verify sensitive env usage before claiming a flow works in production.
- Preserve existing auth page structure and styling where possible.
