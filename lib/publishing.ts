import { AccountStatus, PostStatus, Prisma } from '@prisma/client'

import { createActivityLog, createNotification } from '@/lib/operations-feed'
import { prisma } from '@/lib/prisma'

type PlatformName = 'instagram' | 'facebook'

export interface PublishExecutionItem {
  postId: string
  title: string
  finalStatus: 'published' | 'failed' | 'skipped'
  detail: string
  platformResults: Array<{
    platform: string
    ok: boolean
    detail: string
  }>
}

export interface PublishExecutionSummary {
  scanned: number
  processed: number
  published: number
  failed: number
  skipped: number
  items: PublishExecutionItem[]
  executedAt: string
}

function parsePlatforms(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function normalizePlatform(value: string): PlatformName | null {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'instagram') return 'instagram'
  if (normalized === 'facebook') return 'facebook'
  return null
}

function canAttemptPublish(accountStatus: AccountStatus): boolean {
  return accountStatus === 'connected' || accountStatus === 'token_expiring'
}

async function publishToMetaPlatform(input: {
  platform: PlatformName
  caption: string
  mediaUrl: string
  accountUsername: string
}) {
  const mode = process.env.PUBLISHER_MODE?.trim().toLowerCase() || 'mock'

  if (mode !== 'live') {
    return {
      ok: true,
      detail: `Envio simulado a ${input.platform} para ${input.accountUsername}.`,
      externalId: `mock_${input.platform}_${Date.now()}`,
    }
  }

  return {
    ok: false,
    detail: `Modo live no implementado todavia para ${input.platform}.`,
    externalId: null,
  }
}

