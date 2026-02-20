import { PostStatus, Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

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

const normalize = (value: string) => value.trim().toLowerCase().replace(/_/g, '-')

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const platform = searchParams.get('platform') || 'all'
  const statusFilter = searchParams.get('status') || 'all'
  const project = searchParams.get('project') || 'all'
  const user = searchParams.get('user') || 'all'

  const where: Prisma.ScheduledPostWhereInput = {
    ...(start && end
      ? {
          publishAt: {
            gte: new Date(start),
            lt: new Date(end),
          },
        }
      : {}),
    ...(project !== 'all' ? { projectId: project } : {}),
    ...(user !== 'all'
      ? {
          creator: {
            name: user,
          },
        }
      : {}),
  }

  const normalizedStatus = statusFilter.replace(/-/g, '_')
  if (statusFilter !== 'all' && Object.values(PostStatus).includes(normalizedStatus as PostStatus)) {
    where.status = normalizedStatus as PostStatus
  }

  const items = await prisma.scheduledPost.findMany({
    where,
    orderBy: { publishAt: 'asc' },
    include: {
      project: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true } },
      mediaAsset: { select: { id: true, fileName: true } },
    },
  })

  const filteredByPlatform = items.filter((item) => {
    if (platform === 'all') return true
    return parsePlatforms(item.platformsJson).some((entry) => normalize(entry).includes(platform))
  })

  return NextResponse.json({
    items: filteredByPlatform.map((item) => ({
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
    })),
  })
}
