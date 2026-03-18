-- CreateTable
CREATE TABLE "ScheduledPostMedia" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledPostMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledPostMedia_postId_idx" ON "ScheduledPostMedia"("postId");

-- CreateIndex
CREATE INDEX "ScheduledPostMedia_mediaAssetId_idx" ON "ScheduledPostMedia"("mediaAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledPostMedia_postId_mediaAssetId_key" ON "ScheduledPostMedia"("postId", "mediaAssetId");

-- AddForeignKey
ALTER TABLE "ScheduledPostMedia" ADD CONSTRAINT "ScheduledPostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ScheduledPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledPostMedia" ADD CONSTRAINT "ScheduledPostMedia_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
