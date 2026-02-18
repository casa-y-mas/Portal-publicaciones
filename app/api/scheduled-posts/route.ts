import { ContentType, PostStatus, Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
})

type RecurrenceInfo = {
  enabled: boolean
  type?: 'hourly' | 'daily' | 'weekday' | 'weekend' | 'weekly' | 'custom' | null
  endType?: 'never' | 'date'
  endDate?: string
  customFrequency?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  customInterval?: number
}

function parsePlatforms(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
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
      mediaAsset: { select: { id: true, fileName: true } },
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
      thumbnail: item.thumbnail ?? item.mediaAsset?.fileName ?? null,
      recurrence: parseRecurrence(item.recurrenceJson),
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

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    select: { id: true },
  })
  if (!project) {
    return NextResponse.json({ message: 'Proyecto no encontrado.' }, { status: 404 })
  }

  const mediaAssetId = parsed.data.mediaAssetId || null
  if (mediaAssetId) {
    const media = await prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
      select: { id: true, projectId: true },
    })
    if (!media) {
      return NextResponse.json({ message: 'Media no encontrada.' }, { status: 404 })
    }
    if (media.projectId !== parsed.data.projectId) {
      return NextResponse.json({ message: 'La media debe pertenecer al mismo proyecto.' }, { status: 400 })
    }
  }

  const created = await prisma.scheduledPost.create({
    data: {
      title: parsed.data.title,
      caption: composeCaption(parsed.data.caption, parsed.data.subtitle),
      contentType: parsed.data.contentType,
      status: parsed.data.status,
      publishAt: new Date(parsed.data.publishAt),
      projectId: parsed.data.projectId,
      creatorId: session.user.id,
      mediaAssetId,
      thumbnail: parsed.data.thumbnail || null,
      platformsJson: parsed.data.platforms,
      recurrenceJson: parsed.data.recurrence
        ? (parsed.data.recurrence as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  })

  const createdWithRelations = await prisma.scheduledPost.findUnique({
    where: { id: created.id },
    include: {
      project: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true } },
      mediaAsset: { select: { id: true, fileName: true } },
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
        thumbnail: createdWithRelations.thumbnail ?? createdWithRelations.mediaAsset?.fileName ?? null,
        recurrence: parseRecurrence(createdWithRelations.recurrenceJson),
      },
    },
    { status: 201 },
  )
}
