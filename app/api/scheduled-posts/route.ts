import { ContentType, PostStatus, Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveProjectRecord } from '@/lib/project-resolution'

const SUBTITLE_MARKER = '[SUBTITULO]'

const createScheduledPostSchema = z.object({
  title: z.string().trim().min(3).max(180),
  subtitle: z.string().trim().max(200).optional().or(z.literal('')),
  caption: z.string().trim().min(3).max(5000),
  contentType: z.nativeEnum(ContentType),
  status: z.nativeEnum(PostStatus),
  publishAt: z.string().datetime(),
  projectId: z.string().min(1),
  platforms: z.array(z.string().trim().min(1)).min(1),
  recurrence: z.record(z.string(), z.unknown()).nullable().optional(),
  thumbnail: z.string().trim().optional().or(z.literal('')),
  mediaAssetId: z.string().trim().optional().or(z.literal('')),
  mediaAssetIds: z.array(z.string().trim().min(1)).optional(),
})

type RecurrenceInfo = {
  enabled: boolean
  type?: 'hourly' | 'daily' | 'weekday' | 'weekend' | 'weekly' | 'custom' | null
  endType?: 'never' | 'date'
  endDate?: string
  endTime?: string
  customFrequency?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'minutes'
  customInterval?: number
}

function parsePlatforms(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function includesFacebook(platforms: string[]) {
  return platforms.some((platform) => platform.trim().toLowerCase() === 'facebook')
}

function includesInstagram(platforms: string[]) {
  return platforms.some((platform) => platform.trim().toLowerCase() === 'instagram')
}

function parseRecurrence(value: Prisma.JsonValue | null): RecurrenceInfo | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const candidate = value as Record<string, unknown>
  if (candidate.enabled !== true) return undefined

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
  }
}

