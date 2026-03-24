import { AccountStatus, Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

type SocialTemplate = {
  platform: 'facebook' | 'instagram'
  username: string
  type: string
  status: AccountStatus
  expiresAt: Date | null
  oauthProvider: string | null
  accessToken: string | null
  refreshToken: string | null
  tokenScopes: string | null
  tokenLastChecked: Date | null
  connectedAt: Date | null
  lastError: string | null
  pageId: string | null
  pageName: string | null
  instagramUserId: string | null
}

function accountKey(input: { platform: string; username: string; type: string }) {
  return `${input.platform}::${input.username.trim().toLowerCase()}::${input.type.trim().toLowerCase()}`
}

export async function ensureProjectSocialAccounts(projectId: string) {
  const [existingAccounts, templateAccounts] = await Promise.all([
    prisma.socialAccount.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.socialAccount.findMany({
      where: {
        projectId: { not: projectId },
        platform: { in: ['facebook', 'instagram'] },
        OR: [
          { status: { in: [AccountStatus.connected, AccountStatus.token_expiring] } },
          { accessToken: { not: null } },
          { pageId: { not: null } },
          { instagramUserId: { not: null } },
        ],
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    }),
  ])

  const existingMap = new Map(existingAccounts.map((account) => [accountKey(account), account]))
  const bestTemplateByKey = new Map<string, SocialTemplate>()

  for (const template of templateAccounts) {
    const key = accountKey(template)
    if (!bestTemplateByKey.has(key)) {
      bestTemplateByKey.set(key, template)
    }
  }

  for (const [key, template] of bestTemplateByKey.entries()) {
    const existing = existingMap.get(key)
    const updateData: Prisma.SocialAccountUncheckedUpdateInput = {
      username: template.username,
      type: template.type,
      status: template.status,
      expiresAt: template.expiresAt,
      oauthProvider: template.oauthProvider,
      accessToken: template.accessToken,
      refreshToken: template.refreshToken,
      tokenScopes: template.tokenScopes,
      tokenLastChecked: template.tokenLastChecked,
      connectedAt: template.connectedAt,
      lastError: template.lastError,
      pageId: template.pageId,
      pageName: template.pageName,
      instagramUserId: template.instagramUserId,
    }

    if (existing) {
      await prisma.socialAccount.update({
        where: { id: existing.id },
        data: updateData,
      })
      continue
    }

    const createData: Prisma.SocialAccountUncheckedCreateInput = {
      projectId,
      platform: template.platform,
      username: template.username,
      type: template.type,
      status: template.status,
      expiresAt: template.expiresAt,
      oauthProvider: template.oauthProvider,
      accessToken: template.accessToken,
      refreshToken: template.refreshToken,
      tokenScopes: template.tokenScopes,
      tokenLastChecked: template.tokenLastChecked,
      connectedAt: template.connectedAt,
      lastError: template.lastError,
      pageId: template.pageId,
      pageName: template.pageName,
      instagramUserId: template.instagramUserId,
    }

    const created = await prisma.socialAccount.create({
      data: createData,
    })
    existingMap.set(key, created)
  }

  return prisma.socialAccount.findMany({
    where: { projectId },
    orderBy: [{ platform: 'asc' }, { createdAt: 'asc' }],
  })
}
