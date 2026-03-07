import { LogLevel, NotificationType, Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

function parseJsonObject(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function isMissingTableError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2021'
}

function hasModelDelegate<TModel extends 'notification' | 'activityLog'>(model: TModel) {
  const client = prisma as unknown as Record<string, unknown>
  return Boolean(client[model])
}

export async function createNotification(input: {
  type: NotificationType
  title: string
  message: string
  href?: string | null
  metadata?: Prisma.InputJsonValue | null
}) {
  if (!hasModelDelegate('notification')) return null
  try {
    return await prisma.notification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message,
        href: input.href ?? null,
        metadata: input.metadata ?? Prisma.JsonNull,
      },
    })
  } catch (error) {
    if (isMissingTableError(error)) return null
    throw error
  }
}

export async function createActivityLog(input: {
  level: LogLevel
  category: string
  action: string
  targetType?: string | null
  targetId?: string | null
  summary: string
  detail?: Prisma.InputJsonValue | null
}) {
  if (!hasModelDelegate('activityLog')) return null
  try {
    return await prisma.activityLog.create({
      data: {
        level: input.level,
        category: input.category,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        summary: input.summary,
        detailJson: input.detail ?? Prisma.JsonNull,
      },
    })
  } catch (error) {
    if (isMissingTableError(error)) return null
    throw error
  }
}

export async function getNotificationsData(limit = 40) {
  if (!hasModelDelegate('notification')) {
    return { unreadCount: 0, items: [] }
  }
  try {
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { read: false },
      }),
    ])

    return {
      unreadCount,
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        message: item.message,
        href: item.href,
        read: item.read,
        metadata: parseJsonObject(item.metadata),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    }
  } catch (error) {
    if (isMissingTableError(error)) {
      return { unreadCount: 0, items: [] }
    }
    throw error
  }
}

export async function markAllNotificationsAsRead() {
  if (!hasModelDelegate('notification')) return
  try {
    await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    })
  } catch (error) {
    if (isMissingTableError(error)) return
    throw error
  }
}

export async function getLogsData(limit = 50) {
  if (!hasModelDelegate('activityLog')) {
    return []
  }
  try {
    const items = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return items.map((item) => ({
      id: item.id,
      level: item.level,
      category: item.category,
      action: item.action,
      targetType: item.targetType,
      targetId: item.targetId,
      summary: item.summary,
      detail: parseJsonObject(item.detailJson),
      createdAt: item.createdAt.toISOString(),
    }))
  } catch (error) {
    if (isMissingTableError(error)) {
      return []
    }
    throw error
  }
}
