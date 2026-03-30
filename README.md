# ORRY Business Deck

ORRY back-office workspace for accounts, catalog, proposals, orders, billing, receipts, payments, and settings.

## Stack

- Next.js App Router
- Supabase Postgres via Prisma
- Supabase Auth sessions mapped to the ORRY user table
- ORRY-branded dark premium UI system

## Local bootstrap

1. Copy `.env.example` to `.env.local`
2. Fill the Supabase connection values and a strong `AUTH_SECRET`
3. Run your working Node/npm toolchain with:

```bash
npm install
npm run prisma:generate
npm run db:push
npm run prisma:seed
npm run dev
```

## Environment

Required in production:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_BASE_URL`
- `RESEND_API_KEY`
- `EMAIL_FROM`

Optional:

- `SUPABASE_STORAGE_BUCKET`
