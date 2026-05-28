ALTER TABLE "company_branches"
  ADD COLUMN IF NOT EXISTS "is_head_office" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "company_tax_profiles"
  ADD COLUMN IF NOT EXISTS "branch_id" TEXT;

DO $orry$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'company_tax_profiles_branch_id_fkey'
  ) THEN
    ALTER TABLE "company_tax_profiles"
      ADD CONSTRAINT "company_tax_profiles_branch_id_fkey"
      FOREIGN KEY ("branch_id") REFERENCES "company_branches"("id") ON DELETE SET NULL;
  END IF;
END
$orry$;

DO $orry$
BEGIN
  ALTER TABLE "documents"
    ADD COLUMN IF NOT EXISTS "module_code" TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END
$orry$;

INSERT INTO "company_branches" (
  "id",
  "company_profile_id",
  "code",
  "name",
  "tax_branch_code",
  "is_head_office",
  "phone",
  "email",
  "address",
  "zip_code",
  "active",
  "created_at",
  "updated_at"
)
SELECT
  CONCAT(cp."id", '_main_branch'),
  cp."id",
  COALESCE(NULLIF(cp."branchCode", ''), 'HEAD'),
  COALESCE(NULLIF(cp."branchName", ''), 'สำนักงานใหญ่'),
  COALESCE(NULLIF(cp."branchCode", ''), '00000'),
  TRUE,
  cp."phone",
  cp."email",
  cp."address",
  cp."zipCode",
  TRUE,
  COALESCE(cp."createdAt", CURRENT_TIMESTAMP),
  CURRENT_TIMESTAMP
FROM "company_profiles" cp
WHERE NOT EXISTS (
  SELECT 1
  FROM "company_branches" cb
  WHERE cb."company_profile_id" = cp."id"
)
ON CONFLICT ("company_profile_id", "code") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "tax_branch_code" = COALESCE(EXCLUDED."tax_branch_code", "company_branches"."tax_branch_code"),
  "is_head_office" = TRUE,
  "phone" = COALESCE(EXCLUDED."phone", "company_branches"."phone"),
  "email" = COALESCE(EXCLUDED."email", "company_branches"."email"),
  "address" = COALESCE(EXCLUDED."address", "company_branches"."address"),
  "zip_code" = COALESCE(EXCLUDED."zip_code", "company_branches"."zip_code"),
  "updated_at" = CURRENT_TIMESTAMP;

UPDATE "company_branches"
SET "is_head_office" = TRUE
WHERE "tax_branch_code" = '00000'
   OR "code" IN ('HEAD', 'MAIN');

WITH default_branch AS (
  SELECT DISTINCT ON (cb."company_profile_id")
    cb."company_profile_id",
    cb."id",
    cb."tax_branch_code"
  FROM "company_branches" cb
  ORDER BY cb."company_profile_id", cb."is_head_office" DESC, cb."created_at" ASC, cb."code" ASC
)
UPDATE "company_tax_profiles" ctp
SET
  "branch_id" = db."id",
  "branch_code" = COALESCE(NULLIF(ctp."branch_code", ''), db."tax_branch_code", '00000'),
  "updated_at" = CURRENT_TIMESTAMP
FROM default_branch db
WHERE ctp."company_profile_id" = db."company_profile_id"
  AND ctp."branch_id" IS NULL;

WITH default_branch AS (
  SELECT DISTINCT ON (cb."company_profile_id")
    cb."company_profile_id",
    cb."id"
  FROM "company_branches" cb
  ORDER BY cb."company_profile_id", cb."is_head_office" DESC, cb."created_at" ASC, cb."code" ASC
)
UPDATE "documents" d
SET "branch_id" = db."id"
FROM default_branch db
WHERE d."company_profile_id" = db."company_profile_id"
  AND d."branch_id" IS NULL;

UPDATE "documents"
SET "module_code" = CASE
  WHEN "document_type" = 'PROPOSAL' THEN 'QUOTATION'
  WHEN "document_type" = 'RECEIPT' THEN 'RECEIPT'
  WHEN "document_type" = 'EXPENSE' THEN 'EXPENSE'
  WHEN "document_type" = 'PURCHASE_ORDER' THEN 'PURCHASE_ORDER'
  WHEN "document_type" = 'SALES_ORDER' THEN 'SALES_ORDER'
  WHEN "document_type" = 'BILLING_RECORD' THEN CASE
    WHEN "document_number" LIKE 'CIV-%' OR "document_number" LIKE 'CI-%' THEN 'CASH_INVOICE'
    WHEN "document_number" LIKE 'TIV-%' OR "document_number" LIKE 'TAX-%' THEN 'TAX_INVOICE'
    ELSE 'BILLING_NOTE'
  END
  ELSE "module_code"
END
WHERE "module_code" IS NULL;

CREATE INDEX IF NOT EXISTS "documents_module_code_idx" ON "documents" ("module_code");
CREATE INDEX IF NOT EXISTS "company_tax_profiles_branch_id_idx" ON "company_tax_profiles" ("branch_id");
