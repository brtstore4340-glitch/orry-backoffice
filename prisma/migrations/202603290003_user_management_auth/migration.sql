DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserApprovalStatus') THEN
    CREATE TYPE "UserApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "firstName" TEXT,
  ADD COLUMN IF NOT EXISTS "lastName" TEXT,
  ADD COLUMN IF NOT EXISTS "employeeId" TEXT,
  ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvalStatus" "UserApprovalStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3);

UPDATE "User"
SET
  "firstName" = COALESCE(NULLIF(split_part("name", ' ', 1), ''), 'ORRY'),
  "lastName" = COALESCE(NULLIF(substring("name" FROM position(' ' in "name") + 1), ''), 'Operator'),
  "approvalStatus" = CASE WHEN "active" THEN 'APPROVED'::"UserApprovalStatus" ELSE 'REJECTED'::"UserApprovalStatus" END,
  "approvedAt" = COALESCE("approvedAt", CASE WHEN "active" THEN "createdAt" ELSE NULL END),
  "rejectedAt" = COALESCE("rejectedAt", CASE WHEN NOT "active" THEN "createdAt" ELSE NULL END)
WHERE "firstName" IS NULL
   OR "lastName" IS NULL
   OR "approvedAt" IS NULL
   OR (NOT "active" AND "rejectedAt" IS NULL);

ALTER TABLE "User"
  ALTER COLUMN "firstName" SET NOT NULL,
  ALTER COLUMN "lastName" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_employeeId_key" ON "User"("employeeId");

CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

ALTER TABLE "PasswordResetToken"
  ADD CONSTRAINT "PasswordResetToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
