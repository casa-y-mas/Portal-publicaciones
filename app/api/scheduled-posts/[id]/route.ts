import { ContentType, PostStatus, Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SUBTITLE_MARKER = '[SUBTITULO]'

const updateScheduledPostSchema = z.object({
  title: z.string().trim().min(3).max(180).optional(),
  subtitle: z.string().trim().max(200).optional().or(z.literal('')),
  caption: z.string().trim().min(3).max(5000).optional(),
  contentType: z.nativeEnum(ContentType).optional(),
  status: z.nativeEnum(PostStatus).optional(),
  publishAt: z.string().datetime().optional(),
  thumbnail: z.string().trim().optional().or(z.literal('')),
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

function serializePost(item: {
  id: string
  title: string
  caption: string
  contentType: ContentType
  publishAt: Date
  status: PostStatus
  projectId: string
  thumbnail: string | null
  recurrenceJson: Prisma.JsonValue | null
  platformsJson: Prisma.JsonValue
  project: { id: string; name: string }
  creator: { id: string; name: string }
  approver: { id: string; name: string } | null
  mediaAsset: { id: string; fileName: string } | null
}) {
  return {
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
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const { id } = await context.params
  const raw = await request.json()
  const parsed = updateScheduledPostSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Payload invalido.', errors: parsed.error.flatten() }, { status: 400 })
  }

  const existing = await prisma.scheduledPost.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true } },
      mediaAsset: { select: { id: true, fileName: true } },
    },
  })

  if (!existing) {
    return NextResponse.json({ message: 'Publicacion no encontrada.' }, { status: 404 })
  }

  const current = parseStoredCaption(existing.caption)
  const nextSubtitle = parsed.data.subtitle !== undefined ? parsed.data.subtitle : current.subtitle ?? ''
  const nextCaption = parsed.data.caption !== undefined ? parsed.data.caption : current.caption

  const updated = await prisma.scheduledPost.update({
    where: { id },
    data: {
      title: parsed.data.title,
      contentType: parsed.data.contentType,
      status: parsed.data.status,
      publishAt: parsed.data.publishAt ? new Date(parsed.data.publishAt) : undefined,
      thumbnail: parsed.data.thumbnail !== undefined ? parsed.data.thumbnail || null : undefined,
      caption: composeCaption(nextCaption, nextSubtitle),
    },
    include: {
      project: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true } },
      mediaAsset: { select: { id: true, fileName: true } },
    },
  })

  return NextResponse.json({ item: serializePost(updated) })
}
