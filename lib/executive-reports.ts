import { PostStatus } from '@prisma/client'

import { getInboxAgentProductivitySummary, getInboxSlaSummary } from '@/lib/meta-inbox'
import { createActivityLog, createNotification } from '@/lib/operations-feed'
import { prisma } from '@/lib/prisma'

export interface WeeklyExecutiveReport {
  generatedAt: string
  periodLabel: string
  overview: {
    totalPublished: number
    totalScheduledNext7d: number
    totalFailed: number
    failureRate: number
    pendingApproval: number
  }
  projects: Array<{
    projectId: string
    projectName: string
    published: number
    scheduledNext7d: number
    failed: number
  }>
  team: Array<{
    userId: string
    userName: string
    createdPosts: number
    approvedPosts: number
  }>
  inbox: {
    open: number
    risk: number
    breached: number
    resolvedToday: number
  }
  productivity: Array<{
    assigneeId: string
    assigneeName: string
    activeThreads: number
    resolvedToday: number
    avgResponseMinutes: number | null
    overdueThreads: number
  }>
}

function getWindowBounds() {
  const now = new Date()
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const next7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return { now, last7d, next7d }
}

export async function getWeeklyExecutiveReport(): Promise<WeeklyExecutiveReport> {
  const { now, last7d, next7d } = getWindowBounds()

  const [publishedLast7d, failedLast7d, pendingApproval, scheduledNext7d, projectRows, creators, approvers, inboxSla, inboxProductivity] =
    await Promise.all([
      prisma.scheduledPost.count({
        where: {
          status: PostStatus.published,
          publishAt: { gte: last7d, lte: now },
        },
      }),
      prisma.scheduledPost.count({
        where: {
          status: PostStatus.failed,
          publishAt: { gte: last7d, lte: now },
        },
      }),
      prisma.scheduledPost.count({
        where: {
          status: PostStatus.pending_approval,
          publishAt: { gte: now, lte: next7d },
        },
      }),
      prisma.scheduledPost.count({
        where: {
          status: PostStatus.scheduled,
          publishAt: { gte: now, lte: next7d },
        },
      }),
      prisma.project.findMany({
        include: {
          publishingPosts: {
            where: {
              OR: [
                { publishAt: { gte: last7d, lte: now } },
                { publishAt: { gte: now, lte: next7d } },
              ],
            },
            select: {
              status: true,
              publishAt: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          createdPosts: {
            where: { createdAt: { gte: last7d, lte: now } },
            select: { id: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          approvedPosts: {
            where: { updatedAt: { gte: last7d, lte: now } },
            select: { id: true },
          },
        },
      }),
      getInboxSlaSummary(),
      getInboxAgentProductivitySummary(),
    ])

  const approverMap = new Map(approvers.map((user) => [user.id, user.approvedPosts.length]))
  const totalProcessed = publishedLast7d + failedLast7d

  return {
    generatedAt: now.toISOString(),
    periodLabel: 'Ultimos 7 dias + proximos 7 dias',
    overview: {
      totalPublished: publishedLast7d,
      totalScheduledNext7d: scheduledNext7d,
      totalFailed: failedLast7d,
      failureRate: totalProcessed === 0 ? 0 : Number(((failedLast7d / totalProcessed) * 100).toFixed(1)),
      pendingApproval,
    },
    projects: projectRows.map((project) => ({
      projectId: project.id,
      projectName: project.name,
      published: project.publishingPosts.filter((post) => post.status === PostStatus.published && post.publishAt <= now).length,
      scheduledNext7d: project.publishingPosts.filter((post) => post.status === PostStatus.scheduled && post.publishAt >= now).length,
      failed: project.publishingPosts.filter((post) => post.status === PostStatus.failed).length,
    })),
    team: creators.map((user) => ({
      userId: user.id,
      userName: user.name,
      createdPosts: user.createdPosts.length,
      approvedPosts: approverMap.get(user.id) ?? 0,
    })),
    inbox: {
      open: inboxSla.totalOpen,
      risk: inboxSla.risk,
      breached: inboxSla.breached,
      resolvedToday: inboxSla.resolvedToday,
    },
    productivity: inboxProductivity.items,
  }
}

export async function generateWeeklyExecutiveReport() {
  const report = await getWeeklyExecutiveReport()

  await Promise.all([
    createActivityLog({
      level: 'success',
      category: 'reporting',
      action: 'weekly_report_generated',
      summary: 'Reporte semanal ejecutivo generado.',
      detail: {
        generatedAt: report.generatedAt,
        overview: report.overview,
      },
    }),
    createNotification({
      type: 'system',
      title: 'Reporte semanal generado',
      message: `Se genero el reporte ejecutivo con ${report.overview.totalPublished} publicaciones publicadas y ${report.overview.totalScheduledNext7d} programadas.`,
      href: '/reports',
      metadata: {
        generatedAt: report.generatedAt,
      },
    }),
  ])

  return report
}
