import { PostStatus, Prisma } from '@prisma/client'

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

export interface ExecutiveInboxMetric {
  label: string
  value: number
  href: string
  tone: 'primary' | 'warning' | 'danger' | 'neutral'
}

export interface ExecutiveInboxItem {
  id: string
  title: string
  description: string
  href: string
  priority: 'alta' | 'media'
  category: 'vencida' | 'aprobacion' | 'token' | 'fallo' | 'alerta'
  createdAt: string
}

export interface ExecutiveInboxData {
  metrics: ExecutiveInboxMetric[]
  items: ExecutiveInboxItem[]
}

export interface ApprovalQueueItem {
  id: string
  title: string
  caption: string
  subtitle: string | null
  creator: string
  project: string
  platforms: string[]
  proposedDate: string
  submittedAt: string
  status: 'pending' | 'resolved'
}

export interface ApprovalHistoryItem {
  id: string
  title: string
  project: string
  reviewedAt: string
  reviewer: string
  finalStatus: string
}

export interface ReportSummaryData {
  weekPosts: number
  monthPosts: number
  failureRate: number
  byNetwork: Array<{ network: string; total: number }>
  byProject: Array<{ project: string; total: number }>
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

export async function getApprovalBoardData(): Promise<{ pending: ApprovalQueueItem[]; recent: ApprovalHistoryItem[] }> {
  const [pendingPosts, reviewedPosts] = await Promise.all([
    prisma.scheduledPost.findMany({
      where: { status: PostStatus.pending_approval },
      orderBy: { publishAt: 'asc' },
      include: {
        creator: { select: { name: true } },
        project: { select: { name: true } },
      },
      take: 50,
    }),
    prisma.scheduledPost.findMany({
      where: {
        approverId: { not: null },
        status: { not: PostStatus.pending_approval },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        approver: { select: { name: true } },
        project: { select: { name: true } },
      },
      take: 10,
    }),
  ])

  return {
    pending: pendingPosts.map((post) => {
      const parsedCaption = parseStoredCaption(post.caption)
      return {
        id: post.id,
        title: post.title,
        caption: parsedCaption.caption,
        subtitle: parsedCaption.subtitle,
        creator: post.creator.name,
        project: post.project.name,
        platforms: parsePlatforms(post.platformsJson),
        proposedDate: post.publishAt.toISOString(),
        submittedAt: post.createdAt.toISOString(),
        status: 'pending',
      }
    }),
    recent: reviewedPosts.map((post) => ({
      id: post.id,
      title: post.title,
      project: post.project.name,
      reviewedAt: post.updatedAt.toISOString(),
      reviewer: post.approver?.name ?? 'Sin responsable',
      finalStatus: post.status,
    })),
  }
}

export async function getReportSummary(): Promise<ReportSummaryData> {
  const now = new Date()
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const posts = await prisma.scheduledPost.findMany({
    where: {
      publishAt: { gte: last30d, lte: now },
      status: { not: PostStatus.draft },
    },
    select: {
      status: true,
      publishAt: true,
      platformsJson: true,
      project: { select: { name: true } },
    },
    take: 1500,
    orderBy: { publishAt: 'desc' },
  })

  const byNetworkMap = new Map<string, number>()
  const byProjectMap = new Map<string, number>()
  let weekPosts = 0
  let monthPosts = 0
  let processedCount = 0
  let failedCount = 0

  for (const post of posts) {
    monthPosts += 1
    if (post.publishAt >= last7d) {
      weekPosts += 1
    }

    const processedStatuses: PostStatus[] = [
      PostStatus.scheduled,
      PostStatus.published,
      PostStatus.failed,
      PostStatus.cancelled,
    ]
    if (processedStatuses.includes(post.status)) {
      processedCount += 1
      if (post.status === PostStatus.failed) {
        failedCount += 1
      }
    }

    for (const platform of parsePlatforms(post.platformsJson)) {
      byNetworkMap.set(platform, (byNetworkMap.get(platform) ?? 0) + 1)
    }
    byProjectMap.set(post.project.name, (byProjectMap.get(post.project.name) ?? 0) + 1)
  }

  return {
    weekPosts,
    monthPosts,
    failureRate: processedCount === 0 ? 0 : Number(((failedCount / processedCount) * 100).toFixed(1)),
    byNetwork: Array.from(byNetworkMap.entries())
      .map(([network, total]) => ({ network, total }))
      .sort((a, b) => b.total - a.total),
    byProject: Array.from(byProjectMap.entries())
      .map(([project, total]) => ({ project, total }))
      .sort((a, b) => b.total - a.total),
  }
}

export async function getExecutiveInbox(limit = 8): Promise<ExecutiveInboxData> {
  const now = new Date()
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [dueScheduled, pendingApprovals, tokenRiskAccounts, failedPosts, unreadNotifications] = await Promise.all([
    prisma.scheduledPost.findMany({
      where: {
        status: PostStatus.scheduled,
        publishAt: { lte: now },
      },
      orderBy: { publishAt: 'asc' },
      take: Math.max(4, limit),
      select: {
        id: true,
        title: true,
        publishAt: true,
      },
    }),
    prisma.scheduledPost.findMany({
      where: {
        status: PostStatus.pending_approval,
        publishAt: { lte: in48h },
      },
      orderBy: { publishAt: 'asc' },
      take: Math.max(4, limit),
      select: {
        id: true,
        title: true,
        publishAt: true,
      },
    }),
    prisma.socialAccount.findMany({
      where: {
        status: { in: ['token_expiring', 'disconnected'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: Math.max(4, limit),
      select: {
        id: true,
        username: true,
        status: true,
        updatedAt: true,
      },
    }),
    prisma.scheduledPost.findMany({
      where: {
        status: PostStatus.failed,
        updatedAt: { gte: last7d },
      },
      orderBy: { updatedAt: 'desc' },
      take: Math.max(4, limit),
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    }),
    prisma.notification.count({
      where: { read: false },
    }).catch((error) => {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2021') return 0
      throw error
    }),
  ])

  const items: ExecutiveInboxItem[] = [
    ...dueScheduled.map((item) => ({
      id: `due-${item.id}`,
      title: `Publicacion vencida: ${item.title}`,
      description: 'La publicacion ya debio procesarse y requiere ejecucion o revision inmediata.',
      href: '/publicaciones-programadas',
      priority: 'alta' as const,
      category: 'vencida' as const,
      createdAt: item.publishAt.toISOString(),
    })),
    ...pendingApprovals.map((item) => ({
      id: `approval-${item.id}`,
      title: `Aprobacion pendiente: ${item.title}`,
      description: 'Hay una publicacion cercana al corte que aun no ha sido aprobada.',
      href: '/approvals',
      priority: 'alta' as const,
      category: 'aprobacion' as const,
      createdAt: item.publishAt.toISOString(),
    })),
    ...tokenRiskAccounts.map((item) => ({
      id: `token-${item.id}`,
      title: `Cuenta en riesgo: ${item.username}`,
      description:
        item.status === 'disconnected'
          ? 'La cuenta esta desconectada y bloqueara publicaciones.'
          : 'El token esta por expirar y debe renovarse antes del siguiente ciclo.',
      href: '/social-accounts',
      priority: item.status === 'disconnected' ? ('alta' as const) : ('media' as const),
      category: 'token' as const,
      createdAt: item.updatedAt.toISOString(),
    })),
    ...failedPosts.map((item) => ({
      id: `failed-${item.id}`,
      title: `Fallo reciente: ${item.title}`,
      description: 'Hubo un error de ejecucion reciente que debe revisarse en la bitacora.',
      href: '/logs',
      priority: 'media' as const,
      category: 'fallo' as const,
      createdAt: item.updatedAt.toISOString(),
    })),
  ]

  const metrics: ExecutiveInboxMetric[] = [
    { label: 'Vencidas ahora', value: dueScheduled.length, href: '/publicaciones-programadas', tone: dueScheduled.length > 0 ? 'danger' : 'neutral' },
    { label: 'Pendientes 48h', value: pendingApprovals.length, href: '/approvals', tone: pendingApprovals.length > 0 ? 'warning' : 'neutral' },
    { label: 'Cuentas en riesgo', value: tokenRiskAccounts.length, href: '/social-accounts', tone: tokenRiskAccounts.length > 0 ? 'warning' : 'neutral' },
    { label: 'Alertas sin leer', value: unreadNotifications, href: '/notifications', tone: unreadNotifications > 0 ? 'primary' : 'neutral' },
  ]

  return {
    metrics,
    items: items
      .sort((a, b) => {
        const priorityOrder = { alta: 0, media: 1 }
        const byPriority = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (byPriority !== 0) return byPriority
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })
      .slice(0, limit),
  }
}
