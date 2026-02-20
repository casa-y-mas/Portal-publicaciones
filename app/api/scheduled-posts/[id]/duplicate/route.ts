import { PostStatus, Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SUBTITLE_MARKER = '[SUBTITULO]'

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
  contentType: string
  publishAt: Date
  status: string
  projectId: string
  mediaAssetId: string | null
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
    mediaAssetId: item.mediaAssetId,
    thumbnail: item.thumbnail ?? item.mediaAsset?.fileName ?? null,
    recurrence: parseRecurrence(item.recurrenceJson),
  }
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const { id } = await context.params

  const original = await prisma.scheduledPost.findUnique({
    where: { id },
  })

  if (!original) {
    return NextResponse.json({ message: 'Publicacion no encontrada.' }, { status: 404 })
  }

  const duplicated = await prisma.scheduledPost.create({
    data: {
      title: `${original.title} (Copia)`,
      caption: original.caption,
      contentType: original.contentType,
      status: PostStatus.draft,
      publishAt: new Date(original.publishAt.getTime() + 60 * 60 * 1000),
      recurrenceJson: original.recurrenceJson
        ? (original.recurrenceJson as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      platformsJson: original.platformsJson as Prisma.InputJsonValue,
      thumbnail: original.thumbnail,
      projectId: original.projectId,
      creatorId: session.user.id,
      approverId: null,
      mediaAssetId: original.mediaAssetId,
    },
  })

  const duplicatedWithRelations = await prisma.scheduledPost.findUnique({
    where: { id: duplicated.id },
    include: {
      project: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true } },
      mediaAsset: { select: { id: true, fileName: true } },
    },
  })

  if (!duplicatedWithRelations) {
    return NextResponse.json({ message: 'No se pudo recuperar la publicacion duplicada.' }, { status: 500 })
  }

  return NextResponse.json({ item: serializePost(duplicatedWithRelations) }, { status: 201 })
}
