CREATE TABLE "SocialInboxNote" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialInboxNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SocialInboxNote_threadId_idx" ON "SocialInboxNote"("threadId");
CREATE INDEX "SocialInboxNote_authorId_idx" ON "SocialInboxNote"("authorId");
CREATE INDEX "SocialInboxNote_createdAt_idx" ON "SocialInboxNote"("createdAt");

ALTER TABLE "SocialInboxNote" ADD CONSTRAINT "SocialInboxNote_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "SocialInboxThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialInboxNote" ADD CONSTRAINT "SocialInboxNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
