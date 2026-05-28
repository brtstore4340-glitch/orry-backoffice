CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $orry$
BEGIN
  ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
  ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'SENT';
  ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
  ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_PAID';
  ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'OVERDUE';
  ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_RECEIVED';
  ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'RECEIVED';
  ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$orry$;

CREATE TABLE IF NOT EXISTS "roles" (
  "id" TEXT PRIMARY KEY,
  "code" "RoleCode" NOT NULL UNIQUE,
  "name" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_accounts" (
  "id" TEXT PRIMARY KEY,
  "authUserId" TEXT UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT,
  "name" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "employeeId" TEXT UNIQUE,
  "dateOfBirth" TIMESTAMP,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "approvalStatus" "UserApprovalStatus" NOT NULL DEFAULT 'APPROVED',
  "approvedAt" TIMESTAMP,
  "rejectedAt" TIMESTAMP,
  "roleId" TEXT NOT NULL REFERENCES "roles"("id"),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "password_reset_logs" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user_accounts"("id") ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP NOT NULL,
  "consumedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "company_profiles" (
  "id" TEXT PRIMARY KEY,
  "displayName" TEXT NOT NULL,
  "legalName" TEXT NOT NULL,
  "legalNameEn" TEXT,
  "taxId" TEXT,
  "branchName" TEXT,
  "branchCode" TEXT,
  "vatRegistered" BOOLEAN NOT NULL DEFAULT TRUE,
  "defaultCurrency" TEXT NOT NULL DEFAULT 'THB',
  "phone" TEXT,
  "mobile" TEXT,
  "email" TEXT,
  "website" TEXT,
  "address" TEXT,
  "addressEn" TEXT,
  "zipCode" TEXT,
  "logoPath" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "company_branches" (
  "id" TEXT PRIMARY KEY,
  "company_profile_id" TEXT NOT NULL REFERENCES "company_profiles"("id") ON DELETE CASCADE,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tax_branch_code" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "zip_code" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("company_profile_id", "code")
);

CREATE TABLE IF NOT EXISTS "company_tax_profiles" (
  "id" TEXT PRIMARY KEY,
  "company_profile_id" TEXT NOT NULL REFERENCES "company_profiles"("id") ON DELETE CASCADE,
  "tax_id" TEXT,
  "vat_registered" BOOLEAN NOT NULL DEFAULT TRUE,
  "default_vat_percent" NUMERIC(5,2) NOT NULL DEFAULT 7,
  "withholding_percent" NUMERIC(5,2) NOT NULL DEFAULT 3,
  "branch_code" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "payment_channels" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "bank_accounts" (
  "id" TEXT PRIMARY KEY,
  "companyProfileId" TEXT NOT NULL REFERENCES "company_profiles"("id") ON DELETE CASCADE,
  "paymentChannelId" TEXT REFERENCES "payment_channels"("id") ON DELETE SET NULL,
  "bankName" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "branch" TEXT,
  "swiftCode" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "bank_account_mappings" (
  "id" TEXT PRIMARY KEY,
  "bank_account_id" TEXT NOT NULL REFERENCES "bank_accounts"("id") ON DELETE CASCADE,
  "payment_channel_id" TEXT REFERENCES "payment_channels"("id") ON DELETE SET NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "contacts" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "type" "ContactType" NOT NULL,
  "displayName" TEXT NOT NULL,
  "legalName" TEXT,
  "taxId" TEXT,
  "branchName" TEXT,
  "contactPerson" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "mobile" TEXT,
  "address" TEXT,
  "zipCode" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "contact_addresses" (
  "id" TEXT PRIMARY KEY,
  "contact_id" TEXT NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
  "label" TEXT,
  "line1" TEXT NOT NULL,
  "line2" TEXT,
  "district" TEXT,
  "province" TEXT,
  "zip_code" TEXT,
  "country" TEXT DEFAULT 'TH',
  "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "contact_tax_info" (
  "id" TEXT PRIMARY KEY,
  "contact_id" TEXT NOT NULL UNIQUE REFERENCES "contacts"("id") ON DELETE CASCADE,
  "tax_id" TEXT,
  "branch_code" TEXT,
  "branch_name" TEXT,
  "vat_registered" BOOLEAN NOT NULL DEFAULT FALSE,
  "withholding_rate" NUMERIC(5,2) NOT NULL DEFAULT 3,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "warehouses" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "product_categories" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "product_units" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "symbol" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "price_books" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'THB',
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "products" (
  "id" TEXT PRIMARY KEY,
  "sku" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "kind" "ProductKind" NOT NULL,
  "categoryId" TEXT REFERENCES "product_categories"("id") ON DELETE SET NULL,
  "unitId" TEXT REFERENCES "product_units"("id") ON DELETE SET NULL,
  "description" TEXT,
  "barcode" TEXT UNIQUE,
  "unitLabel" TEXT NOT NULL DEFAULT 'unit',
  "unitPrice" NUMERIC(12,2) NOT NULL,
  "cost" NUMERIC(12,2) NOT NULL,
  "stockOnHand" INTEGER NOT NULL DEFAULT 0,
  "reorderPoint" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "inventory_balances" (
  "id" TEXT PRIMARY KEY,
  "warehouseId" TEXT NOT NULL REFERENCES "warehouses"("id") ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("warehouseId", "productId")
);

CREATE TABLE IF NOT EXISTS "document_counters" (
  "id" TEXT PRIMARY KEY,
  "kind" "DocumentKind" NOT NULL UNIQUE,
  "prefix" TEXT NOT NULL,
  "lastNumber" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "documents" (
  "id" TEXT PRIMARY KEY,
  "document_number" TEXT NOT NULL UNIQUE,
  "document_type" "DocumentKind" NOT NULL,
  "document_status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
  "contact_id" TEXT REFERENCES "contacts"("id") ON DELETE SET NULL,
  "owner_id" TEXT REFERENCES "user_accounts"("id") ON DELETE SET NULL,
  "company_profile_id" TEXT REFERENCES "company_profiles"("id") ON DELETE SET NULL,
  "branch_id" TEXT REFERENCES "company_branches"("id") ON DELETE SET NULL,
  "warehouse_id" TEXT REFERENCES "warehouses"("id") ON DELETE SET NULL,
  "issued_at" TIMESTAMP NOT NULL,
  "due_at" TIMESTAMP,
  "credit_days" INTEGER NOT NULL DEFAULT 0,
  "payment_term_label" TEXT,
  "sales_owner_name" TEXT,
  "project_name" TEXT,
  "reference_code" TEXT,
  "notes" TEXT,
  "internal_notes" TEXT,
  "tax_inclusive" BOOLEAN NOT NULL DEFAULT FALSE,
  "discount_percent" NUMERIC(5,2) NOT NULL DEFAULT 0,
  "discount_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "subtotal_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "total_after_discount_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "vat_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "vat_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "withholding_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "withholding_percent" NUMERIC(5,2) NOT NULL DEFAULT 0,
  "withholding_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "deduction_label" TEXT,
  "deduction_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "total_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "share_token" TEXT UNIQUE,
  "shared_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "document_lines" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "product_id" TEXT REFERENCES "products"("id") ON DELETE SET NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "unit_label" TEXT NOT NULL DEFAULT 'unit',
  "quantity" NUMERIC(12,2) NOT NULL,
  "unit_price" NUMERIC(12,2) NOT NULL,
  "discount_percent" NUMERIC(5,2) NOT NULL DEFAULT 0,
  "tax_percent" NUMERIC(5,2) NOT NULL DEFAULT 7,
  "line_total" NUMERIC(12,2) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "payments_received" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "actor_id" TEXT REFERENCES "user_accounts"("id") ON DELETE SET NULL,
  "direction" "PaymentDirection" NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "amount" NUMERIC(12,2) NOT NULL,
  "paid_at" TIMESTAMP NOT NULL,
  "reference_number" TEXT,
  "note" TEXT,
  "bank_account_id" TEXT REFERENCES "bank_accounts"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "payments_paid" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "actor_id" TEXT REFERENCES "user_accounts"("id") ON DELETE SET NULL,
  "method" "PaymentMethod" NOT NULL,
  "amount" NUMERIC(12,2) NOT NULL,
  "paid_at" TIMESTAMP NOT NULL,
  "reference_number" TEXT,
  "note" TEXT,
  "bank_account_id" TEXT REFERENCES "bank_accounts"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "document_attachments" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "fileName" TEXT NOT NULL,
  "storage_bucket" TEXT,
  "storage_path" TEXT NOT NULL,
  "mimeType" TEXT,
  "fileSize" INTEGER,
  "uploaded_by_id" TEXT REFERENCES "user_accounts"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "document_references" (
  "id" TEXT PRIMARY KEY,
  "source_document_id" TEXT NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "target_document_id" TEXT NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "type" "DocumentReferenceType" NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("source_document_id", "target_document_id", "type")
);

CREATE TABLE IF NOT EXISTS "security_events" (
  "id" TEXT PRIMARY KEY,
  "actorId" TEXT REFERENCES "user_accounts"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL DEFAULT TRUE,
  "targetType" TEXT,
  "targetId" TEXT,
  "detail" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "metadataJson" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "document_events" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "actor_id" TEXT REFERENCES "user_accounts"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "detail" TEXT,
  "event_type" TEXT,
  "metadata_json" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "document_status_history" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "from_status" "DocumentStatus",
  "to_status" "DocumentStatus" NOT NULL,
  "changed_by_id" TEXT REFERENCES "user_accounts"("id") ON DELETE SET NULL,
  "note" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "document_email_logs" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "sent_to" TEXT NOT NULL,
  "subject" TEXT,
  "body_preview" TEXT,
  "provider_message_id" TEXT,
  "status" TEXT NOT NULL,
  "sent_at" TIMESTAMP,
  "opened_at" TIMESTAMP,
  "failed_at" TIMESTAMP,
  "error_message" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "document_share_logs" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "shared_by_id" TEXT REFERENCES "user_accounts"("id") ON DELETE SET NULL,
  "share_token" TEXT,
  "channel" TEXT NOT NULL,
  "shared_to" TEXT,
  "message" TEXT,
  "shared_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clicked_at" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "accounting_lock_periods" (
  "id" TEXT PRIMARY KEY,
  "period_name" TEXT NOT NULL,
  "starts_at" TIMESTAMP NOT NULL,
  "ends_at" TIMESTAMP,
  "locked" BOOLEAN NOT NULL DEFAULT TRUE,
  "reason" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "inventory_receipts" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT REFERENCES "documents"("id") ON DELETE SET NULL,
  "purchase_order_id" TEXT,
  "warehouse_id" TEXT NOT NULL REFERENCES "warehouses"("id") ON DELETE CASCADE,
  "receipt_number" TEXT NOT NULL UNIQUE,
  "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
  "received_at" TIMESTAMP,
  "notes" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "inventory_receipt_lines" (
  "id" TEXT PRIMARY KEY,
  "inventory_receipt_id" TEXT NOT NULL REFERENCES "inventory_receipts"("id") ON DELETE CASCADE,
  "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "quantity" NUMERIC(12,2) NOT NULL,
  "unit_cost" NUMERIC(12,2) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "inventory_movements" (
  "id" TEXT PRIMARY KEY,
  "warehouse_id" TEXT NOT NULL REFERENCES "warehouses"("id") ON DELETE CASCADE,
  "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "movement_type" TEXT NOT NULL,
  "quantity" NUMERIC(12,2) NOT NULL,
  "reference_type" TEXT,
  "reference_id" TEXT,
  "occurred_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "billing_note_links" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "source_document_id" TEXT REFERENCES "documents"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "tax_invoice_links" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "source_document_id" TEXT REFERENCES "documents"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "receipt_links" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "source_document_id" TEXT REFERENCES "documents"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "purchase_order_links" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "source_document_id" TEXT REFERENCES "documents"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "withholding_tax_documents" (
  "id" TEXT PRIMARY KEY,
  "document_number" TEXT NOT NULL UNIQUE,
  "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
  "contact_id" TEXT REFERENCES "contacts"("id") ON DELETE SET NULL,
  "issued_at" TIMESTAMP NOT NULL,
  "total_amount" NUMERIC(12,2) NOT NULL,
  "withholding_rate" NUMERIC(5,2) NOT NULL,
  "withholding_amount" NUMERIC(12,2) NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "withholding_tax_lines" (
  "id" TEXT PRIMARY KEY,
  "withholding_tax_document_id" TEXT NOT NULL REFERENCES "withholding_tax_documents"("id") ON DELETE CASCADE,
  "description" TEXT NOT NULL,
  "amount" NUMERIC(12,2) NOT NULL,
  "rate" NUMERIC(5,2) NOT NULL,
  "tax_amount" NUMERIC(12,2) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "documents_type_status_idx" ON "documents" ("document_type", "document_status");
CREATE INDEX IF NOT EXISTS "documents_contact_idx" ON "documents" ("contact_id");
CREATE INDEX IF NOT EXISTS "document_events_document_idx" ON "document_events" ("document_id", "created_at");
CREATE INDEX IF NOT EXISTS "payments_received_document_idx" ON "payments_received" ("document_id", "paid_at");
CREATE INDEX IF NOT EXISTS "payments_paid_document_idx" ON "payments_paid" ("document_id", "paid_at");

INSERT INTO "roles" ("id", "code", "name")
VALUES
  ('role_admin', 'ADMIN', 'ผู้ดูแลระบบ'),
  ('role_sales', 'SALES', 'ฝ่ายขาย'),
  ('role_finance', 'FINANCE', 'การเงิน'),
  ('role_operations', 'OPERATIONS', 'ปฏิบัติการ'),
  ('role_executive', 'EXECUTIVE', 'ผู้บริหาร')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "user_accounts" (
  "id",
  "authUserId",
  "email",
  "passwordHash",
  "name",
  "firstName",
  "lastName",
  "employeeId",
  "active",
  "approvalStatus",
  "approvedAt",
  "roleId",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    'user_admin_seed',
    NULL,
    'admin@orry.local',
    NULL,
    'admin',
    'admin',
    'ผู้ดูแลระบบ',
    'ADM-001',
    true,
    'APPROVED',
    now(),
    'role_admin',
    now(),
    now()
  ),
  (
    'user_finance_seed',
    NULL,
    'finance@orry.local',
    NULL,
    'finance',
    'finance',
    'การเงิน',
    'FIN-001',
    true,
    'APPROVED',
    now(),
    'role_finance',
    now(),
    now()
  )
ON CONFLICT ("email") DO UPDATE SET
  "name" = EXCLUDED."name",
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  "employeeId" = EXCLUDED."employeeId",
  "active" = EXCLUDED."active",
  "approvalStatus" = EXCLUDED."approvalStatus",
  "approvedAt" = EXCLUDED."approvedAt",
  "roleId" = EXCLUDED."roleId",
  "updatedAt" = now();

INSERT INTO "company_profiles" (
  "id",
  "displayName",
  "legalName",
  "legalNameEn",
  "taxId",
  "branchName",
  "branchCode",
  "vatRegistered",
  "defaultCurrency",
  "phone",
  "mobile",
  "email",
  "website",
  "address",
  "zipCode",
  "createdAt",
  "updatedAt"
)
VALUES (
  'company_orry',
  'ORRY',
  'ORRY Commerce Co., Ltd.',
  'ORRY Commerce Co., Ltd.',
  '0105558096348',
  'สำนักงานใหญ่',
  '00000',
  true,
  'THB',
  '02-114-7788',
  '099-274-7799',
  'ops@orry.co',
  'https://orry.co',
  '88 Sukhumvit 55, Khlong Tan Nuea, Watthana, Bangkok',
  '10110',
  now(),
  now()
)
ON CONFLICT ("id") DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  "legalName" = EXCLUDED."legalName",
  "legalNameEn" = EXCLUDED."legalNameEn",
  "taxId" = EXCLUDED."taxId",
  "branchName" = EXCLUDED."branchName",
  "branchCode" = EXCLUDED."branchCode",
  "vatRegistered" = EXCLUDED."vatRegistered",
  "defaultCurrency" = EXCLUDED."defaultCurrency",
  "phone" = EXCLUDED."phone",
  "mobile" = EXCLUDED."mobile",
  "email" = EXCLUDED."email",
  "website" = EXCLUDED."website",
  "address" = EXCLUDED."address",
  "zipCode" = EXCLUDED."zipCode",
  "updatedAt" = now();

INSERT INTO "company_branches" (
  "id",
  "company_profile_id",
  "code",
  "name",
  "tax_branch_code",
  "phone",
  "email",
  "address",
  "zip_code",
  "active",
  "created_at",
  "updated_at"
)
VALUES (
  'branch_main',
  'company_orry',
  'MAIN',
  'คลังหลัก',
  '00000',
  '02-114-7788',
  'ops@orry.co',
  '88 Sukhumvit 55, Khlong Tan Nuea, Watthana, Bangkok',
  '10110',
  true,
  now(),
  now()
)
ON CONFLICT ("company_profile_id", "code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "tax_branch_code" = EXCLUDED."tax_branch_code",
  "phone" = EXCLUDED."phone",
  "email" = EXCLUDED."email",
  "address" = EXCLUDED."address",
  "zip_code" = EXCLUDED."zip_code",
  "updated_at" = now();

INSERT INTO "company_tax_profiles" (
  "id",
  "company_profile_id",
  "tax_id",
  "vat_registered",
  "default_vat_percent",
  "withholding_percent",
  "branch_code",
  "active",
  "created_at",
  "updated_at"
)
VALUES (
  'tax_profile_main',
  'company_orry',
  '0105558096348',
  true,
  7,
  3,
  '00000',
  true,
  now(),
  now()
)
ON CONFLICT ("id") DO UPDATE SET
  "tax_id" = EXCLUDED."tax_id",
  "vat_registered" = EXCLUDED."vat_registered",
  "default_vat_percent" = EXCLUDED."default_vat_percent",
  "withholding_percent" = EXCLUDED."withholding_percent",
  "branch_code" = EXCLUDED."branch_code",
  "updated_at" = now();

INSERT INTO "payment_channels" ("id", "code", "name", "type", "active", "created_at", "updated_at")
VALUES
  ('channel_cash', 'cash', 'เงินสด', 'CASH', true, now(), now()),
  ('channel_transfer', 'transfer', 'โอนเงิน', 'TRANSFER', true, now(), now()),
  ('channel_card', 'card', 'บัตรเครดิต', 'CARD', true, now(), now()),
  ('channel_cheque', 'cheque', 'เช็ค', 'CHEQUE', true, now(), now())
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "type" = EXCLUDED."type",
  "active" = EXCLUDED."active",
  "updated_at" = now();

INSERT INTO "bank_accounts" (
  "id",
  "companyProfileId",
  "paymentChannelId",
  "bankName",
  "accountName",
  "accountNumber",
  "branch",
  "isPrimary",
  "createdAt"
)
VALUES (
  'bank_primary_bbl',
  'company_orry',
  'channel_transfer',
  'Bangkok Bank',
  'ORRY Commerce Co., Ltd.',
  '123-4-56789-0',
  'ทองหล่อ',
  true,
  now()
)
ON CONFLICT ("id") DO UPDATE SET
  "bankName" = EXCLUDED."bankName",
  "accountName" = EXCLUDED."accountName",
  "accountNumber" = EXCLUDED."accountNumber",
  "branch" = EXCLUDED."branch",
  "paymentChannelId" = EXCLUDED."paymentChannelId",
  "isPrimary" = EXCLUDED."isPrimary";

INSERT INTO "bank_account_mappings" ("id", "bank_account_id", "payment_channel_id", "active", "created_at")
VALUES ('bank_mapping_primary', 'bank_primary_bbl', 'channel_transfer', true, now())
ON CONFLICT ("id") DO UPDATE SET
  "payment_channel_id" = EXCLUDED."payment_channel_id",
  "active" = EXCLUDED."active";

INSERT INTO "product_categories" ("id", "code", "name", "active", "created_at", "updated_at")
VALUES
  ('prod_cat_beauty', 'beauty', 'เครื่องสำอาง', true, now(), now()),
  ('prod_cat_service', 'service', 'บริการ', true, now(), now())
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "active" = EXCLUDED."active",
  "updated_at" = now();

INSERT INTO "product_units" ("id", "code", "name", "symbol", "active", "created_at", "updated_at")
VALUES
  ('unit_piece', 'piece', 'ชิ้น', 'ชิ้น', true, now(), now()),
  ('unit_project', 'project', 'งาน', 'งาน', true, now(), now()),
  ('unit_bottle', 'bottle', 'ขวด', 'ขวด', true, now(), now())
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "symbol" = EXCLUDED."symbol",
  "active" = EXCLUDED."active",
  "updated_at" = now();

INSERT INTO "warehouses" ("id", "code", "name", "active", "createdAt", "updatedAt")
VALUES ('warehouse_main', 'MAIN', 'คลังหลัก', true, now(), now())
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "active" = EXCLUDED."active",
  "updatedAt" = now();

INSERT INTO "document_counters" ("id", "kind", "prefix", "lastNumber", "updatedAt")
VALUES
  ('counter_proposal', 'PROPOSAL', 'QTN', 0, now()),
  ('counter_sales_order', 'SALES_ORDER', 'SO', 0, now()),
  ('counter_billing_record', 'BILLING_RECORD', 'BN', 0, now()),
  ('counter_receipt', 'RECEIPT', 'RCPT', 0, now()),
  ('counter_purchase_order', 'PURCHASE_ORDER', 'PO', 0, now()),
  ('counter_expense', 'EXPENSE', 'EXP', 0, now())
ON CONFLICT ("kind") DO UPDATE SET
  "prefix" = EXCLUDED."prefix",
  "updatedAt" = now();
