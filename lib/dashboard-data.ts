import { PostStatus, Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

type RecurrenceInfo = {
  enabled: boolean
  type?: 'hourly' | 'daily' | 'weekday' | 'weekend' | 'weekly' | 'custom' | null
  endType?: 'never' | 'date'
  endDate?: string
  customFrequency?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  customInterval?: number
}

export interface DashboardStatsData {
  scheduledToday: number
  scheduledThisWeek: number
  pendingApproval: number
  failedPosts: number
}

export interface DashboardUpcomingPost {
  id: string
  title: string
  caption: string
  status: string
  contentType: string
  publishAt: string
  thumbnail: string | null
  platforms: string[]
  project: string
  creator: string
  approver: string | null
  recurrence?: RecurrenceInfo
}

function toStartOfDay(date: Date): Date {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function toEndOfDay(date: Date): Date {
  const value = new Date(date)
  value.setHours(23, 59, 59, 999)
  return value
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

export async function getDashboardStats(): Promise<DashboardStatsData> {
  const now = new Date()
  const startOfToday = toStartOfDay(now)
  const endOfToday = toEndOfDay(now)
  const endOfWeek = new Date(now)
  endOfWeek.setDate(endOfWeek.getDate() + 7)

  const [scheduledToday, scheduledThisWeek, pendingApproval, failedPosts] = await Promise.all([
    prisma.scheduledPost.count({
      where: {
        status: PostStatus.scheduled,
        publishAt: { gte: startOfToday, lte: endOfToday },
      },
    }),
    prisma.scheduledPost.count({
      where: {
        status: { in: [PostStatus.scheduled, PostStatus.pending_approval] },
        publishAt: { gte: now, lte: endOfWeek },
      },
    }),
    prisma.scheduledPost.count({ where: { status: PostStatus.pending_approval } }),
    prisma.scheduledPost.count({ where: { status: PostStatus.failed } }),
  ])

  return {
    scheduledToday,
    scheduledThisWeek,
    pendingApproval,
    failedPosts,
  }
}

export async function getUpcomingPosts(limit = 5): Promise<DashboardUpcomingPost[]> {
  const now = new Date()
  const posts = await prisma.scheduledPost.findMany({
    where: {
      publishAt: { gte: now },
      status: { in: [PostStatus.scheduled, PostStatus.pending_approval, PostStatus.draft] },
    },
    orderBy: { publishAt: 'asc' },
    take: limit,
    include: {
      project: { select: { name: true } },
      creator: { select: { name: true } },
      approver: { select: { name: true } },
      mediaAsset: { select: { fileName: true } },
    },
  })

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    caption: post.caption,
    status: post.status,
    contentType: post.contentType,
    publishAt: post.publishAt.toISOString(),
    thumbnail: post.thumbnail ?? post.mediaAsset?.fileName ?? null,
    platforms: parsePlatforms(post.platformsJson),
    project: post.project.name,
    creator: post.creator.name,
    approver: post.approver?.name ?? null,
    recurrence: parseRecurrence(post.recurrenceJson),
  }))
}
