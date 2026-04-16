-- ScheduledPost: optional link to portal/inmueble project + required bucket for publishing (tokens/media).

ALTER TABLE "ScheduledPost" ADD COLUMN "publishingProjectId" TEXT;

UPDATE "ScheduledPost" SET "publishingProjectId" = "projectId" WHERE "publishingProjectId" IS NULL;

ALTER TABLE "ScheduledPost" ALTER COLUMN "publishingProjectId" SET NOT NULL;

ALTER TABLE "ScheduledPost" DROP CONSTRAINT IF EXISTS "ScheduledPost_projectId_fkey";

ALTER TABLE "ScheduledPost" ALTER COLUMN "projectId" DROP NOT NULL;

ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_publishingProjectId_fkey" FOREIGN KEY ("publishingProjectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "ScheduledPost_publishingProjectId_idx" ON "ScheduledPost"("publishingProjectId");
