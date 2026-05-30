DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LedgerAccountType') THEN
    CREATE TYPE "LedgerAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "general_ledger_accounts" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "type" "LedgerAccountType" NOT NULL,
  "balance" NUMERIC(14,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "journal_entries" (
  "id" TEXT PRIMARY KEY,
  "journal_number" TEXT NOT NULL UNIQUE,
  "account_id" TEXT NOT NULL REFERENCES "general_ledger_accounts"("id") ON DELETE RESTRICT,
  "description" TEXT NOT NULL,
  "debit" NUMERIC(14,2) NOT NULL DEFAULT 0,
  "credit" NUMERIC(14,2) NOT NULL DEFAULT 0,
  "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
  "created_by_id" TEXT,
  "posted_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
