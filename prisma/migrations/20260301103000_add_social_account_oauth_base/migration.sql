ALTER TABLE "SocialAccount"
ADD COLUMN "oauthProvider" TEXT,
ADD COLUMN "oauthState" TEXT,
ADD COLUMN "accessToken" TEXT,
ADD COLUMN "refreshToken" TEXT,
ADD COLUMN "tokenScopes" TEXT,
ADD COLUMN "tokenLastChecked" TIMESTAMP(3),
ADD COLUMN "connectedAt" TIMESTAMP(3),
ADD COLUMN "lastError" TEXT,
ADD COLUMN "pageId" TEXT,
ADD COLUMN "pageName" TEXT,
ADD COLUMN "instagramUserId" TEXT;

CREATE INDEX "SocialAccount_oauthProvider_idx" ON "SocialAccount"("oauthProvider");
