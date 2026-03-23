import { PostStatus, Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

type PlatformStat = {
  platform: string
  total: number
  published: number
  failed: number
}

type ProjectStat = {
  projectId: string
  projectName: string
  total: number
  published: number
  failed: number
}

type PostPerformanceItem = {
  id: string
  title: string
  projectName: string
  publishAt: string
  status: string
  platforms: string[]
  executions: number
  successCount: number
  failedCount: number
  successRate: number
  level: 'alto' | 'medio' | 'bajo'
}

export interface PostPerformanceSummary {
  periodDays: number
  totals: {
    totalPosts: number
    published: number
    failed: number
    avgSuccessRate: number
  }
  byPlatform: PlatformStat[]
  byProject: ProjectStat[]
  topPosts: PostPerformanceItem[]
}

function clampDays(input: number) {
  if (!Number.isFinite(input)) return 30
  return Math.min(Math.max(Math.trunc(input), 1), 180)
}

function parsePlatforms(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function normalizeStatus(value: string) {
  return value.trim().toLowerCase().replace(/_/g, '-')
}

function parsePlatformResults(value: Prisma.JsonValue | null): Array<{ ok?: boolean; platform?: string }> {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is { ok?: boolean; platform?: string } => typeof item === 'object' && item !== null)
}

export async function getPostPerformanceSummary(daysInput = 30): Promise<PostPerformanceSummary> {
  const periodDays = clampDays(daysInput)
  const now = new Date()
  const since = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

  const rows = await prisma.scheduledPost.findMany({
    where: {
      publishAt: { gte: since, lte: now },
      status: { in: [PostStatus.published, PostStatus.failed, PostStatus.scheduled, PostStatus.pending_approval] },
    },
    orderBy: { publishAt: 'desc' },
    take: 400,
    select: {
      id: true,
      title: true,
      status: true,
      publishAt: true,
      platformsJson: true,
      lastPublishDetails: true,
      project: { select: { id: true, name: true } },
    },
  })

  const byPlatformMap = new Map<string, PlatformStat>()
  const byProjectMap = new Map<string, ProjectStat>()
  const postItems: PostPerformanceItem[] = []

  let published = 0
  let failed = 0
  let successRateSum = 0
  let successRateCount = 0

  for (const row of rows) {
    const platforms = parsePlatforms(row.platformsJson)
    const results = parsePlatformResults(row.lastPublishDetails)
    const executions = results.length > 0 ? results.length : Math.max(platforms.length, 1)
    const successCount = results.length > 0 ? results.filter((item) => item.ok === true).length : row.status === PostStatus.published ? executions : 0
    const failedCount = Math.max(0, executions - successCount)
    const successRate = executions > 0 ? Number(((successCount / executions) * 100).toFixed(1)) : 0
    const normalizedStatus = normalizeStatus(row.status)

    if (row.status === PostStatus.published) published += 1
    if (row.status === PostStatus.failed) failed += 1
    successRateSum += successRate
    successRateCount += 1

    for (const platform of platforms) {
      const key = platform.toLowerCase()
      const item = byPlatformMap.get(key) ?? { platform, total: 0, published: 0, failed: 0 }
      item.total += 1
      if (row.status === PostStatus.published) item.published += 1
      if (row.status === PostStatus.failed) item.failed += 1
      byPlatformMap.set(key, item)
    }

    const projectItem = byProjectMap.get(row.project.id) ?? {
      projectId: row.project.id,
      projectName: row.project.name,
      total: 0,
      published: 0,
      failed: 0,
    }
    projectItem.total += 1
    if (row.status === PostStatus.published) projectItem.published += 1
    if (row.status === PostStatus.failed) projectItem.failed += 1
    byProjectMap.set(row.project.id, projectItem)

    postItems.push({
      id: row.id,
      title: row.title,
      projectName: row.project.name,
      publishAt: row.publishAt.toISOString(),
      status: normalizedStatus,
      platforms,
      executions,
      successCount,
      failedCount,
      successRate,
      level: successRate >= 80 ? 'alto' : successRate >= 50 ? 'medio' : 'bajo',
    })
  }

  return {
    periodDays,
    totals: {
      totalPosts: rows.length,
      published,
      failed,
      avgSuccessRate: successRateCount > 0 ? Number((successRateSum / successRateCount).toFixed(1)) : 0,
    },
    byPlatform: Array.from(byPlatformMap.values()).sort((a, b) => b.total - a.total),
    byProject: Array.from(byProjectMap.values()).sort((a, b) => b.total - a.total),
    topPosts: postItems
      .sort((a, b) => {
        if (b.successRate !== a.successRate) return b.successRate - a.successRate
        return new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime()
      })
      .slice(0, 30),
  }
}

