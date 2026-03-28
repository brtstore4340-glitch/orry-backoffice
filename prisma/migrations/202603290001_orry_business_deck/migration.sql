CREATE TYPE "RoleCode" AS ENUM ('ADMIN', 'SALES', 'FINANCE', 'OPERATIONS', 'EXECUTIVE');
CREATE TYPE "ContactType" AS ENUM ('CUSTOMER', 'COMPANY', 'VENDOR', 'PARTNER');
CREATE TYPE "ProductKind" AS ENUM ('INVENTORY', 'SERVICE', 'NON_INVENTORY');
CREATE TYPE "DocumentKind" AS ENUM ('PROPOSAL', 'SALES_ORDER', 'BILLING_RECORD', 'RECEIPT', 'PURCHASE_ORDER', 'EXPENSE');
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'AWAITING_APPROVAL', 'APPROVED', 'ISSUED', 'FULFILLED', 'PAID', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CREDIT_CARD', 'CHEQUE');
CREATE TYPE "PaymentDirection" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "DocumentReferenceType" AS ENUM ('CONVERTED_FROM', 'RELATED_TO');

CREATE TABLE "Role" (
  "id" TEXT PRIMARY KEY,
  "code" "RoleCode" NOT NULL UNIQUE,
  "name" TEXT NOT NULL
);

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "roleId" TEXT NOT NULL REFERENCES "Role"("id"),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CompanyProfile" (
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

CREATE TABLE "BankAccount" (
  "id" TEXT PRIMARY KEY,
  "companyProfileId" TEXT NOT NULL REFERENCES "CompanyProfile"("id") ON DELETE CASCADE,
  "bankName" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "branch" TEXT,
  "swiftCode" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Contact" (
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

CREATE TABLE "Warehouse" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Product" (
  "id" TEXT PRIMARY KEY,
  "sku" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "kind" "ProductKind" NOT NULL,
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

CREATE TABLE "InventoryBalance" (
  "id" TEXT PRIMARY KEY,
  "warehouseId" TEXT NOT NULL REFERENCES "Warehouse"("id") ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("warehouseId", "productId")
);

CREATE TABLE "DocumentCounter" (
  "id" TEXT PRIMARY KEY,
  "kind" "DocumentKind" NOT NULL UNIQUE,
  "prefix" TEXT NOT NULL,
  "lastNumber" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "BusinessDocument" (
  "id" TEXT PRIMARY KEY,
  "documentNumber" TEXT NOT NULL UNIQUE,
  "kind" "DocumentKind" NOT NULL,
  "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
  "contactId" TEXT REFERENCES "Contact"("id") ON DELETE SET NULL,
  "ownerId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "issuedAt" TIMESTAMP NOT NULL,
  "dueAt" TIMESTAMP,
  "creditDays" INTEGER NOT NULL DEFAULT 0,
  "paymentTermLabel" TEXT,
  "salesOwnerName" TEXT,
  "projectName" TEXT,
  "referenceCode" TEXT,
  "notes" TEXT,
  "internalNotes" TEXT,
  "taxInclusive" BOOLEAN NOT NULL DEFAULT FALSE,
  "discountPercent" NUMERIC(5,2) NOT NULL DEFAULT 0,
  "discountAmount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "subtotalAmount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "totalAfterDiscountAmount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "vatEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "vatAmount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "withholdingEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "withholdingPercent" NUMERIC(5,2) NOT NULL DEFAULT 0,
  "withholdingAmount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "deductionLabel" TEXT,
  "deductionAmount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "totalAmount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "shareToken" TEXT UNIQUE,
  "sharedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "DocumentLine" (
  "id" TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL REFERENCES "BusinessDocument"("id") ON DELETE CASCADE,
  "productId" TEXT REFERENCES "Product"("id") ON DELETE SET NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "unitLabel" TEXT NOT NULL DEFAULT 'unit',
  "quantity" NUMERIC(12,2) NOT NULL,
  "unitPrice" NUMERIC(12,2) NOT NULL,
  "discountPercent" NUMERIC(5,2) NOT NULL DEFAULT 0,
  "taxPercent" NUMERIC(5,2) NOT NULL DEFAULT 7,
  "lineTotal" NUMERIC(12,2) NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "PaymentEntry" (
  "id" TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL REFERENCES "BusinessDocument"("id") ON DELETE CASCADE,
  "actorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "direction" "PaymentDirection" NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "amount" NUMERIC(12,2) NOT NULL,
  "paidAt" TIMESTAMP NOT NULL,
  "referenceNumber" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "DocumentAttachment" (
  "id" TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL REFERENCES "BusinessDocument"("id") ON DELETE CASCADE,
  "fileName" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "mimeType" TEXT,
  "fileSize" INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "DocumentReference" (
  "id" TEXT PRIMARY KEY,
  "sourceDocumentId" TEXT NOT NULL REFERENCES "BusinessDocument"("id") ON DELETE CASCADE,
  "targetDocumentId" TEXT NOT NULL REFERENCES "BusinessDocument"("id") ON DELETE CASCADE,
  "type" "DocumentReferenceType" NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("sourceDocumentId", "targetDocumentId", "type")
);

CREATE TABLE "DocumentActivity" (
  "id" TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL REFERENCES "BusinessDocument"("id") ON DELETE CASCADE,
  "actorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "detail" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BusinessDocument_kind_status_idx" ON "BusinessDocument"("kind", "status");
CREATE INDEX "BusinessDocument_contact_idx" ON "BusinessDocument"("contactId");
CREATE INDEX "DocumentActivity_document_idx" ON "DocumentActivity"("documentId", "createdAt");
CREATE INDEX "PaymentEntry_document_idx" ON "PaymentEntry"("documentId", "paidAt");

ALTER TABLE "BusinessDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentAttachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentEntry" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orry_authenticated_documents" ON "BusinessDocument"
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "orry_authenticated_attachments" ON "DocumentAttachment"
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "orry_authenticated_payments" ON "PaymentEntry"
  FOR ALL USING (auth.role() = 'authenticated');