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

ALTER TABLE "documents"
  ADD COLUMN IF NOT EXISTS "issued_at" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "due_at" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "credit_days" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "payment_term_label" TEXT,
  ADD COLUMN IF NOT EXISTS "sales_owner_name" TEXT,
  ADD COLUMN IF NOT EXISTS "project_name" TEXT,
  ADD COLUMN IF NOT EXISTS "reference_code" TEXT,
  ADD COLUMN IF NOT EXISTS "tax_inclusive" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "discount_percent" NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "discount_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "subtotal_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total_after_discount_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "vat_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "vat_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "withholding_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "withholding_percent" NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "withholding_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "deduction_label" TEXT,
  ADD COLUMN IF NOT EXISTS "deduction_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total_amount" NUMERIC(12,2) NOT NULL DEFAULT 0;

UPDATE "documents"
SET
  "issued_at" = COALESCE("issued_at", "issue_date", "created_at"),
  "due_at" = COALESCE("due_at", "due_date"),
  "discount_amount" = COALESCE("discount_amount", "discount_total", 0),
  "subtotal_amount" = COALESCE("subtotal_amount", "sub_total", 0),
  "total_after_discount_amount" = COALESCE("total_after_discount_amount", ("sub_total" - "discount_total"), "sub_total", 0),
  "vat_amount" = COALESCE("vat_amount", "tax_total", 0),
  "total_amount" = COALESCE("total_amount", "grand_total", 0)
WHERE "issued_at" IS NULL
   OR "due_at" IS NULL
   OR "discount_amount" = 0
   OR "subtotal_amount" = 0
   OR "total_after_discount_amount" = 0
   OR "vat_amount" = 0
   OR "total_amount" = 0;

ALTER TABLE "document_lines"
  ADD COLUMN IF NOT EXISTS "title" TEXT,
  ADD COLUMN IF NOT EXISTS "unit_label" TEXT NOT NULL DEFAULT 'unit',
  ADD COLUMN IF NOT EXISTS "discount_percent" NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "tax_percent" NUMERIC(5,2) NOT NULL DEFAULT 7;

UPDATE "document_lines"
SET
  "title" = COALESCE("title", "description", 'รายการ'),
  "tax_percent" = COALESCE(NULLIF("tax_percent", 0), "tax_rate", 7);

ALTER TABLE "payments_received"
  ADD COLUMN IF NOT EXISTS "actor_id" TEXT REFERENCES "user_accounts"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "direction" "PaymentDirection" NOT NULL DEFAULT 'INBOUND',
  ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "note" TEXT;

UPDATE "payments_received"
SET
  "actor_id" = COALESCE("actor_id", "recorded_by"),
  "paid_at" = COALESCE("paid_at", "received_at", "created_at"),
  "note" = COALESCE("note", "notes");

ALTER TABLE "payments_paid"
  ADD COLUMN IF NOT EXISTS "actor_id" TEXT REFERENCES "user_accounts"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "note" TEXT;

UPDATE "payments_paid"
SET
  "actor_id" = COALESCE("actor_id", "recorded_by"),
  "note" = COALESCE("note", "notes");

ALTER TABLE "document_attachments"
  ADD COLUMN IF NOT EXISTS "storage_bucket" TEXT,
  ADD COLUMN IF NOT EXISTS "storage_path" TEXT,
  ADD COLUMN IF NOT EXISTS "uploaded_by_id" TEXT REFERENCES "user_accounts"("id") ON DELETE SET NULL;

UPDATE "document_attachments"
SET
  "storage_path" = COALESCE("storage_path", "file_path"),
  "uploaded_by_id" = COALESCE("uploaded_by_id", "uploaded_by");

ALTER TABLE "document_email_logs"
  ADD COLUMN IF NOT EXISTS "sent_to" TEXT,
  ADD COLUMN IF NOT EXISTS "body_preview" TEXT,
  ADD COLUMN IF NOT EXISTS "sent_at" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "opened_at" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "failed_at" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "error_message" TEXT;

UPDATE "document_email_logs"
SET
  "sent_to" = COALESCE("sent_to", "recipient_email"),
  "body_preview" = COALESCE("body_preview", "body");

ALTER TABLE "document_share_logs"
  ADD COLUMN IF NOT EXISTS "shared_by_id" TEXT REFERENCES "user_accounts"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "channel" TEXT,
  ADD COLUMN IF NOT EXISTS "shared_to" TEXT,
  ADD COLUMN IF NOT EXISTS "message" TEXT,
  ADD COLUMN IF NOT EXISTS "shared_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "clicked_at" TIMESTAMP;

UPDATE "document_share_logs"
SET
  "shared_by_id" = COALESCE("shared_by_id", "shared_by"),
  "channel" = COALESCE("channel", "share_type"),
  "shared_to" = COALESCE("shared_to", "share_target"),
  "shared_at" = COALESCE("shared_at", "created_at");

ALTER TABLE "document_status_history"
  ADD COLUMN IF NOT EXISTS "changed_by_id" TEXT REFERENCES "user_accounts"("id") ON DELETE SET NULL;

UPDATE "document_status_history"
SET "changed_by_id" = COALESCE("changed_by_id", "changed_by");

ALTER TABLE "inventory_receipts"
  ADD COLUMN IF NOT EXISTS "document_id" TEXT REFERENCES "documents"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "received_at" TIMESTAMP;

UPDATE "inventory_receipts"
SET "received_at" = COALESCE("received_at", "receipt_date");

ALTER TABLE "inventory_receipt_lines"
  ADD COLUMN IF NOT EXISTS "quantity" NUMERIC(12,2);

UPDATE "inventory_receipt_lines"
SET "quantity" = COALESCE("quantity", "quantity_received");

ALTER TABLE "inventory_movements"
  ADD COLUMN IF NOT EXISTS "occurred_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "inventory_movements"
SET "occurred_at" = COALESCE("occurred_at", "created_at");

ALTER TABLE "withholding_tax_documents"
  ADD COLUMN IF NOT EXISTS "contact_id" TEXT REFERENCES "contacts"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "issued_at" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "total_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "withholding_rate" NUMERIC(5,2) NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "withholding_amount" NUMERIC(12,2) NOT NULL DEFAULT 0;

UPDATE "withholding_tax_documents"
SET
  "contact_id" = COALESCE("contact_id", "supplier_id"),
  "issued_at" = COALESCE("issued_at", "document_date", "created_at"),
  "total_amount" = COALESCE("total_amount", "tax_base_amount", 0),
  "withholding_amount" = COALESCE("withholding_amount", "withheld_amount", 0);

CREATE TABLE IF NOT EXISTS "withholding_tax_lines" (
  "id" TEXT PRIMARY KEY,
  "withholding_tax_document_id" TEXT NOT NULL REFERENCES "withholding_tax_documents"("id") ON DELETE CASCADE,
  "description" TEXT NOT NULL,
  "amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "rate" NUMERIC(5,2) NOT NULL DEFAULT 3,
  "tax_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
