# API Layer Rules

Use this rule for API routes, server actions, database access, and data boundaries.

## Architecture

- In this repo, data access usually belongs in server components, server actions, `src/lib/*`, Prisma queries, or route handlers under `src/app/api/`.
- Keep database logic and permission checks out of presentational components.
- Prefer typed domain functions in `src/lib/` over ad hoc queries scattered through routes and components.

## Security Boundaries

- Enforce auth, role checks, approval checks, and sensitive business rules server-side.
- Never expose service-role credentials or direct privileged database access to the client.
- Treat form validation on the client as UX only. The server must validate again.
- Sensitive operations should record security or audit events when the surrounding feature already does so.

## Error Handling

- Return safe, user-appropriate messages.
- Do not leak stack traces, tokens, SQL details, or account existence in user-facing responses.
- Keep route handlers and server actions explicit about failure cases and redirects.