export async function processScheduledPublications(limit = 10): Promise<PublishExecutionSummary> {
  const now = new Date()
  const duePosts = await prisma.scheduledPost.findMany({
    where: {
      status: PostStatus.scheduled,
      publishAt: { lte: now },
    },
    orderBy: { publishAt: 'asc' },
    take: limit,
    include: {
      mediaAsset: {
        select: {
          id: true,
          url: true,
          fileName: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          socialAccounts: {
            select: {
              id: true,
              platform: true,
              username: true,
              status: true,
              accessToken: true,
            },
          },
        },
      },
    },
  })

  const items: PublishExecutionItem[] = []
  let published = 0
  let failed = 0
  let skipped = 0

  for (const post of duePosts) {
    const platforms = parsePlatforms(post.platformsJson)

    if (platforms.length === 0) {
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: PostStatus.failed },
      })
      await Promise.all([
        createActivityLog({
          level: 'error',
          category: 'publisher',
          action: 'publish_failed',
          targetType: 'scheduled_post',
          targetId: post.id,
          summary: `Fallo de publicacion para ${post.title}: sin redes configuradas.`,
          detail: { reason: 'missing_platforms' },
        }),
        createNotification({
          type: 'failed',
          title: 'Publicacion fallida',
          message: `"${post.title}" fallo porque no tiene redes configuradas.`,
          href: '/publicaciones-programadas?status=failed',
          metadata: { postId: post.id },
        }),
      ])
      failed += 1
      items.push({
        postId: post.id,
        title: post.title,
        finalStatus: 'failed',
        detail: 'La publicacion no tiene redes configuradas.',
        platformResults: [],
      })
      continue
    }

    if (!post.mediaAsset?.url) {
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: PostStatus.failed },
      })
      await Promise.all([
        createActivityLog({
          level: 'error',
          category: 'publisher',
          action: 'publish_failed',
          targetType: 'scheduled_post',
          targetId: post.id,
          summary: `Fallo de publicacion para ${post.title}: sin archivo multimedia.`,
          detail: { reason: 'missing_media' },
        }),
        createNotification({
          type: 'failed',
          title: 'Publicacion fallida',
          message: `"${post.title}" fallo porque no tiene archivo multimedia.`,
          href: '/library',
          metadata: { postId: post.id },
        }),
      ])
      failed += 1
      items.push({
        postId: post.id,
        title: post.title,
        finalStatus: 'failed',
        detail: 'La publicacion no tiene archivo multimedia disponible.',
        platformResults: [],
      })
      continue
    }

    const platformResults: PublishExecutionItem['platformResults'] = []
    let postFailed = false

    for (const platformLabel of platforms) {
      const platform = normalizePlatform(platformLabel)
      if (!platform) {
        skipped += 1
        platformResults.push({
          platform: platformLabel,
          ok: false,
          detail: 'Plataforma fuera de alcance en esta fase.',
        })
        postFailed = true
        continue
      }

      const account = post.project.socialAccounts.find((item) => item.platform === platform)
      if (!account) {
        platformResults.push({
          platform: platformLabel,
          ok: false,
          detail: `No existe cuenta conectada para ${platformLabel} en ${post.project.name}.`,
        })
        postFailed = true
        continue
      }

      if (!canAttemptPublish(account.status) || !account.accessToken) {
        platformResults.push({
          platform: platformLabel,
          ok: false,
          detail: `La cuenta ${account.username} no esta operativa o no tiene token OAuth valido.`,
        })
        postFailed = true
        continue
      }

      const publishedResult = await publishToMetaPlatform({
        platform,
        caption: post.caption,
        mediaUrl: post.mediaAsset.url,
        accountUsername: account.username,
      })

      platformResults.push({
        platform: platformLabel,
        ok: publishedResult.ok,
        detail: publishedResult.detail,
      })

      if (!publishedResult.ok) {
        postFailed = true
      }
    }

    const finalStatus = postFailed ? PostStatus.failed : PostStatus.published
    await prisma.scheduledPost.update({
      where: { id: post.id },
      data: { status: finalStatus },
    })

    if (postFailed) {
      await Promise.all([
        createActivityLog({
          level: 'error',
          category: 'publisher',
          action: 'publish_failed',
          targetType: 'scheduled_post',
          targetId: post.id,
          summary: `Fallo parcial de publicacion para ${post.title}.`,
          detail: { platformResults },
        }),
        createNotification({
          type: 'failed',
          title: 'Publicacion con error',
          message: `"${post.title}" no pudo completarse en todas las redes.`,
          href: '/publicaciones-programadas?status=failed',
          metadata: { postId: post.id, platformResults },
        }),
      ])
      failed += 1
      items.push({
        postId: post.id,
        title: post.title,
        finalStatus: 'failed',
        detail: 'La publicacion no pudo completarse en todas las redes.',
        platformResults,
      })
    } else {
      await Promise.all([
        createActivityLog({
          level: 'success',
          category: 'publisher',
          action: 'publish_success',
          targetType: 'scheduled_post',
          targetId: post.id,
          summary: `Publicacion completada para ${post.title}.`,
          detail: { platformResults },
        }),
        createNotification({
          type: 'success',
          title: 'Publicacion exitosa',
          message: `"${post.title}" se proceso correctamente.`,
          href: '/publicaciones-programadas',
          metadata: { postId: post.id, platformResults },
        }),
      ])
      published += 1
      items.push({
        postId: post.id,
        title: post.title,
        finalStatus: 'published',
        detail: 'Publicacion procesada correctamente.',
        platformResults,
      })
    }
  }

  return {
    scanned: duePosts.length,
    processed: duePosts.length,
    published,
    failed,
    skipped,
    items,
    executedAt: new Date().toISOString(),
  }
}

export async function getPublishingQueueSnapshot() {
  const now = new Date()
  const [dueNow, nextHour, disconnectedAccounts, expiringAccounts] = await Promise.all([
    prisma.scheduledPost.count({
      where: {
        status: PostStatus.scheduled,
        publishAt: { lte: now },
      },
    }),
    prisma.scheduledPost.count({
      where: {
        status: PostStatus.scheduled,
        publishAt: {
          gt: now,
          lte: new Date(now.getTime() + 60 * 60 * 1000),
        },
      },
    }),
    prisma.socialAccount.count({
      where: { status: AccountStatus.disconnected },
    }),
    prisma.socialAccount.count({
      where: { status: AccountStatus.token_expiring },
    }),
  ])

  return {
    mode: process.env.PUBLISHER_MODE?.trim().toLowerCase() || 'mock',
    dueNow,
    nextHour,
    disconnectedAccounts,
    expiringAccounts,
    checkedAt: now.toISOString(),
  }
}
