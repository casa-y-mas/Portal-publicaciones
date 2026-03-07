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

interface ProcessScheduledPublicationsOptions {
  limit?: number
  targetPostId?: string
}

export interface ProjectPublishingReadiness {
  projectId: string
  mode: string
  readyForFacebook: boolean
  readyForInstagram: boolean
  readyOverall: boolean
  checks: {
    hasFacebookAccount: boolean
    hasConnectedFacebookAccount: boolean
    hasPageSelected: boolean
    hasPageToken: boolean
    hasInstagramAccount: boolean
    hasConnectedInstagramAccount: boolean
    hasInstagramUserId: boolean
    hasInstagramToken: boolean
    appUrlConfigured: boolean
    appUrlHttpsInLive: boolean
  }
  messageFacebook: string
  messageInstagram: string
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

function isTransientMetaError(detail: string) {
  const text = detail.toLowerCase()
  return (
    text.includes('temporar') ||
    text.includes('timeout') ||
    text.includes('rate limit') ||
    text.includes('too many calls') ||
    text.includes('service unavailable')
  )
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function publishToMetaPlatform(input: {
  platform: PlatformName
  contentType: 'post' | 'reel' | 'story' | 'carousel'
  caption: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  instagramUserId: string | null
  pageId: string | null
  accessToken: string | null
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

  const appUrl = process.env.APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim() || ''
  const isHttp = /^https?:\/\//i.test(input.mediaUrl)
  const mediaUrl = isHttp
    ? input.mediaUrl
    : appUrl
      ? `${appUrl.replace(/\/$/, '')}${input.mediaUrl.startsWith('/') ? '' : '/'}${input.mediaUrl}`
      : ''

  if (!mediaUrl || !/^https?:\/\//i.test(mediaUrl)) {
    return {
      ok: false,
      detail: 'La URL del archivo multimedia no es publica. Define APP_URL y usa HTTPS accesible desde Meta.',
      externalId: null,
    }
  }

  if (input.platform === 'facebook') {
    if (!input.pageId || !input.accessToken) {
      return {
        ok: false,
        detail: 'La cuenta Facebook no tiene pagina o token de pagina configurado.',
        externalId: null,
      }
    }

    const endpoint =
      input.mediaType === 'video'
        ? `https://graph.facebook.com/v19.0/${encodeURIComponent(input.pageId)}/videos`
        : `https://graph.facebook.com/v19.0/${encodeURIComponent(input.pageId)}/photos`

    const body = new URLSearchParams()
    body.set('access_token', input.accessToken)
    body.set('published', 'true')
    if (input.mediaType === 'video') {
      body.set('file_url', mediaUrl)
      body.set('description', input.caption)
    } else {
      body.set('url', mediaUrl)
      body.set('caption', input.caption)
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    })

    const json = await response.json().catch(() => null)
    if (!response.ok) {
      const apiMessage = json?.error?.message ?? 'Error desconocido de Meta Graph API.'
      return {
        ok: false,
        detail: `Meta API rechazo la publicacion: ${apiMessage}`,
        externalId: null,
      }
    }

    return {
      ok: true,
      detail: `Publicado en Facebook Page ${input.pageId}.`,
      externalId: (json?.post_id as string | undefined) ?? (json?.id as string | undefined) ?? null,
    }
  }

  if (!input.instagramUserId || !input.accessToken) {
    return {
      ok: false,
      detail: 'La cuenta Instagram no tiene usuario de negocio o token operativo.',
      externalId: null,
    }
  }

  if (input.contentType === 'story') {
    return {
      ok: false,
      detail: 'Instagram Story no esta habilitado en esta fase de integracion.',
      externalId: null,
    }
  }

  const containerEndpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(input.instagramUserId)}/media`
  const containerBody = new URLSearchParams()
  containerBody.set('access_token', input.accessToken)
  containerBody.set('caption', input.caption)

  if (input.mediaType === 'video' || input.contentType === 'reel') {
    containerBody.set('media_type', 'REELS')
    containerBody.set('video_url', mediaUrl)
  } else {
    containerBody.set('image_url', mediaUrl)
  }

  const createContainerResponse = await fetch(containerEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: containerBody,
    cache: 'no-store',
  })
  const createContainerJson = await createContainerResponse.json().catch(() => null)
  if (!createContainerResponse.ok || !createContainerJson?.id) {
    const apiMessage = createContainerJson?.error?.message ?? 'No se pudo crear el contenedor de Instagram.'
    return {
      ok: false,
      detail: `Meta API rechazo la publicacion: ${apiMessage}`,
      externalId: null,
    }
  }
  const creationId = createContainerJson.id as string

  if (input.mediaType === 'video' || input.contentType === 'reel') {
    for (let i = 0; i < 6; i += 1) {
      const statusUrl = new URL(`https://graph.facebook.com/v19.0/${encodeURIComponent(creationId)}`)
      statusUrl.searchParams.set('fields', 'status_code')
      statusUrl.searchParams.set('access_token', input.accessToken)
      const statusResponse = await fetch(statusUrl.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      const statusJson = await statusResponse.json().catch(() => null)
      const statusCode = typeof statusJson?.status_code === 'string' ? statusJson.status_code : ''
      if (statusCode === 'FINISHED') break
      if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
        return {
          ok: false,
          detail: `Meta API rechazo la publicacion: estado de contenedor ${statusCode}.`,
          externalId: null,
        }
      }
      await sleep(1500)
    }
  }

  const publishEndpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(input.instagramUserId)}/media_publish`
  const publishBody = new URLSearchParams()
  publishBody.set('access_token', input.accessToken)
  publishBody.set('creation_id', creationId)

  const publishResponse = await fetch(publishEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: publishBody,
    cache: 'no-store',
  })
  const publishJson = await publishResponse.json().catch(() => null)
  if (!publishResponse.ok) {
    const apiMessage = publishJson?.error?.message ?? 'No se pudo publicar en Instagram.'
    return {
      ok: false,
      detail: `Meta API rechazo la publicacion: ${apiMessage}`,
      externalId: null,
    }
  }

  return {
    ok: true,
    detail: `Publicado en Instagram Business ${input.instagramUserId}.`,
    externalId: (publishJson?.id as string | undefined) ?? creationId,
  }
}

async function publishWithRetry(input: {
  platform: PlatformName
  contentType: 'post' | 'reel' | 'story' | 'carousel'
  caption: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  instagramUserId: string | null
  pageId: string | null
  accessToken: string | null
  accountUsername: string
}) {
  const maxAttempts = 3
  let lastResult: Awaited<ReturnType<typeof publishToMetaPlatform>> | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await publishToMetaPlatform(input)
    lastResult = result

    if (result.ok) return result
    if (!isTransientMetaError(result.detail)) return result
    if (attempt < maxAttempts) {
      await sleep(500 * attempt)
    }
  }

  return (
    lastResult ?? {
      ok: false,
      detail: 'No se pudo publicar en Meta.',
      externalId: null,
    }
  )
}

export async function processScheduledPublications(
  input: number | ProcessScheduledPublicationsOptions = 10,
): Promise<PublishExecutionSummary> {
  const options =
    typeof input === 'number'
      ? { limit: input }
      : input
  const limit = options.limit ?? 10
  const targetPostId = options.targetPostId?.trim() || null
  const now = new Date()
  const duePosts = await prisma.scheduledPost.findMany({
    where: {
      ...(targetPostId
        ? {
            id: targetPostId,
            status: {
              in: [PostStatus.scheduled, PostStatus.draft],
            },
          }
        : {
            status: PostStatus.scheduled,
            publishAt: { lte: now },
          }),
    },
    orderBy: { publishAt: 'asc' },
    take: limit,
    include: {
      mediaAsset: {
        select: {
          id: true,
          url: true,
          fileName: true,
          type: true,
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
              pageId: true,
              instagramUserId: true,
              lastError: true,
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
    let hadPermanentError = false
    let hadTransientError = false

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
        hadPermanentError = true
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
        hadPermanentError = true
        continue
      }

      if (!canAttemptPublish(account.status) || !account.accessToken) {
        platformResults.push({
          platform: platformLabel,
          ok: false,
          detail: `La cuenta ${account.username} no esta operativa o no tiene token OAuth valido.`,
        })
        postFailed = true
        hadPermanentError = true
        continue
      }

      const publishedResult = await publishWithRetry({
        platform,
        contentType: post.contentType,
        caption: post.caption,
        mediaUrl: post.mediaAsset.url,
        mediaType: post.mediaAsset.type,
        instagramUserId: account.instagramUserId,
        pageId: account.pageId,
        accessToken: account.accessToken,
        accountUsername: account.username,
      })

      platformResults.push({
        platform: platformLabel,
        ok: publishedResult.ok,
        detail: publishedResult.detail,
      })

      if (!publishedResult.ok) {
        if (isTransientMetaError(publishedResult.detail)) {
          hadTransientError = true
        } else {
          hadPermanentError = true
        }
        if (
          publishedResult.detail.includes('OAuth') ||
          publishedResult.detail.includes('token') ||
          publishedResult.detail.includes('Error validating access token')
        ) {
          await prisma.socialAccount.update({
            where: { id: account.id },
            data: {
              status: AccountStatus.token_expiring,
              tokenLastChecked: new Date(),
              lastError: publishedResult.detail,
            },
          })
        }
        postFailed = true
      }
    }

    if (postFailed && !hadPermanentError && hadTransientError && !targetPostId) {
      const retryAt = new Date(Date.now() + 5 * 60 * 1000)
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: {
          status: PostStatus.scheduled,
          publishAt: retryAt,
        },
      })

      await Promise.all([
        createActivityLog({
          level: 'warning',
          category: 'publisher',
          action: 'publish_retry_scheduled',
          targetType: 'scheduled_post',
          targetId: post.id,
          summary: `Publicacion en reintento para ${post.title}.`,
          detail: { retryAt: retryAt.toISOString(), platformResults },
        }),
        createNotification({
          type: 'system',
          title: 'Publicacion reprogramada automaticamente',
          message: `"${post.title}" se reintentara en 5 minutos por fallo temporal.`,
          href: '/publicaciones-programadas?status=scheduled',
          metadata: { postId: post.id, retryAt: retryAt.toISOString() },
        }),
      ])

      skipped += 1
      items.push({
        postId: post.id,
        title: post.title,
        finalStatus: 'skipped',
        detail: 'Fallo temporal detectado. Reintento automatico programado en 5 minutos.',
        platformResults,
      })
      continue
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

export async function getProjectPublishingReadiness(projectId: string): Promise<ProjectPublishingReadiness> {
  const [project, accounts] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    }),
    prisma.socialAccount.findMany({
      where: { projectId },
      select: {
        id: true,
        platform: true,
        status: true,
        pageId: true,
        instagramUserId: true,
        accessToken: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  if (!project) {
    return {
      projectId,
      mode: process.env.PUBLISHER_MODE?.trim().toLowerCase() || 'mock',
      readyForFacebook: false,
      readyForInstagram: false,
      readyOverall: false,
      checks: {
        hasFacebookAccount: false,
        hasConnectedFacebookAccount: false,
        hasPageSelected: false,
        hasPageToken: false,
        hasInstagramAccount: false,
        hasConnectedInstagramAccount: false,
        hasInstagramUserId: false,
        hasInstagramToken: false,
        appUrlConfigured: false,
        appUrlHttpsInLive: false,
      },
      messageFacebook: 'Proyecto no encontrado.',
      messageInstagram: 'Proyecto no encontrado.',
    }
  }

  const mode = process.env.PUBLISHER_MODE?.trim().toLowerCase() || 'mock'
  const appUrl = process.env.APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim() || ''
  const facebookAccounts = accounts.filter((account) => account.platform === 'facebook')
  const instagramAccounts = accounts.filter((account) => account.platform === 'instagram')
  const facebookConnected = facebookAccounts.find((account) => canAttemptPublish(account.status))
  const instagramConnected = instagramAccounts.find((account) => canAttemptPublish(account.status))
  const hasFacebookAccount = facebookAccounts.length > 0
  const hasConnectedFacebookAccount = Boolean(facebookConnected)
  const hasPageSelected = Boolean(facebookConnected?.pageId)
  const hasPageToken = Boolean(facebookConnected?.accessToken)
  const hasInstagramAccount = instagramAccounts.length > 0
  const hasConnectedInstagramAccount = Boolean(instagramConnected)
  const hasInstagramUserId = Boolean(instagramConnected?.instagramUserId)
  const hasInstagramToken = Boolean(instagramConnected?.accessToken)
  const appUrlConfigured = Boolean(appUrl)
  const appUrlHttpsInLive = mode !== 'live' || /^https:\/\//i.test(appUrl)
  const readyForFacebook =
    hasFacebookAccount &&
    hasConnectedFacebookAccount &&
    hasPageSelected &&
    hasPageToken &&
    appUrlConfigured &&
    appUrlHttpsInLive
  const readyForInstagram =
    hasInstagramAccount &&
    hasConnectedInstagramAccount &&
    hasInstagramUserId &&
    hasInstagramToken &&
    appUrlConfigured &&
    appUrlHttpsInLive
  const readyOverall = readyForFacebook && readyForInstagram

  let messageFacebook = 'Proyecto listo para publicar en Facebook.'
  if (!hasFacebookAccount) messageFacebook = 'Falta registrar una cuenta de Facebook para este proyecto.'
  else if (!hasConnectedFacebookAccount) messageFacebook = 'La cuenta Facebook existe pero no esta conectada con OAuth.'
  else if (!hasPageSelected) messageFacebook = 'Conecta Meta y selecciona una pagina de Facebook para publicar.'
  else if (!hasPageToken) messageFacebook = 'La pagina seleccionada no tiene token operativo. Reconecta OAuth.'
  else if (!appUrlConfigured) messageFacebook = 'Configura APP_URL para construir URLs publicas de media.'
  else if (!appUrlHttpsInLive) messageFacebook = 'En modo live, APP_URL debe usar HTTPS accesible desde Meta.'

  let messageInstagram = 'Proyecto listo para publicar en Instagram.'
  if (!hasInstagramAccount) messageInstagram = 'Falta registrar una cuenta de Instagram para este proyecto.'
  else if (!hasConnectedInstagramAccount) messageInstagram = 'La cuenta Instagram existe pero no esta conectada con OAuth.'
  else if (!hasInstagramUserId) messageInstagram = 'La cuenta Instagram no tiene instagramUserId de negocio. Selecciona pagina con IG vinculado.'
  else if (!hasInstagramToken) messageInstagram = 'La cuenta Instagram no tiene token operativo. Reconecta OAuth.'
  else if (!appUrlConfigured) messageInstagram = 'Configura APP_URL para construir URLs publicas de media.'
  else if (!appUrlHttpsInLive) messageInstagram = 'En modo live, APP_URL debe usar HTTPS accesible desde Meta.'

  return {
    projectId,
    mode,
    readyForFacebook,
    readyForInstagram,
    readyOverall,
    checks: {
      hasFacebookAccount,
      hasConnectedFacebookAccount,
      hasPageSelected,
      hasPageToken,
      hasInstagramAccount,
      hasConnectedInstagramAccount,
      hasInstagramUserId,
      hasInstagramToken,
      appUrlConfigured,
      appUrlHttpsInLive,
    },
    messageFacebook,
    messageInstagram,
  }
}
