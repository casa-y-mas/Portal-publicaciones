import { AccountStatus, PostStatus, Prisma } from '@prisma/client'

import { createActivityLog, createNotification } from '@/lib/operations-feed'
import { prisma } from '@/lib/prisma'
import { ensureProjectSocialAccounts } from '@/lib/project-social-accounts'
import { syncProjectMedia } from '@/lib/project-media'
import { resolveProjectRecord } from '@/lib/project-resolution'
import { getNextRecurrenceDate, type RecurrenceInfo } from '@/lib/recurrence-utils'

type PlatformName = 'instagram' | 'facebook'
const SUBTITLE_MARKER = '[SUBTITULO]'

export interface PublishExecutionItem {
  postId: string
  title: string
  finalStatus: 'published' | 'failed' | 'skipped'
  detail: string
  platformResults: Array<{
    platform: string
    ok: boolean
    detail: string
    externalId?: string | null
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

function parseRecurrence(value: Prisma.JsonValue | null): RecurrenceInfo | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as Record<string, unknown>
  const enabled =
    candidate.enabled === true || candidate.enabled === 'true' || candidate.enabled === 1
  if (!enabled) return null

  return {
    enabled: true,
    type: typeof candidate.type === 'string' ? (candidate.type as RecurrenceInfo['type']) : undefined,
    endType: candidate.endType === 'date' ? 'date' : 'never',
    endDate: typeof candidate.endDate === 'string' ? candidate.endDate : undefined,
    endTime: typeof candidate.endTime === 'string' ? candidate.endTime : undefined,
    customFrequency:
      typeof candidate.customFrequency === 'string'
        ? (candidate.customFrequency as RecurrenceInfo['customFrequency'])
        : undefined,
    customInterval: typeof candidate.customInterval === 'number' ? candidate.customInterval : undefined,
    customWeekDays: Array.isArray(candidate.customWeekDays)
      ? candidate.customWeekDays.filter((day): day is number => typeof day === 'number')
      : undefined,
    customMonthDay: typeof candidate.customMonthDay === 'number' ? candidate.customMonthDay : undefined,
    customYearDate: typeof candidate.customYearDate === 'string' ? candidate.customYearDate : undefined,
  }
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

function isTransientMetaError(detail: string | undefined | null) {
  const text = (detail ?? '').toLowerCase()
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

function parseStoredCaption(rawCaption: string): { subtitle: string | null; caption: string } {
  if (!rawCaption.startsWith(SUBTITLE_MARKER)) {
    return { subtitle: null, caption: rawCaption }
  }

  const firstBreak = rawCaption.indexOf('\n')
  if (firstBreak === -1) {
    const subtitleOnly = rawCaption.slice(SUBTITLE_MARKER.length).trim()
    return { subtitle: subtitleOnly || null, caption: '' }
  }

  const header = rawCaption.slice(0, firstBreak).trim()
  const subtitle = header.slice(SUBTITLE_MARKER.length).trim()
  const caption = rawCaption.slice(firstBreak).trim()
  return { subtitle: subtitle || null, caption }
}

function composePublishCaption(input: { title: string; subtitle: string | null; caption: string }) {
  const title = input.title.trim()
  const subtitle = (input.subtitle ?? '').trim()
  const caption = input.caption.trim()

  const lines: string[] = []
  if (title) lines.push(title)
  if (subtitle) lines.push(subtitle)
  if (caption) {
    if (lines.length > 0) lines.push('')
    lines.push(caption)
  }
  return lines.join('\n')
}

function buildPublicMediaUrl(mediaUrl: string) {
  const isHttp = /^https?:\/\//i.test(mediaUrl)
  if (isHttp) return mediaUrl

  const appUrl = process.env.APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim() || ''
  if (!appUrl) return mediaUrl

  const base = appUrl.replace(/\/$/, '')
  const path = mediaUrl.startsWith('/') ? mediaUrl : `/${mediaUrl}`
  return `${base}${path}`
}

async function ensureFacebookPostIsPublic(postId: string, accessToken: string) {
  const normalizedPostId = postId.trim()
  if (!normalizedPostId) {
    return { ok: false as const, detail: 'No se pudo verificar visibilidad del post (id vacio).' }
  }

  const inspectUrl = new URL(`https://graph.facebook.com/v19.0/${encodeURIComponent(normalizedPostId)}`)
  inspectUrl.searchParams.set('fields', 'id,is_published,published,timeline_visibility,permalink_url')
  inspectUrl.searchParams.set('access_token', accessToken)

  const inspectResponse = await fetch(inspectUrl.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  const inspectJson = await inspectResponse.json().catch(() => null)

  if (!inspectResponse.ok) {
    const apiMessage = inspectJson?.error?.message ?? 'No se pudo inspeccionar visibilidad del post.'
    return { ok: false as const, detail: apiMessage }
  }

  const isPublished = inspectJson?.is_published
  const published = inspectJson?.published
  const timelineVisibility = inspectJson?.timeline_visibility
  const requiresForcePublic = isPublished === false || published === false || timelineVisibility === 'hidden'

  if (!requiresForcePublic) {
    return { ok: true as const, detail: 'Visibilidad publica verificada.' }
  }

  const forceBody = new URLSearchParams()
  forceBody.set('access_token', accessToken)
  forceBody.set('is_published', 'true')
  forceBody.set('published', 'true')
  forceBody.set('timeline_visibility', 'normal')

  const forceResponse = await fetch(`https://graph.facebook.com/v19.0/${encodeURIComponent(normalizedPostId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: forceBody,
    cache: 'no-store',
  })
  const forceJson = await forceResponse.json().catch(() => null)
  if (!forceResponse.ok) {
    const apiMessage = forceJson?.error?.message ?? 'Meta no permitio forzar visibilidad publica.'
    return { ok: false as const, detail: apiMessage }
  }

  return { ok: true as const, detail: 'Meta confirmo ajuste a visibilidad publica.' }
}

async function safeUpdateScheduledPostPublishError(input: {
  postId: string
  status: PostStatus
  lastPublishError?: string | null
  lastPublishDetails?: Prisma.InputJsonValue
}) {
  try {
    return await prisma.scheduledPost.update({
      where: { id: input.postId },
      data: {
        status: input.status,
        ...(input.lastPublishError !== undefined ? { lastPublishError: input.lastPublishError } : {}),
        ...(input.lastPublishDetails !== undefined ? { lastPublishDetails: input.lastPublishDetails } : {}),
      } as any,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const isUnknownArg =
      message.includes('Unknown argument lastPublishError') || message.includes('Unknown argument lastPublishDetails')
    if (isUnknownArg) {
      // Compatibilidad: si el Prisma Client no tiene estos campos (ej. no se regenero en la VPS),
      // al menos guardamos el status para no tumbar el publicador.
      return prisma.scheduledPost.update({
        where: { id: input.postId },
        data: { status: input.status },
      })
    }
    throw err
  }
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

    if (input.mediaType === 'image') {
      // Subimos la foto no publicada y luego creamos un post en feed con attached_media.
      // Esto evita que quede solo en "Fotos" y mejora visibilidad para usuarios no admins.
      const uploadEndpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(input.pageId)}/photos`
      const uploadBody = new URLSearchParams()
      uploadBody.set('access_token', input.accessToken)
      uploadBody.set('published', 'false')
      uploadBody.set('url', mediaUrl)

      const uploadResponse = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: uploadBody,
        cache: 'no-store',
      })

      const uploadJson = await uploadResponse.json().catch(() => null)
      if (!uploadResponse.ok || !uploadJson?.id) {
        const apiMessage = uploadJson?.error?.message ?? 'No se pudo subir la imagen para Facebook.'
        return {
          ok: false,
          detail: `Meta API rechazo la publicacion: ${apiMessage}`,
          externalId: null,
        }
      }

      const feedEndpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(input.pageId)}/feed`
      const feedBody = new URLSearchParams()
      feedBody.set('access_token', input.accessToken)
      feedBody.set('message', input.caption)
      feedBody.set('attached_media[0]', JSON.stringify({ media_fbid: uploadJson.id as string }))

      const feedResponse = await fetch(feedEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: feedBody,
        cache: 'no-store',
      })

      const feedJson = await feedResponse.json().catch(() => null)
      if (!feedResponse.ok) {
        const apiMessage = feedJson?.error?.message ?? 'No se pudo crear el post en feed de Facebook.'
        return {
          ok: false,
          detail: `Meta API rechazo la publicacion: ${apiMessage}`,
          externalId: null,
        }
      }

      const externalId = (feedJson?.id as string | undefined) ?? (uploadJson?.id as string | undefined) ?? null
      const visibilityCheck = externalId ? await ensureFacebookPostIsPublic(externalId, input.accessToken) : null

      return {
        ok: true,
        detail: `Publicado en Facebook Page ${input.pageId} (feed).${visibilityCheck ? ` ${visibilityCheck.detail}` : ''}`,
        externalId,
      }
    }

    const endpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(input.pageId)}/videos`
    const body = new URLSearchParams()
    body.set('access_token', input.accessToken)
    body.set('published', 'true')
    body.set('file_url', mediaUrl)
    body.set('description', input.caption)

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

    const externalId = (json?.post_id as string | undefined) ?? (json?.id as string | undefined) ?? null
    const visibilityCheck = externalId ? await ensureFacebookPostIsPublic(externalId, input.accessToken) : null

    return {
      ok: true,
      detail: `Publicado video en Facebook Page ${input.pageId}.${visibilityCheck ? ` ${visibilityCheck.detail}` : ''}`,
      externalId,
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

async function publishFacebookCarousel(input: {
  pageId: string
  accessToken: string
  caption: string
  mediaUrls: string[]
}) {
  // Para multi-imagen en Facebook (Page Feed) es más confiable:
  // 1) Subir fotos al endpoint /{pageId}/photos
  // 2) Publicar un post en /{pageId}/feed adjuntando las fotos con attached_media
  // Las fotos del paso 1 deben quedar no publicadas para evitar posts individuales.
  const uploadedMediaIds: string[] = []

  for (const mediaUrl of input.mediaUrls) {
    const publicMediaUrl = buildPublicMediaUrl(mediaUrl)
    const uploadEndpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(input.pageId)}/photos`
    const body = new URLSearchParams()
    body.set('access_token', input.accessToken)
    body.set('published', 'false')
    body.set('url', publicMediaUrl)

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    })

    const json = await response.json().catch(() => null)
    if (!response.ok || !json?.id) {
      const apiMessage = json?.error?.message ?? 'No se pudo subir una imagen para carrusel.'
      return { ok: false, detail: `Meta API rechazo el carrusel (upload): ${apiMessage}`, externalId: null }
    }

    uploadedMediaIds.push(json.id as string)
  }

  const feedEndpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(input.pageId)}/feed`
  const feedBody = new URLSearchParams()
  feedBody.set('access_token', input.accessToken)
  feedBody.set('message', input.caption)

  uploadedMediaIds.forEach((id, index) => {
    feedBody.set(`attached_media[${index}]`, JSON.stringify({ media_fbid: id }))
  })

  const feedResponse = await fetch(feedEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: feedBody,
    cache: 'no-store',
  })

  const feedJson = await feedResponse.json().catch(() => null)
  if (!feedResponse.ok) {
    const apiMessage = feedJson?.error?.message ?? 'No se pudo publicar el carrusel en Facebook.'
    return { ok: false, detail: `Meta API rechazo el carrusel: ${apiMessage}`, externalId: null }
  }

  return {
    ok: true,
    detail: `Carrusel publicado en Facebook Page ${input.pageId}.`,
    externalId: (feedJson?.id as string | undefined) ?? null,
  }
}

async function publishInstagramCarousel(input: {
  instagramUserId: string
  accessToken: string
  caption: string
  mediaUrls: string[]
}) {
  const childrenIds: string[] = []

  for (const mediaUrl of input.mediaUrls) {
    const publicMediaUrl = buildPublicMediaUrl(mediaUrl)
    const containerEndpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(input.instagramUserId)}/media`
    const body = new URLSearchParams()
    body.set('access_token', input.accessToken)
    body.set('image_url', publicMediaUrl)
    body.set('is_carousel_item', 'true')

    const response = await fetch(containerEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    })
    const json = await response.json().catch(() => null)
    if (!response.ok || !json?.id) {
      const apiMessage = json?.error?.message ?? 'No se pudo crear un item de carrusel en Instagram.'
      return { ok: false, detail: `Meta API rechazo el carrusel: ${apiMessage}`, externalId: null }
    }
    childrenIds.push(json.id as string)
  }

  const carouselContainerEndpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(input.instagramUserId)}/media`
  const carouselBody = new URLSearchParams()
  carouselBody.set('access_token', input.accessToken)
  carouselBody.set('media_type', 'CAROUSEL')
  carouselBody.set('caption', input.caption)
  carouselBody.set('children', childrenIds.join(','))

  const createCarouselResponse = await fetch(carouselContainerEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: carouselBody,
    cache: 'no-store',
  })
  const createCarouselJson = await createCarouselResponse.json().catch(() => null)
  if (!createCarouselResponse.ok || !createCarouselJson?.id) {
    const apiMessage = createCarouselJson?.error?.message ?? 'No se pudo crear el contenedor de carrusel.'
    return { ok: false, detail: `Meta API rechazo el carrusel: ${apiMessage}`, externalId: null }
  }
  const creationId = createCarouselJson.id as string

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
    const apiMessage = publishJson?.error?.message ?? 'No se pudo publicar el carrusel en Instagram.'
    return { ok: false, detail: `Meta API rechazo el carrusel: ${apiMessage}`, externalId: null }
  }

  return {
    ok: true,
    detail: `Carrusel publicado en Instagram Business ${input.instagramUserId}.`,
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

  const publisherInclude = {
    mediaAsset: {
      select: {
        id: true,
        url: true,
        fileName: true,
        type: true,
      },
    },
    mediaAssets: {
      orderBy: { sortOrder: 'asc' as const },
      select: {
        mediaAsset: {
          select: {
            id: true,
            url: true,
            fileName: true,
            type: true,
          },
        },
      },
    },
    project: {
      select: {
        id: true,
        name: true,
      },
    },
    publishingProject: {
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
  }

  let duePosts

  if (targetPostId) {
    duePosts = await prisma.scheduledPost.findMany({
      where: {
        id: targetPostId,
        status: {
          in: [PostStatus.scheduled, PostStatus.draft, PostStatus.published],
        },
      },
      orderBy: { publishAt: 'asc' },
      take: limit,
      include: publisherInclude,
    })
  } else {
    const [scheduledDue, recoveryRaw] = await Promise.all([
      prisma.scheduledPost.findMany({
        where: {
          status: PostStatus.scheduled,
          publishAt: { lte: now },
        },
        orderBy: { publishAt: 'asc' },
        take: limit,
        include: publisherInclude,
      }),
      prisma.scheduledPost.findMany({
        where: {
          status: PostStatus.published,
          recurrenceJson: { not: Prisma.DbNull },
        },
        orderBy: { publishAt: 'asc' },
        take: 60,
        include: publisherInclude,
      }),
    ])

    const recoveryFiltered = recoveryRaw
      .filter((row) => {
        if (row.recurrenceJson == null) return false
        const r = parseRecurrence(row.recurrenceJson)
        if (!r) return false
        return getNextRecurrenceDate(row.publishAt, r, now) !== null
      })
      .slice(0, Math.min(25, limit))

    const seen = new Set<string>()
    const merged: typeof scheduledDue = []
    for (const row of recoveryFiltered) {
      if (seen.has(row.id)) continue
      seen.add(row.id)
      merged.push(row)
    }
    for (const row of scheduledDue) {
      if (seen.has(row.id)) continue
      seen.add(row.id)
      merged.push(row)
    }
    duePosts = merged.slice(0, limit)
  }

  const items: PublishExecutionItem[] = []
  let published = 0
  let failed = 0
  let skipped = 0

  for (const post of duePosts) {
    try {
    await ensureProjectSocialAccounts(post.publishingProjectId)
    await syncProjectMedia(post.publishingProjectId).catch(() => null)
    const refreshedPost = await prisma.scheduledPost.findUnique({
      where: { id: post.id },
      include: {
        mediaAsset: {
          select: {
            id: true,
            url: true,
            fileName: true,
            type: true,
          },
        },
        mediaAssets: {
          orderBy: { sortOrder: 'asc' },
          select: {
            mediaAsset: {
              select: {
                id: true,
                url: true,
                fileName: true,
                type: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        publishingProject: {
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
    const activePost = refreshedPost ?? post

    if (activePost.status === PostStatus.published) {
      const recForRecovery = parseRecurrence(activePost.recurrenceJson)
      if (!recForRecovery) {
        skipped += 1
        items.push({
          postId: post.id,
          title: post.title,
          finalStatus: 'skipped',
          detail: 'Publicada sin repeticion activa reconocida.',
          platformResults: [],
        })
        continue
      }
      const nextRecoveryAt = getNextRecurrenceDate(activePost.publishAt, recForRecovery, now)
      if (!nextRecoveryAt) {
        skipped += 1
        items.push({
          postId: post.id,
          title: post.title,
          finalStatus: 'skipped',
          detail: 'Serie recurrente finalizada (sin mas ejecuciones segun reglas).',
          platformResults: [],
        })
        continue
      }
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: {
          status: PostStatus.scheduled,
          publishAt: nextRecoveryAt,
        },
      })
      await createActivityLog({
        level: 'info',
        category: 'publisher',
        action: 'recurrence_recovery_reschedule',
        targetType: 'scheduled_post',
        targetId: post.id,
        summary: `Recuperacion de ciclo recurrente para ${post.title}.`,
        detail: { nextPublishAt: nextRecoveryAt.toISOString() },
      })
      skipped += 1
      items.push({
        postId: post.id,
        title: post.title,
        finalStatus: 'skipped',
        detail: `Reprogramada para ${nextRecoveryAt.toISOString()} (ciclo recurrente activo).`,
        platformResults: [],
      })
      continue
    }

    const platforms = parsePlatforms(post.platformsJson)
    const recurrence = parseRecurrence(activePost.recurrenceJson)
    const parsedCaption = parseStoredCaption(activePost.caption)
    const publishCaption = composePublishCaption({
      title: activePost.title,
      subtitle: parsedCaption.subtitle,
      caption: parsedCaption.caption,
    })

    const orderedAssets = activePost.mediaAssets.map((entry) => entry.mediaAsset).filter((asset) => Boolean(asset?.url))
    const mediaCandidates = orderedAssets.length > 0 ? orderedAssets : (activePost.mediaAsset?.url ? [activePost.mediaAsset] : [])
    const imageUrls = mediaCandidates.filter((asset) => asset.type === 'image').map((asset) => asset.url)
    const primary = mediaCandidates[0]

    if (platforms.length === 0) {
      await safeUpdateScheduledPostPublishError({
        postId: post.id,
        status: PostStatus.failed,
        lastPublishError: 'Sin redes configuradas.',
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

    if (!primary?.url) {
      await safeUpdateScheduledPostPublishError({
        postId: post.id,
        status: PostStatus.failed,
        lastPublishError: 'Sin archivo multimedia disponible.',
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

    let lastCarouselErrorDetail: string | null = null
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

      const account = activePost.publishingProject.socialAccounts.find((item) => item.platform === platform)
      if (!account) {
        platformResults.push({
          platform: platformLabel,
          ok: false,
          detail: `No existe cuenta conectada para ${platformLabel} en ${activePost.publishingProject.name}.`,
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

      const shouldCarousel = imageUrls.length >= 2 && activePost.contentType !== 'story'
      let publishedResult: Awaited<ReturnType<typeof publishToMetaPlatform>>

      if (!shouldCarousel) {
        publishedResult = await publishWithRetry({
          platform,
          contentType: activePost.contentType,
          caption: publishCaption,
          mediaUrl: primary.url,
          mediaType: primary.type,
          instagramUserId: account.instagramUserId,
          pageId: account.pageId,
          accessToken: account.accessToken,
          accountUsername: account.username,
        })
      } else if (platform === 'facebook') {
        try {
          const carouselResult = await publishFacebookCarousel({
            pageId: account.pageId || '',
            accessToken: account.accessToken,
            caption: publishCaption,
            mediaUrls: imageUrls,
          })

          if (carouselResult.ok) {
            publishedResult = carouselResult
          } else {
            lastCarouselErrorDetail = carouselResult.detail

            // Fallback: si falla carrusel, intenta enviar un solo post con la imagen principal.
            const fallback = await publishWithRetry({
              platform,
              contentType: activePost.contentType,
              caption: publishCaption,
              mediaUrl: primary.url,
              mediaType: primary.type,
              instagramUserId: account.instagramUserId,
              pageId: account.pageId,
              accessToken: account.accessToken,
              accountUsername: account.username,
            })

            publishedResult = fallback.ok
              ? {
                  ...fallback,
                  detail: `${fallback.detail} (Carrusel fallback: ${carouselResult.detail})`,
                }
              : fallback
          }
        } catch (err) {
          lastCarouselErrorDetail = err instanceof Error ? err.message : String(err)
          publishedResult = await publishWithRetry({
            platform,
            contentType: activePost.contentType,
            caption: publishCaption,
            mediaUrl: primary.url,
            mediaType: primary.type,
            instagramUserId: account.instagramUserId,
            pageId: account.pageId,
            accessToken: account.accessToken,
            accountUsername: account.username,
          })
        }
      } else {
        try {
          const carouselResult = await publishInstagramCarousel({
            instagramUserId: account.instagramUserId || '',
            accessToken: account.accessToken,
            caption: publishCaption,
            mediaUrls: imageUrls,
          })

          if (carouselResult.ok) {
            publishedResult = carouselResult
          } else {
            lastCarouselErrorDetail = carouselResult.detail

            // Fallback: enviar una sola imagen si falla carrusel.
            const fallback = await publishWithRetry({
              platform,
              contentType: activePost.contentType,
              caption: publishCaption,
              mediaUrl: primary.url,
              mediaType: primary.type,
              instagramUserId: account.instagramUserId,
              pageId: account.pageId,
              accessToken: account.accessToken,
              accountUsername: account.username,
            })

            publishedResult = fallback.ok
              ? {
                  ...fallback,
                  detail: `${fallback.detail} (Carrusel fallback: ${carouselResult.detail})`,
                }
              : fallback
          }
        } catch (err) {
          lastCarouselErrorDetail = err instanceof Error ? err.message : String(err)
          publishedResult = await publishWithRetry({
            platform,
            contentType: activePost.contentType,
            caption: publishCaption,
            mediaUrl: primary.url,
            mediaType: primary.type,
            instagramUserId: account.instagramUserId,
            pageId: account.pageId,
            accessToken: account.accessToken,
            accountUsername: account.username,
          })
        }
      }

      platformResults.push({
        platform: platformLabel,
        ok: publishedResult.ok,
        detail: publishedResult.detail,
        externalId: publishedResult.externalId ?? null,
      })

      if (!publishedResult.ok) {
        if (isTransientMetaError(publishedResult.detail)) {
          hadTransientError = true
        } else {
          hadPermanentError = true
        }
        const detailText = publishedResult.detail ?? ''
        if (
          detailText.includes('OAuth') ||
          detailText.includes('token') ||
          detailText.includes('Error validating access token')
        ) {
          await prisma.socialAccount.update({
            where: { id: account.id },
            data: {
              status: AccountStatus.token_expiring,
              tokenLastChecked: new Date(),
              lastError: detailText,
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

    const hadAnySuccess = platformResults.some((entry) => Boolean(entry.ok))
    const nextPublishAt =
      hadAnySuccess && recurrence
        ? getNextRecurrenceDate(activePost.publishAt, recurrence, now)
        : null
    const shouldRescheduleRecurringPost = Boolean(hadAnySuccess && nextPublishAt)
    const finalStatus =
      shouldRescheduleRecurringPost
        ? PostStatus.scheduled
        : hadAnySuccess
          ? PostStatus.published
          : PostStatus.failed

    const failureLines = platformResults
      .filter((entry) => !entry.ok)
      .map((entry) => `${entry.platform}: ${entry.detail ?? 'Sin detalle'}`)
      .slice(0, 10)
    const failureMessage = finalStatus === PostStatus.failed ? failureLines.join('\n') || lastCarouselErrorDetail || 'Error de publicacion.' : null

    if (shouldRescheduleRecurringPost && nextPublishAt) {
      try {
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: PostStatus.scheduled,
            publishAt: nextPublishAt,
            lastPublishError: null,
            lastPublishDetails: platformResults as unknown as Prisma.InputJsonValue,
          } as any,
        })
      } catch {
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: PostStatus.scheduled,
            publishAt: nextPublishAt,
          },
        })
      }
    } else {
      await safeUpdateScheduledPostPublishError({
        postId: post.id,
        status: finalStatus,
        lastPublishError: failureMessage,
        lastPublishDetails: platformResults as unknown as Prisma.InputJsonValue,
      })
    }

    if (finalStatus === PostStatus.failed) {
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
          action: shouldRescheduleRecurringPost ? 'publish_success_rescheduled' : 'publish_success',
          targetType: 'scheduled_post',
          targetId: post.id,
          summary: shouldRescheduleRecurringPost
            ? `Publicacion completada y reprogramada para ${post.title}.`
            : `Publicacion completada para ${post.title}.`,
          detail: {
            platformResults,
            ...(nextPublishAt ? { nextPublishAt: nextPublishAt.toISOString() } : {}),
          },
        }),
        createNotification({
          type: 'success',
          title: shouldRescheduleRecurringPost ? 'Publicacion recurrente ejecutada' : 'Publicacion exitosa',
          message: shouldRescheduleRecurringPost
            ? `"${post.title}" se publico y quedo reprogramada para ${nextPublishAt?.toLocaleString()}.`
            : `"${post.title}" se proceso correctamente.`,
          href: '/publicaciones-programadas',
          metadata: {
            postId: post.id,
            platformResults,
            ...(nextPublishAt ? { nextPublishAt: nextPublishAt.toISOString() } : {}),
          },
        }),
      ])
      published += 1
      items.push({
        postId: post.id,
        title: post.title,
        finalStatus: 'published',
        detail: shouldRescheduleRecurringPost
          ? `Publicacion procesada correctamente. Siguiente ejecucion: ${nextPublishAt?.toISOString()}.`
          : 'Publicacion procesada correctamente.',
        platformResults,
      })
    }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? err.stack : undefined

      await safeUpdateScheduledPostPublishError({
        postId: post.id,
        status: PostStatus.failed,
        lastPublishError: message,
        lastPublishDetails: { message, stack } as unknown as Prisma.InputJsonValue,
      })

      failed += 1
      items.push({
        postId: post.id,
        title: post.title,
        finalStatus: 'failed',
        detail: message,
        platformResults: [],
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
  const [dueNow, nextHour, disconnectedAccounts, expiringAccounts, recoveryCandidates] = await Promise.all([
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
    prisma.scheduledPost.findMany({
      where: {
        status: PostStatus.published,
        recurrenceJson: { not: Prisma.DbNull },
      },
      select: {
        id: true,
        publishAt: true,
        recurrenceJson: true,
      },
      take: 80,
    }),
  ])

  const publishedRecurringRecoverable = recoveryCandidates.filter((row) => {
    if (row.recurrenceJson == null) return false
    const r = parseRecurrence(row.recurrenceJson)
    if (!r) return false
    return getNextRecurrenceDate(row.publishAt, r, now) !== null
  }).length

  return {
    mode: process.env.PUBLISHER_MODE?.trim().toLowerCase() || 'mock',
    dueNow,
    nextHour,
    publishedRecurringRecoverable,
    disconnectedAccounts,
    expiringAccounts,
    checkedAt: now.toISOString(),
  }
}

export async function getProjectPublishingReadiness(projectId: string): Promise<ProjectPublishingReadiness> {
  const project = await resolveProjectRecord(projectId)

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

  await ensureProjectSocialAccounts(project.id)
  const accounts = await prisma.socialAccount.findMany({
      where: { projectId: project.id },
      select: {
        id: true,
        platform: true,
        status: true,
        pageId: true,
        instagramUserId: true,
        accessToken: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

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
    projectId: project.id,
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
