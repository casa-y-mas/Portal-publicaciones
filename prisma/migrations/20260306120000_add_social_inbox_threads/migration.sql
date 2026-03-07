CREATE TYPE "InboxPriority" AS ENUM ('high', 'medium', 'low');

CREATE TYPE "InboxStatus" AS ENUM ('new', 'pending', 'resolved');

CREATE TABLE "SocialInboxThread" (
    "id" TEXT NOT NULL,
    "platform" "AccountPlatform" NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "externalItemId" TEXT NOT NULL,
    "externalPostId" TEXT,
    "accountLabel" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "InboxPriority" NOT NULL DEFAULT 'medium',
    "status" "InboxStatus" NOT NULL DEFAULT 'new',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "assignedToId" TEXT,
    "slaDueAt" TIMESTAMP(3),
    "firstRespondedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialInboxThread_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SocialInboxThread_socialAccountId_externalItemId_key" ON "SocialInboxThread"("socialAccountId", "externalItemId");
CREATE INDEX "SocialInboxThread_platform_idx" ON "SocialInboxThread"("platform");
CREATE INDEX "SocialInboxThread_status_idx" ON "SocialInboxThread"("status");
CREATE INDEX "SocialInboxThread_priority_idx" ON "SocialInboxThread"("priority");
CREATE INDEX "SocialInboxThread_assignedToId_idx" ON "SocialInboxThread"("assignedToId");
CREATE INDEX "SocialInboxThread_occurredAt_idx" ON "SocialInboxThread"("occurredAt");

ALTER TABLE "SocialInboxThread" ADD CONSTRAINT "SocialInboxThread_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialInboxThread" ADD CONSTRAINT "SocialInboxThread_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
