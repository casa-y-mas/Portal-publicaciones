CREATE TYPE "NotificationType" AS ENUM ('failed', 'token_expiring', 'approval', 'success', 'system');

CREATE TYPE "LogLevel" AS ENUM ('info', 'warning', 'error', 'success');

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "href" TEXT,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityLog" (
  "id" TEXT NOT NULL,
  "level" "LogLevel" NOT NULL,
  "category" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "summary" TEXT NOT NULL,
  "detailJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_type_idx" ON "Notification"("type");
CREATE INDEX "Notification_read_idx" ON "Notification"("read");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

CREATE INDEX "ActivityLog_level_idx" ON "ActivityLog"("level");
CREATE INDEX "ActivityLog_category_idx" ON "ActivityLog"("category");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
