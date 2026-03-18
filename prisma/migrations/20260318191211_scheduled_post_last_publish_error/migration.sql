-- AlterTable
ALTER TABLE "ScheduledPost" ADD COLUMN     "lastPublishDetails" JSONB,
ADD COLUMN     "lastPublishError" TEXT;
