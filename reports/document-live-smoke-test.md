# Document Live Smoke Test

## Scope

Single authenticated quotation flow after repairing seeded password hashes.

## Runtime method

- Local Next.js runtime
- Browser-like multipart form posts via `curl.exe`
- Cookie-backed authenticated session

## Live verified

- Login with `admin@orry.local` / `demo-admin` succeeded.
- `POST /login` returned `303` to `/dashboard`.
- Opening `/documents/quotations/new` succeeded.
- Draft creation succeeded.
- `POST /documents/quotations/new` returned canonical redirect to:
  - `/documents/quotations/<id>`
- The created quotation detail page opened successfully.

## Exact breakpoints encountered

### 1. Seeded credentials data issue

- Initial live login failure was not a route bug.
- Root cause:
  - `User.passwordHash` for `admin@orry.local` and `finance@orry.local` was `null` in the active database.
- Repair applied:
  - updated the two demo users with password hashes for:
    - `demo-admin`
    - `demo-finance`

### 2. Missing seed data for authoring dependencies

- After draft creation, the quotation detail page initially rendered:
  - line update form: present
  - contact select form: absent
  - product add form: absent
- Root cause:
  - active database had:
    - `contacts = 0`
    - `products = 0`
- Repair applied:
  - inserted one customer contact
  - inserted one product

### 3. Environment/runtime blocker on final full rerun

- After the seed-data repair, repeated cold-start live reruns of `next dev` failed due local process memory exhaustion:
  - `FATAL ERROR: Zone Allocation failed - process out of memory`
- This blocked a final complete runtime pass for:
  - contact change submit
  - product add submit
  - final totals/list persistence confirmation

## Additional notes

- A temporary false `/login` redirect during automation was caused by the smoke driver selecting the sidebar logout form action instead of the create-draft form. That was a test harness issue, not an app defect.
- The detail page HTML showed no line deletion control in the current UI.

## Commands used

- local `next dev`
- targeted `curl.exe` form submissions
- targeted Prisma/DB inspection via `npx tsx -`

## Outcome

- Confirmed live:
  - auth works with repaired seeded credentials
  - quotation draft creation works
  - canonical redirect to quotation detail works
- Not fully confirmed end-to-end in one final pass because the local dev runtime became unstable from out-of-memory failures after the seed-data repair.