function composeCaption(caption: string, subtitle?: string): string {
  const trimmedSubtitle = subtitle?.trim()
  if (!trimmedSubtitle) return caption
  return `${SUBTITLE_MARKER} ${trimmedSubtitle}\n\n${caption}`
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

export async function GET() {
  const items = await prisma.scheduledPost.findMany({
    orderBy: { publishAt: 'desc' },
    include: {
      project: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true } },
      mediaAsset: { select: { id: true, fileName: true, url: true, type: true } },
      mediaAssets: {
        orderBy: { sortOrder: 'asc' },
        select: { mediaAssetId: true, mediaAsset: { select: { id: true, fileName: true, url: true, type: true } } },
      },
    },
  })

  return NextResponse.json({
    items: items.map((item) => ({
      ...parseStoredCaption(item.caption),
      id: item.id,
      title: item.title,
      platforms: parsePlatforms(item.platformsJson),
      contentType: item.contentType,
      publishAt: item.publishAt.toISOString(),
      status: item.status,
      creator: item.creator.name,
      approver: item.approver?.name ?? null,
      project: item.project.name,
      projectId: item.projectId,
      mediaAssetId: item.mediaAssetId,
      mediaAssetIds: item.mediaAssets.map((entry) => entry.mediaAssetId),
      mediaAssets: item.mediaAssets.map((entry) => entry.mediaAsset),
      thumbnail: item.thumbnail ?? item.mediaAsset?.fileName ?? null,
      recurrence: parseRecurrence(item.recurrenceJson),
      publishError: item.lastPublishError ?? null,
    })),
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const raw = await request.json()
  const parsed = createScheduledPostSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Payload invalido.', errors: parsed.error.flatten() }, { status: 400 })
  }

  const project = await resolveProjectRecord(parsed.data.projectId)
  if (!project) {
    return NextResponse.json({ message: 'Proyecto no encontrado.' }, { status: 404 })
  }
  const resolvedProjectId = project.id

  // Usar `raw` para evitar que un schema viejo/estricto de Zod ignore el campo,
  // y así garantizar que guardamos el array enviado desde el frontend.
  const incomingMediaAssetIds = Array.isArray((raw as any)?.mediaAssetIds)
    ? (raw as any).mediaAssetIds.filter(Boolean)
    : []
  const mediaAssetIdFromLegacy = parsed.data.mediaAssetId || ''
  const mediaAssetIds = Array.from(new Set([mediaAssetIdFromLegacy, ...incomingMediaAssetIds].filter(Boolean)))
  const mediaAssetId = mediaAssetIds[0] || null
  const publishAt = new Date(parsed.data.publishAt)

  if (Number.isNaN(publishAt.getTime())) {
    return NextResponse.json({ message: 'Fecha/hora invalida.' }, { status: 400 })
  }

  if (parsed.data.status === PostStatus.scheduled) {
    if (publishAt.getTime() < Date.now()) {
      return NextResponse.json({ message: 'No puedes programar en una fecha pasada.' }, { status: 400 })
    }
    if (!mediaAssetId) {
      return NextResponse.json({ message: 'Para programar debes asociar un archivo multimedia.' }, { status: 400 })
    }
    if (parsed.data.platforms.length === 0) {
      return NextResponse.json({ message: 'Para programar debes seleccionar al menos una red.' }, { status: 400 })
    }
    if (includesFacebook(parsed.data.platforms)) {
      const facebookAccount = await prisma.socialAccount.findFirst({
        where: {
          projectId: resolvedProjectId,
          platform: 'facebook',
          status: { in: ['connected', 'token_expiring'] },
        },
        select: {
          id: true,
          pageId: true,
          accessToken: true,
        },
      })

      if (!facebookAccount) {
        return NextResponse.json(
          { message: 'No hay cuenta de Facebook conectada para este proyecto.' },
          { status: 400 },
        )
      }

      if (!facebookAccount.pageId || !facebookAccount.accessToken) {
        return NextResponse.json(
          { message: 'La cuenta Facebook conectada aun no tiene pagina seleccionada o token valido.' },
          { status: 400 },
        )
      }
    }
    if (includesInstagram(parsed.data.platforms)) {
      if (parsed.data.contentType === ContentType.story) {
        return NextResponse.json(
          { message: 'Instagram Stories aun no estan habilitadas en esta fase.' },
          { status: 400 },
        )
      }

      const instagramAccount = await prisma.socialAccount.findFirst({
        where: {
          projectId: resolvedProjectId,
          platform: 'instagram',
          status: { in: ['connected', 'token_expiring'] },
        },
        select: {
          id: true,
          instagramUserId: true,
          accessToken: true,
        },
      })

      if (!instagramAccount) {
        return NextResponse.json(
          { message: 'No hay cuenta de Instagram conectada para este proyecto.' },
          { status: 400 },
        )
      }

      if (!instagramAccount.instagramUserId || !instagramAccount.accessToken) {
        return NextResponse.json(
          { message: 'La cuenta Instagram conectada no tiene instagramUserId o token valido.' },
          { status: 400 },
        )
      }
    }
  }

  if (mediaAssetIds.length > 0) {
    const media = await prisma.mediaAsset.findMany({
      where: { id: { in: mediaAssetIds } },
      select: { id: true, projectId: true },
    })
    if (media.length !== mediaAssetIds.length) {
      return NextResponse.json({ message: 'Una o mas medias no fueron encontradas.' }, { status: 404 })
    }
    const wrongProject = media.find((item) => item.projectId !== resolvedProjectId)
    if (wrongProject) {
      return NextResponse.json({ message: 'La media debe pertenecer al mismo proyecto.' }, { status: 400 })
    }
  }

  let created
  try {
    created = await prisma.scheduledPost.create({
      data: {
        title: parsed.data.title,
        caption: composeCaption(parsed.data.caption, parsed.data.subtitle),
        contentType: parsed.data.contentType,
        status: parsed.data.status,
        publishAt,
        projectId: resolvedProjectId,
        creatorId: session.user.id,
        mediaAssetId,
        thumbnail: parsed.data.thumbnail || null,
        platformsJson: parsed.data.platforms,
        recurrenceJson: parsed.data.recurrence ? (parsed.data.recurrence as Prisma.InputJsonValue) : Prisma.JsonNull,
        mediaAssets:
          mediaAssetIds.length > 0
            ? {
                // Usar `create` en lugar de `createMany` para evitar fallos con inserciones en relaciones.
                create: mediaAssetIds.map((id, index) => ({ mediaAssetId: id, sortOrder: index })),
              }
            : undefined,
      },
    })
  } catch (err) {
    console.error('Error al crear scheduled post con mediaAssetIds', {
      projectId: parsed.data.projectId,
      mediaAssetIds,
      legacyMediaAssetId: parsed.data.mediaAssetId,
      err,
    })
    const detailsMessage = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { message: `Error al guardar la publicacion programada: ${detailsMessage}`, details: detailsMessage },
      { status: 500 },
    )
  }

  const createdWithRelations = await prisma.scheduledPost.findUnique({
    where: { id: created.id },
    include: {
      project: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true } },
      mediaAsset: { select: { id: true, fileName: true, url: true, type: true } },
      mediaAssets: {
        orderBy: { sortOrder: 'asc' },
        select: { mediaAssetId: true, mediaAsset: { select: { id: true, fileName: true, url: true, type: true } } },
      },
    },
  })

  if (!createdWithRelations) {
    return NextResponse.json({ message: 'No se pudo recuperar la publicacion creada.' }, { status: 500 })
  }

  return NextResponse.json(
    {
      item: {
        ...parseStoredCaption(createdWithRelations.caption),
        id: createdWithRelations.id,
        title: createdWithRelations.title,
        platforms: parsePlatforms(createdWithRelations.platformsJson),
        contentType: createdWithRelations.contentType,
        publishAt: createdWithRelations.publishAt.toISOString(),
        status: createdWithRelations.status,
        creator: createdWithRelations.creator.name,
        approver: createdWithRelations.approver?.name ?? null,
        project: createdWithRelations.project.name,
        projectId: createdWithRelations.projectId,
        mediaAssetId: createdWithRelations.mediaAssetId,
        mediaAssetIds: createdWithRelations.mediaAssets.map((entry) => entry.mediaAssetId),
        mediaAssets: createdWithRelations.mediaAssets.map((entry) => entry.mediaAsset),
        thumbnail: createdWithRelations.thumbnail ?? createdWithRelations.mediaAsset?.fileName ?? null,
        recurrence: parseRecurrence(createdWithRelations.recurrenceJson),
      },
    },
    { status: 201 },
  )
}
