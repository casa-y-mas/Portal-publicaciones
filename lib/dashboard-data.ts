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
  aiScore: number
  aiPriority: 'Alta' | 'Media' | 'Baja'
  suggestedWindow: string
}

export interface DashboardStatusMixItem {
  status: string
  total: number
}

export interface DashboardPlatformMixItem {
  platform: string
  total: number
}

export interface DashboardProjectPulseItem {
  project: string
  upcoming: number
}

export interface DashboardCommandCenterData {
  healthScore: number
  pendingApprovalNext24h: number
  failedLast7d: number
  scheduledNext7d: number
  statusMix: DashboardStatusMixItem[]
  platformMix: DashboardPlatformMixItem[]
  projectPulse: DashboardProjectPulseItem[]
}

export interface OperationalIncidentItem {
  id: string
  type: 'approval' | 'failed' | 'missing_media'
  severity: 'alta' | 'media'
  title: string
  project: string
  publishAt: string
  actionHref: string
}

export interface ProjectOptimizationRecommendation {
  projectId: string
  projectName: string
  recommendedPlatform: string
  recommendedWindow: string
  successRate: number
  confidence: number
  sampleSize: number
  rationale: string
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

  return posts.map((post) => {
    const platforms = parsePlatforms(post.platformsJson)
    const diffHours = Math.max(0, (post.publishAt.getTime() - now.getTime()) / (1000 * 60 * 60))
    const urgency = diffHours <= 12 ? 24 : diffHours <= 24 ? 16 : diffHours <= 72 ? 8 : 2
    const approvalPenalty = post.status === PostStatus.pending_approval ? 22 : 0
    const draftPenalty = post.status === PostStatus.draft ? 14 : 0
    const platformWeight = Math.min(12, platforms.length * 4)
    const recurrenceWeight = post.recurrenceJson ? 6 : 0
    const aiScore = clamp(42 + urgency + platformWeight + recurrenceWeight - approvalPenalty - draftPenalty, 0, 100)
    const aiPriority: DashboardUpcomingPost['aiPriority'] = aiScore >= 72 ? 'Alta' : aiScore >= 48 ? 'Media' : 'Baja'
    const suggestedWindow = platforms.includes('Instagram') || platforms.includes('TikTok') ? '19:00-21:00' : '10:00-12:00'

    return {
      id: post.id,
      title: post.title,
      caption: post.caption,
      status: post.status,
      contentType: post.contentType,
      publishAt: post.publishAt.toISOString(),
      thumbnail: post.thumbnail ?? post.mediaAsset?.fileName ?? null,
      platforms,
      project: post.project.name,
      creator: post.creator.name,
      approver: post.approver?.name ?? null,
      recurrence: parseRecurrence(post.recurrenceJson),
      aiScore,
      aiPriority,
      suggestedWindow,
    }
  })
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function windowKeyFromHour(hour: number): string {
  if (hour >= 8 && hour <= 11) return '08:00-11:59'
  if (hour >= 12 && hour <= 15) return '12:00-15:59'
  if (hour >= 16 && hour <= 18) return '16:00-18:59'
  if (hour >= 19 && hour <= 22) return '19:00-22:59'
  return '23:00-07:59'
}

function smoothRate(success: number, failed: number, alpha = 1, beta = 1): number {
  return (success + alpha) / (success + failed + alpha + beta)
}

export async function getDashboardCommandCenter(): Promise<DashboardCommandCenterData> {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const posts = await prisma.scheduledPost.findMany({
    where: {
      OR: [
        { publishAt: { gte: last7d } },
        { status: { in: [PostStatus.scheduled, PostStatus.pending_approval, PostStatus.draft] } },
      ],
    },
    select: {
      status: true,
      publishAt: true,
      platformsJson: true,
      project: { select: { name: true } },
    },
    orderBy: { publishAt: 'desc' },
    take: 400,
  })

  const statusCounter = new Map<string, number>()
  const platformCounter = new Map<string, number>()
  const projectUpcomingCounter = new Map<string, number>()

  let pendingApprovalNext24h = 0
  let failedLast7d = 0
  let scheduledNext7d = 0
  let cancelledLast7d = 0

  for (const post of posts) {
    const normalizedStatus = post.status.toString()
    statusCounter.set(normalizedStatus, (statusCounter.get(normalizedStatus) ?? 0) + 1)

    if (normalizedStatus === PostStatus.pending_approval && post.publishAt >= now && post.publishAt <= in24h) {
      pendingApprovalNext24h += 1
    }
    if (normalizedStatus === PostStatus.failed && post.publishAt >= last7d) {
      failedLast7d += 1
    }
    if (normalizedStatus === PostStatus.cancelled && post.publishAt >= last7d) {
      cancelledLast7d += 1
    }
    if (
      (normalizedStatus === PostStatus.scheduled || normalizedStatus === PostStatus.pending_approval) &&
      post.publishAt >= now &&
      post.publishAt <= in7d
    ) {
      scheduledNext7d += 1
      projectUpcomingCounter.set(post.project.name, (projectUpcomingCounter.get(post.project.name) ?? 0) + 1)
    }

    for (const platform of parsePlatforms(post.platformsJson)) {
      platformCounter.set(platform, (platformCounter.get(platform) ?? 0) + 1)
    }
  }

  const healthScore = clamp(100 - pendingApprovalNext24h * 6 - failedLast7d * 9 - cancelledLast7d * 4, 20, 100)

  const statusMix = Array.from(statusCounter.entries())
    .map(([status, total]) => ({ status, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)

  const platformMix = Array.from(platformCounter.entries())
    .map(([platform, total]) => ({ platform, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const projectPulse = Array.from(projectUpcomingCounter.entries())
    .map(([project, upcoming]) => ({ project, upcoming }))
    .sort((a, b) => b.upcoming - a.upcoming)
    .slice(0, 4)

  return {
    healthScore,
    pendingApprovalNext24h,
    failedLast7d,
    scheduledNext7d,
    statusMix,
    platformMix,
    projectPulse,
  }
}

export async function getOperationalIncidents(limit = 8): Promise<OperationalIncidentItem[]> {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const posts = await prisma.scheduledPost.findMany({
    where: {
      OR: [
        { status: PostStatus.pending_approval, publishAt: { gte: now, lte: in24h } },
        { status: PostStatus.failed, publishAt: { gte: last7d } },
        { status: { in: [PostStatus.scheduled, PostStatus.pending_approval] }, mediaAssetId: null },
      ],
    },
    orderBy: { publishAt: 'asc' },
    take: 80,
    include: {
      project: { select: { name: true } },
    },
  })

  const incidents: OperationalIncidentItem[] = posts.map((post) => {
    if (post.status === PostStatus.failed) {
      return {
        id: post.id,
        type: 'failed',
        severity: 'alta',
        title: `Fallo de publicacion: ${post.title}`,
        project: post.project.name,
        publishAt: post.publishAt.toISOString(),
        actionHref: '/publicaciones-programadas?status=failed',
      }
    }
    if (post.mediaAssetId == null && post.status !== PostStatus.draft && post.status !== PostStatus.cancelled) {
      return {
        id: post.id,
        type: 'missing_media',
        severity: 'media',
        title: `Falta media: ${post.title}`,
        project: post.project.name,
        publishAt: post.publishAt.toISOString(),
        actionHref: '/library',
      }
    }
    return {
      id: post.id,
      type: 'approval',
      severity: 'alta',
      title: `Pendiente aprobacion: ${post.title}`,
      project: post.project.name,
      publishAt: post.publishAt.toISOString(),
      actionHref: '/approvals',
    }
  })

  const severityOrder = { alta: 0, media: 1 }
  return incidents.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]).slice(0, limit)
}

export async function getProjectOptimizationRecommendations(limit = 5): Promise<ProjectOptimizationRecommendation[]> {
  const now = new Date()
  const last60d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const next14d = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const [historicalPosts, upcomingWorkload, projects] = await Promise.all([
    prisma.scheduledPost.findMany({
      where: {
        publishAt: { gte: last60d },
        status: { in: [PostStatus.published, PostStatus.failed] },
      },
      select: {
        projectId: true,
        project: { select: { name: true } },
        platformsJson: true,
        status: true,
        publishAt: true,
      },
      orderBy: { publishAt: 'desc' },
      take: 1500,
    }),
    prisma.scheduledPost.groupBy({
      by: ['projectId'],
      where: {
        publishAt: { gte: now, lte: next14d },
        status: { in: [PostStatus.scheduled, PostStatus.pending_approval, PostStatus.draft] },
      },
      _count: { _all: true },
      orderBy: { _count: { projectId: 'desc' } },
      take: 10,
    }),
    prisma.project.findMany({
      select: { id: true, name: true },
      take: 20,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const projectNameById = new Map(projects.map((project) => [project.id, project.name]))
  const projectPriority = new Map(upcomingWorkload.map((item, index) => [item.projectId, { load: item._count._all, index }]))

  const globalStats = new Map<string, { published: number; failed: number }>()
  const perProjectStats = new Map<string, Map<string, { published: number; failed: number }>>()

  for (const post of historicalPosts) {
    const platforms = parsePlatforms(post.platformsJson)
    if (platforms.length === 0) continue
    const bucket = windowKeyFromHour(post.publishAt.getHours())
    const isSuccess = post.status === PostStatus.published

    for (const platform of platforms) {
      const combo = `${platform}__${bucket}`

      const globalItem = globalStats.get(combo) ?? { published: 0, failed: 0 }
      if (isSuccess) globalItem.published += 1
      else globalItem.failed += 1
      globalStats.set(combo, globalItem)

      const projectMap = perProjectStats.get(post.projectId) ?? new Map<string, { published: number; failed: number }>()
      const projectItem = projectMap.get(combo) ?? { published: 0, failed: 0 }
      if (isSuccess) projectItem.published += 1
      else projectItem.failed += 1
      projectMap.set(combo, projectItem)
      perProjectStats.set(post.projectId, projectMap)
    }
  }

  const globalBest = Array.from(globalStats.entries())
    .map(([combo, value]) => ({
      combo,
      sample: value.published + value.failed,
      rate: smoothRate(value.published, value.failed),
    }))
    .sort((a, b) => {
      if (b.rate !== a.rate) return b.rate - a.rate
      return b.sample - a.sample
    })[0]

  const targetProjectIds = new Set<string>(upcomingWorkload.map((item) => item.projectId))
  if (targetProjectIds.size === 0) {
    for (const project of projects.slice(0, limit)) {
      targetProjectIds.add(project.id)
    }
  }

  const recommendations: ProjectOptimizationRecommendation[] = []
  for (const projectId of targetProjectIds) {
    const projectName = projectNameById.get(projectId) ?? 'Proyecto'
    const projectCombos = perProjectStats.get(projectId)
    const ranked = projectCombos
      ? Array.from(projectCombos.entries())
          .map(([combo, value]) => {
            const sample = value.published + value.failed
            const rate = smoothRate(value.published, value.failed)
            return { combo, sample, rate, confidence: clamp(Math.round(sample * 11), 25, 95) }
          })
          .sort((a, b) => {
            if (b.rate !== a.rate) return b.rate - a.rate
            return b.sample - a.sample
          })[0]
      : null

    const selected = ranked ?? (globalBest ? { ...globalBest, confidence: 34 } : null)
    if (!selected) continue

    const [recommendedPlatform, recommendedWindow] = selected.combo.split('__')
    const successRate = Math.round(selected.rate * 100)
    const sampleSize = selected.sample
    const confidence = ranked ? selected.confidence : clamp(Math.round((sampleSize + 2) * 6), 25, 55)

    const rationale = ranked
      ? `Basado en ${sampleSize} publicaciones historicas del proyecto, ${recommendedPlatform} en ${recommendedWindow} mantiene mejor tasa de exito.`
      : `Sin historico suficiente del proyecto. Se aplico patron global (${recommendedPlatform} en ${recommendedWindow}) para acelerar resultados.`

    recommendations.push({
      projectId,
      projectName,
      recommendedPlatform,
      recommendedWindow,
      successRate,
      confidence,
      sampleSize,
      rationale,
    })
  }

  return recommendations
    .sort((a, b) => {
      const pa = projectPriority.get(a.projectId)
      const pb = projectPriority.get(b.projectId)
      const aRank = pa ? pa.index : 999
      const bRank = pb ? pb.index : 999
      if (aRank !== bRank) return aRank - bRank
      if (b.confidence !== a.confidence) return b.confidence - a.confidence
      return b.successRate - a.successRate
    })
    .slice(0, limit)
}
