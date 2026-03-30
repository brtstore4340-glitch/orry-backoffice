# ORRY Supabase

This directory is the local Supabase project scaffold for ORRY.

Current scope:
- `config.toml` defines the local Supabase project layout and points at the ORRY project ref.
- `migrations/` mirrors the current Prisma migration history so Supabase CLI workflows can start from the same schema baseline.
- `migrations/202603290005_auth_storage_policies.sql` adds ORRY-specific helper functions, RLS policies, and a private `orry-documents` storage bucket.
- `seed.sql` provides baseline ORRY roles, document counters, company profile, and a primary bank account.
- `functions/` is reserved for ORRY edge functions if they are added later.

Recommended next steps when the CLI is available:

1. Link the project:
   `supabase link --project-ref <project-ref>`
2. Compare local SQL migrations with the remote database before applying anything:
   `supabase db diff` or `supabase migration list`
3. Add new Supabase SQL migrations here only for changes that should be owned by Supabase CLI going forward.
4. Add edge functions only if ORRY needs server-side jobs or webhooks outside Next.js.
5. If the app should use Supabase Storage immediately, set `SUPABASE_STORAGE_BUCKET=orry-documents` in the runtime environment.

Notes:
- ORRY already uses Prisma migrations under `prisma/migrations`; the files in `supabase/migrations` were copied from that history to keep both tracks aligned.
- Do not push these migrations to a live project blindly. Verify remote state first so you do not re-apply schema that already exists.
- Current policies assume browser-side Supabase access should be limited to approved users, while most application data mutations still run through server-side Prisma or the service-role client.
