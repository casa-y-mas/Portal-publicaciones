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
  interactions: number
  likes: number
  comments: number
  shares: number
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

function parsePlatformResults(value: Prisma.JsonValue | null): Array<{ ok?: boolean; platform?: string; externalId?: string | null }> {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is { ok?: boolean; platform?: string; externalId?: string | null } => typeof item === 'object' && item !== null)
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

async function fetchGraph(url: URL) {
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  const json = (await response.json().catch(() => null)) as
    | { error?: { message?: string }; [key: string]: unknown }
    | null
  if (!response.ok) {
    throw new Error(json?.error?.message ?? 'Error consultando Graph API.')
  }
  return json
}

async function fetchFacebookPostInteractions(postId: string, token: string) {
  const url = new URL(`https://graph.facebook.com/v19.0/${encodeURIComponent(postId)}`)
  url.searchParams.set('fields', 'reactions.summary(true),comments.summary(true),shares')
  url.searchParams.set('access_token', token)
  const json = await fetchGraph(url)
  const likes = asNumber((json?.reactions as { summary?: { total_count?: unknown } } | undefined)?.summary?.total_count)
  const comments = asNumber((json?.comments as { summary?: { total_count?: unknown } } | undefined)?.summary?.total_count)
  const shares = asNumber((json?.shares as { count?: unknown } | undefined)?.count)
  return { likes, comments, shares }
}

async function fetchInstagramPostInteractions(mediaId: string, token: string) {
  const url = new URL(`https://graph.facebook.com/v19.0/${encodeURIComponent(mediaId)}`)
  url.searchParams.set('fields', 'like_count,comments_count')
  url.searchParams.set('access_token', token)
  const json = await fetchGraph(url)
  const likes = asNumber(json?.like_count)
  const comments = asNumber(json?.comments_count)
  return { likes, comments, shares: 0 }
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
              platform: true,
              accessToken: true,
            },
          },
        },
      },
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
    let likes = 0
    let comments = 0
    let shares = 0

    if ((process.env.PUBLISHER_MODE?.trim().toLowerCase() || 'mock') === 'live' && row.status === PostStatus.published) {
      for (const result of results) {
        const platform = typeof result.platform === 'string' ? result.platform.trim().toLowerCase() : ''
        const externalId = typeof result.externalId === 'string' ? result.externalId.trim() : ''
        if (!externalId || !platform) continue
        const accountToken = row.publishingProject.socialAccounts.find((acc) => acc.platform === platform)?.accessToken ?? null
        if (!accountToken) continue

        try {
          if (platform === 'facebook') {
            const fb = await fetchFacebookPostInteractions(externalId, accountToken)
            likes += fb.likes
            comments += fb.comments
            shares += fb.shares
          } else if (platform === 'instagram') {
            const ig = await fetchInstagramPostInteractions(externalId, accountToken)
            likes += ig.likes
            comments += ig.comments
          }
        } catch {
          // Si una publicacion no soporta metrica por permisos/tipo, se omite sin romper reportes.
        }
      }
    }
    const interactions = likes + comments + shares

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

    const projectItem = byProjectMap.get(row.publishingProject.id) ?? {
      projectId: row.publishingProject.id,
      projectName: row.publishingProject.name,
      total: 0,
      published: 0,
      failed: 0,
    }
    projectItem.total += 1
    if (row.status === PostStatus.published) projectItem.published += 1
    if (row.status === PostStatus.failed) projectItem.failed += 1
    byProjectMap.set(row.publishingProject.id, projectItem)

    postItems.push({
      id: row.id,
      title: row.title,
      projectName: row.project?.name ?? row.publishingProject.name,
      publishAt: row.publishAt.toISOString(),
      status: normalizedStatus,
      platforms,
      executions,
      successCount,
      failedCount,
      successRate,
      interactions,
      likes,
      comments,
      shares,
      level: interactions >= 20 || successRate >= 90 ? 'alto' : interactions >= 5 || successRate >= 60 ? 'medio' : 'bajo',
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
        if (b.interactions !== a.interactions) return b.interactions - a.interactions
        if (b.successRate !== a.successRate) return b.successRate - a.successRate
        return new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime()
      })
      .slice(0, 30),
  }
}

