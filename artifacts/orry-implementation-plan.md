# ORRY Implementation Plan

## Architecture Direction

- Keep the existing Next.js App Router project.
- Rebuild the data model around ORRY documents instead of the earlier inventory-only scope.
- Use Prisma as the typed data layer against Supabase Postgres.
- Keep authentication protected with Auth.js credentials backed by the ORRY `User` table so the app works without extra network installs in this environment.
- Make every major screen dark, premium, and operational rather than template-like.

## Planned Code Work

1. Replace the Prisma schema with:
   - users / roles
   - company profile / bank account
   - contacts
   - products / warehouse balances
   - business documents
   - document lines
   - payments
   - attachments
   - references
   - activities

2. Replace seed data with ORRY-branded demo records:
   - legal profile
   - bank account
   - roles and users
   - accounts
   - products
   - mixed document set
   - payments and activity entries

3. Replace the current app shell and theme:
   - dark navy / graphite base
   - electric blue lighting
   - soft glass/neumorphic panels
   - mobile-commerce inspired control surfaces

4. Add protected routes:
   - `/dashboard`
   - `/contacts`
   - `/catalog`
   - `/proposals`
   - `/orders`
   - `/billing`
   - `/receipts`
   - `/payments`
   - `/settings`
   - `/documents/[id]`

5. Add repository and action layers:
   - list summaries
   - status transition action
   - account creation action
   - fallback data when DB is unavailable

6. Add Supabase-ready setup:
   - datasource URLs in Prisma
   - `.env.example` / `.env.sample` refresh
   - SQL migration artifact
   - storage/auth placeholders documented in settings and final report

## Rejection Boundaries

- Do not surface source-brand strings in the ORRY app, metadata, or new artifacts.
- Do not keep the beige/orange visual system.
- Do not leave the app inventory-only.
- Do not hardcode secrets.
