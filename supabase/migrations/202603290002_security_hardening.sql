CREATE TABLE IF NOT EXISTS "SecurityEvent" (
  "id" TEXT PRIMARY KEY,
  "actorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS "SecurityEvent_actor_idx" ON "SecurityEvent"("actorId", "createdAt");
CREATE INDEX IF NOT EXISTS "SecurityEvent_action_idx" ON "SecurityEvent"("action", "createdAt");
