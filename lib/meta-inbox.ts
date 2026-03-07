import { AccountPlatform, AccountStatus, InboxPriority, InboxStatus, Prisma, UserRole, UserStatus } from '@prisma/client'

import { createActivityLog, createNotification } from '@/lib/operations-feed'
import { prisma } from '@/lib/prisma'

type GraphErrorPayload = {
  error?: {
    message?: string
  }
}

function isMissingTableError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2021'
}

type FetchedInboxItem = {
  platform: AccountPlatform
  socialAccountId: string
  externalItemId: string
  externalPostId: string | null
  accountLabel: string
  authorName: string
  message: string
  occurredAt: Date
  priority: InboxPriority
  metadata: Prisma.InputJsonValue
}

export interface SocialInboxItem {
  id: string
  platform: 'facebook' | 'instagram'
  accountId: string
  accountLabel: string
  author: string
  message: string
  createdAt: string
  postId: string
  postPreview: string
  priority: 'alta' | 'media' | 'baja'
  status: 'nuevo' | 'pendiente' | 'resuelto'
  assignedTo: { id: string; name: string } | null
  slaDueAt: string | null
  slaState: 'ok' | 'risk' | 'breached'
  notes: Array<{
    id: string
    body: string
    createdAt: string
    author: { id: string; name: string }
  }>
  suggestedReplies: string[]
}

export interface SocialInboxSummary {
  mode: 'live' | 'mock'
  scannedAccounts: number
  fetchedItems: number
  warnings: string[]
  items: SocialInboxItem[]
  assignees: Array<{ id: string; name: string; role: string }>
}

export interface InboxSlaSummary {
  totalOpen: number
  risk: number
  breached: number
  resolvedToday: number
  byAssignee: Array<{
    assigneeId: string
    assigneeName: string
    open: number
    risk: number
    breached: number
  }>
}

export interface InboxAgentProductivitySummary {
  generatedAt: string
  items: Array<{
    assigneeId: string
    assigneeName: string
    activeThreads: number
    resolvedToday: number
    avgResponseMinutes: number | null
    overdueThreads: number
  }>
}

function normalizeMessage(value: unknown, fallback = 'Sin mensaje') {
  if (typeof value === 'string' && value.trim()) return value.trim()
  return fallback
}

function computePriority(message: string): InboxPriority {
  const text = message.toLowerCase()
  if (text.includes('precio') || text.includes('disponible') || text.includes('visita') || text.includes('whatsapp')) {
    return InboxPriority.high
  }
  if (text.includes('ubicacion') || text.includes('donde') || text.includes('informacion')) {
    return InboxPriority.medium
  }
  return InboxPriority.low
}

function clampLimit(value: number) {
  if (!Number.isFinite(value)) return 60
  return Math.min(Math.max(Math.trunc(value), 1), 200)
}

function computeSlaDueAt(priority: InboxPriority, occurredAt: Date) {
  const hours = priority === InboxPriority.high ? 1 : priority === InboxPriority.medium ? 4 : 12
  return new Date(occurredAt.getTime() + hours * 60 * 60 * 1000)
}

function toUiPriority(priority: InboxPriority): SocialInboxItem['priority'] {
  if (priority === InboxPriority.high) return 'alta'
  if (priority === InboxPriority.medium) return 'media'
  return 'baja'
}

function toUiStatus(status: InboxStatus): SocialInboxItem['status'] {
  if (status === InboxStatus.new) return 'nuevo'
  if (status === InboxStatus.pending) return 'pendiente'
  return 'resuelto'
}

function parsePostPreview(metadata: Prisma.JsonValue | null) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return 'Publicacion social'
  const postPreview = (metadata as Record<string, unknown>).postPreview
  return normalizeMessage(postPreview, 'Publicacion social')
}

function generateSuggestedReplies(input: { message: string; postPreview: string; priority: InboxPriority }) {
  const text = input.message.toLowerCase()
  const baseProject = input.postPreview
  const replies: string[] = []

  if (text.includes('precio') || text.includes('costo') || text.includes('cuanto')) {
    replies.push(`Gracias por escribirnos. Te compartimos el detalle de precio y condiciones del proyecto "${baseProject}". Si deseas, tambien te ayudamos por WhatsApp.`)
  }

  if (text.includes('disponible') || text.includes('stock') || text.includes('queda')) {
    replies.push(`Si, aun contamos con disponibilidad en "${baseProject}". Indicanos si buscas informacion para vivir o invertir y te guiamos con las mejores opciones.`)
  }

  if (text.includes('visita') || text.includes('agendar') || text.includes('cita')) {
    replies.push(`Podemos ayudarte a agendar una visita para "${baseProject}". Comparte tu numero o escribenos por WhatsApp y coordinamos el horario.`)
  }

  if (text.includes('ubicacion') || text.includes('direccion') || text.includes('donde')) {
    replies.push(`Te enviamos la ubicacion exacta de "${baseProject}" y puntos de acceso cercanos. Si quieres, tambien te compartimos mapa y referencias.`)
  }

  if (replies.length === 0) {
    replies.push(`Gracias por contactarnos sobre "${baseProject}". Cuentanos que informacion necesitas y te respondemos con el detalle correcto.`)
  }

  if (input.priority === InboxPriority.high) {
    replies.push(`Con gusto te atendemos de inmediato. Si prefieres una respuesta mas rapida, dejanos tu numero y te contactamos hoy mismo.`)
  }

  return Array.from(new Set(replies)).slice(0, 3)
}

function computeSlaState(status: InboxStatus, slaDueAt: Date | null, now: Date): SocialInboxItem['slaState'] {
  if (status === InboxStatus.resolved || !slaDueAt) return 'ok'
  const diff = slaDueAt.getTime() - now.getTime()
  if (diff <= 0) return 'breached'
  if (diff <= 60 * 60 * 1000) return 'risk'
  return 'ok'
}

async function fetchGraph(url: URL) {
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  const json = (await response.json().catch(() => null)) as GraphErrorPayload | null
  if (!response.ok) {
    throw new Error(json?.error?.message ?? 'Error consultando Meta Graph API.')
  }
  return json
}

function createMockItems(limit: number): FetchedInboxItem[] {
  const now = Date.now()
  return [
    {
      platform: AccountPlatform.facebook,
      socialAccountId: 'mock-facebook',
      externalItemId: 'mock-fb-1',
      externalPostId: 'mock-post-1',
      accountLabel: 'Facebook Casa y Mas',
      authorName: 'Carlos Mendoza',
      message: 'Hola, esta propiedad sigue disponible y cual es el precio final?',
      occurredAt: new Date(now - 20 * 60 * 1000),
      priority: InboxPriority.high,
      metadata: { postPreview: 'Lanzamiento de proyecto con bono de reserva' },
    },
    {
      platform: AccountPlatform.instagram,
      socialAccountId: 'mock-instagram',
      externalItemId: 'mock-ig-1',
      externalPostId: 'mock-post-2',
      accountLabel: 'Instagram @casaymas',
      authorName: 'ana.rios',
      message: 'Me interesa agendar visita para este fin de semana.',
      occurredAt: new Date(now - 58 * 60 * 1000),
      priority: InboxPriority.high,
      metadata: { postPreview: 'Reel de amenidades' },
    },
    {
      platform: AccountPlatform.facebook,
      socialAccountId: 'mock-facebook',
      externalItemId: 'mock-fb-2',
      externalPostId: 'mock-post-3',
      accountLabel: 'Facebook Casa y Mas',
      authorName: 'Lucia Perez',
      message: 'Que bancos estan financiando este proyecto?',
      occurredAt: new Date(now - 2 * 60 * 60 * 1000),
      priority: InboxPriority.medium,
      metadata: { postPreview: 'Comparativo de metrajes por torre' },
    },
  ].slice(0, limit)
}

async function fetchMetaInboxItems(limit: number) {
  const mode = (process.env.PUBLISHER_MODE?.trim().toLowerCase() || 'mock') as 'live' | 'mock'
  const warnings: string[] = []
  const accounts = await prisma.socialAccount.findMany({
    where: {
      platform: { in: [AccountPlatform.facebook, AccountPlatform.instagram] },
      status: { in: [AccountStatus.connected, AccountStatus.token_expiring] },
      accessToken: { not: null },
    },
    select: {
      id: true,
      platform: true,
      username: true,
      pageId: true,
      instagramUserId: true,
      accessToken: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  })

  if (mode !== 'live') {
    warnings.push('Modo mock activo. El inbox social muestra datos operativos simulados.')
    return {
      mode,
      warnings,
      scannedAccounts: accounts.length,
      items: createMockItems(limit),
    }
  }

  const items: FetchedInboxItem[] = []

  for (const account of accounts) {
    const token = account.accessToken
    if (!token) continue

    try {
      if (account.platform === AccountPlatform.facebook) {
        if (!account.pageId) {
          warnings.push(`Cuenta ${account.username}: falta pageId para leer comentarios de Facebook.`)
          continue
        }

        const feedUrl = new URL(`https://graph.facebook.com/v19.0/${encodeURIComponent(account.pageId)}/feed`)
        feedUrl.searchParams.set('fields', 'id,message,comments.limit(8){id,from,message,created_time}')
        feedUrl.searchParams.set('limit', '12')
        feedUrl.searchParams.set('access_token', token)
        const feedJson = (await fetchGraph(feedUrl)) as {
          data?: Array<{
            id?: string
            message?: string
            comments?: { data?: Array<{ id?: string; message?: string; created_time?: string; from?: { name?: string } }> }
          }>
        }

        for (const post of feedJson.data ?? []) {
          const postId = post.id ?? null
          const postPreview = normalizeMessage(post.message, 'Publicacion de Facebook')
          for (const comment of post.comments?.data ?? []) {
            const message = normalizeMessage(comment.message)
            items.push({
              platform: AccountPlatform.facebook,
              socialAccountId: account.id,
              externalItemId: comment.id ?? `${account.id}-${items.length}`,
              externalPostId: postId,
              accountLabel: account.username,
              authorName: normalizeMessage(comment.from?.name, 'Usuario Facebook'),
              message,
              occurredAt: comment.created_time ? new Date(comment.created_time) : new Date(),
              priority: computePriority(message),
              metadata: { postPreview },
            })
          }
        }
      }

      if (account.platform === AccountPlatform.instagram) {
        if (!account.instagramUserId) {
          warnings.push(`Cuenta ${account.username}: falta instagramUserId para leer comentarios de Instagram.`)
          continue
        }

        const mediaUrl = new URL(`https://graph.facebook.com/v19.0/${encodeURIComponent(account.instagramUserId)}/media`)
        mediaUrl.searchParams.set('fields', 'id,caption,comments.limit(8){id,text,timestamp,username}')
        mediaUrl.searchParams.set('limit', '12')
        mediaUrl.searchParams.set('access_token', token)
        const mediaJson = (await fetchGraph(mediaUrl)) as {
          data?: Array<{
            id?: string
            caption?: string
            comments?: { data?: Array<{ id?: string; text?: string; timestamp?: string; username?: string }> }
          }>
        }

        for (const media of mediaJson.data ?? []) {
          const postId = media.id ?? null
          const postPreview = normalizeMessage(media.caption, 'Publicacion de Instagram')
          for (const comment of media.comments?.data ?? []) {
            const message = normalizeMessage(comment.text)
            items.push({
              platform: AccountPlatform.instagram,
              socialAccountId: account.id,
              externalItemId: comment.id ?? `${account.id}-${items.length}`,
              externalPostId: postId,
              accountLabel: account.username,
              authorName: normalizeMessage(comment.username, 'Usuario Instagram'),
              message,
              occurredAt: comment.timestamp ? new Date(comment.timestamp) : new Date(),
              priority: computePriority(message),
              metadata: { postPreview },
            })
          }
        }
      }
    } catch (error) {
      warnings.push(`Cuenta ${account.username}: ${error instanceof Error ? error.message : 'No se pudieron leer comentarios.'}`)
    }
  }

  return {
    mode,
    warnings,
    scannedAccounts: accounts.length,
    items: items.slice(0, limit),
  }
}

async function syncInboxThreads(items: FetchedInboxItem[]) {
  for (const item of items) {
    const slaDueAt = computeSlaDueAt(item.priority, item.occurredAt)
    await prisma.socialInboxThread.upsert({
      where: {
        socialAccountId_externalItemId: {
          socialAccountId: item.socialAccountId,
          externalItemId: item.externalItemId,
        },
      },
      update: {
        accountLabel: item.accountLabel,
        authorName: item.authorName,
        message: item.message,
        priority: item.priority,
        occurredAt: item.occurredAt,
        externalPostId: item.externalPostId,
        metadataJson: item.metadata,
      },
      create: {
        platform: item.platform,
        socialAccountId: item.socialAccountId,
        externalItemId: item.externalItemId,
        externalPostId: item.externalPostId,
        accountLabel: item.accountLabel,
        authorName: item.authorName,
        message: item.message,
        priority: item.priority,
        occurredAt: item.occurredAt,
        slaDueAt,
        metadataJson: item.metadata,
      },
    })
  }
}

async function getAssignees() {
  const users = await prisma.user.findMany({
    where: {
      status: UserStatus.active,
      role: { in: [UserRole.admin, UserRole.supervisor, UserRole.editor] },
    },
    select: {
      id: true,
      name: true,
      role: true,
    },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
  }))
}

export async function getMetaSocialInbox(limitInput = 60): Promise<SocialInboxSummary> {
  const limit = clampLimit(limitInput)
  try {
    const fetched = await fetchMetaInboxItems(limit)
    await syncInboxThreads(fetched.items)

    const [threads, assignees] = await Promise.all([
      prisma.socialInboxThread.findMany({
        orderBy: [{ status: 'asc' }, { priority: 'asc' }, { occurredAt: 'desc' }],
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 8,
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        take: limit,
      }),
      getAssignees(),
    ])

    const now = new Date()
    return {
      mode: fetched.mode,
      scannedAccounts: fetched.scannedAccounts,
      fetchedItems: threads.length,
      warnings: fetched.warnings,
      assignees,
      items: threads.map((thread) => ({
        id: thread.id,
        platform: thread.platform,
        accountId: thread.socialAccountId,
        accountLabel: thread.accountLabel,
        author: thread.authorName,
        message: thread.message,
        createdAt: thread.occurredAt.toISOString(),
        postId: thread.externalPostId ?? '',
        postPreview: parsePostPreview(thread.metadataJson),
        priority: toUiPriority(thread.priority),
        status: toUiStatus(thread.status),
        assignedTo: thread.assignedTo,
        slaDueAt: thread.slaDueAt?.toISOString() ?? null,
        slaState: computeSlaState(thread.status, thread.slaDueAt, now),
        notes: thread.notes.map((note) => ({
          id: note.id,
          body: note.body,
          createdAt: note.createdAt.toISOString(),
          author: note.author,
        })),
        suggestedReplies: generateSuggestedReplies({
          message: thread.message,
          postPreview: parsePostPreview(thread.metadataJson),
          priority: thread.priority,
        }),
      })),
    }
  } catch (error) {
    if (!isMissingTableError(error)) throw error

    return {
      mode: 'mock',
      scannedAccounts: 0,
      fetchedItems: 0,
      warnings: ['Faltan las migraciones del inbox social en la base de datos actual.'],
      items: [],
      assignees: [],
    }
  }
}

export async function updateInboxThread(input: {
  threadId: string
  status?: InboxStatus
  assignedToId?: string | null
  actingUserId: string
}) {
  const current = await prisma.socialInboxThread.findUnique({
    where: { id: input.threadId },
    select: {
      id: true,
      status: true,
      assignedToId: true,
      authorName: true,
      accountLabel: true,
    },
  })

  if (!current) {
    throw new Error('Conversacion no encontrada.')
  }

  const nextStatus = input.status ?? current.status
  const resolvedAtValue =
    nextStatus === InboxStatus.resolved
      ? new Date()
      : current.status === InboxStatus.resolved
        ? null
        : undefined
  const updateData: Prisma.SocialInboxThreadUpdateInput = {
    status: nextStatus,
    assignedTo: input.assignedToId === undefined
      ? undefined
      : input.assignedToId
        ? { connect: { id: input.assignedToId } }
        : { disconnect: true },
    firstRespondedAt:
      current.status === InboxStatus.new && nextStatus === InboxStatus.pending
        ? new Date()
        : undefined,
    resolvedAt: resolvedAtValue,
  }

  const updated = await prisma.socialInboxThread.update({
    where: { id: input.threadId },
    data: updateData,
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  await Promise.all([
    createActivityLog({
      level: 'info',
      category: 'inbox',
      action: 'thread_updated',
      targetType: 'social_inbox_thread',
      targetId: updated.id,
      summary: `Conversacion actualizada para ${updated.authorName}.`,
      detail: {
        status: updated.status,
        assignedToId: updated.assignedToId,
        actingUserId: input.actingUserId,
      },
    }),
    updated.status === InboxStatus.resolved
      ? createNotification({
          type: 'success',
          title: 'Conversacion resuelta',
          message: `La conversacion de ${updated.authorName} en ${updated.accountLabel} fue marcada como resuelta.`,
          href: '/inbox',
          metadata: { threadId: updated.id },
        })
      : Promise.resolve(null),
  ])

  return updated
}

export async function addInboxThreadNote(input: {
  threadId: string
  authorId: string
  body: string
}) {
  let thread
  try {
    thread = await prisma.socialInboxThread.findUnique({
      where: { id: input.threadId },
      select: {
        id: true,
        authorName: true,
        accountLabel: true,
      },
    })
  } catch (error) {
    if (isMissingTableError(error)) {
      throw new Error('Faltan las migraciones del inbox social en esta base de datos.')
    }
    throw error
  }

  if (!thread) {
    throw new Error('Conversacion no encontrada.')
  }

  const note = await prisma.socialInboxNote.create({
    data: {
      threadId: input.threadId,
      authorId: input.authorId,
      body: input.body.trim(),
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  await createActivityLog({
    level: 'info',
    category: 'inbox',
    action: 'note_added',
    targetType: 'social_inbox_thread',
    targetId: input.threadId,
    summary: `Nota interna agregada para ${thread.authorName}.`,
    detail: {
      accountLabel: thread.accountLabel,
      noteId: note.id,
      authorId: input.authorId,
    },
  })

  return note
}

export async function getInboxSlaSummary(): Promise<InboxSlaSummary> {
  let threads
  let resolvedToday
  try {
    ;[threads, resolvedToday] = await Promise.all([
      prisma.socialInboxThread.findMany({
        where: {
          status: { in: [InboxStatus.new, InboxStatus.pending] },
        },
        select: {
          id: true,
          status: true,
          slaDueAt: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
          resolvedAt: true,
        },
      }),
      prisma.socialInboxThread.count({
        where: {
          resolvedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ])
  } catch (error) {
    if (!isMissingTableError(error)) throw error
    return {
      totalOpen: 0,
      risk: 0,
      breached: 0,
      resolvedToday: 0,
      byAssignee: [],
    }
  }

  const now = new Date()
  const byAssigneeMap = new Map<string, InboxSlaSummary['byAssignee'][number]>()
  let risk = 0
  let breached = 0

  for (const thread of threads) {
    const slaState = computeSlaState(thread.status, thread.slaDueAt, now)
    if (slaState === 'risk') risk += 1
    if (slaState === 'breached') breached += 1

    const assigneeId = thread.assignedTo?.id ?? 'unassigned'
    const assigneeName = thread.assignedTo?.name ?? 'Sin asignar'
    const current = byAssigneeMap.get(assigneeId) ?? {
      assigneeId,
      assigneeName,
      open: 0,
      risk: 0,
      breached: 0,
    }
    current.open += 1
    if (slaState === 'risk') current.risk += 1
    if (slaState === 'breached') current.breached += 1
    byAssigneeMap.set(assigneeId, current)
  }

  return {
    totalOpen: threads.length,
    risk,
    breached,
    resolvedToday,
    byAssignee: Array.from(byAssigneeMap.values()).sort((a, b) => {
      if (b.breached !== a.breached) return b.breached - a.breached
      if (b.risk !== a.risk) return b.risk - a.risk
      return b.open - a.open
    }),
  }
}

export async function getInboxAgentProductivitySummary(): Promise<InboxAgentProductivitySummary> {
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  let threads
  try {
    threads = await prisma.socialInboxThread.findMany({
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
  } catch (error) {
    if (!isMissingTableError(error)) throw error
    return {
      generatedAt: now.toISOString(),
      items: [],
    }
  }

  const buckets = new Map<string, InboxAgentProductivitySummary['items'][number] & { responseSamples: number[] }>()

  for (const thread of threads) {
    const assigneeId = thread.assignedTo?.id ?? 'unassigned'
    const assigneeName = thread.assignedTo?.name ?? 'Sin asignar'
    const bucket = buckets.get(assigneeId) ?? {
      assigneeId,
      assigneeName,
      activeThreads: 0,
      resolvedToday: 0,
      avgResponseMinutes: null,
      overdueThreads: 0,
      responseSamples: [],
    }

    if (thread.status !== InboxStatus.resolved) {
      bucket.activeThreads += 1
      if (computeSlaState(thread.status, thread.slaDueAt, now) === 'breached') {
        bucket.overdueThreads += 1
      }
    }

    if (thread.resolvedAt && thread.resolvedAt >= startOfToday) {
      bucket.resolvedToday += 1
    }

    if (thread.firstRespondedAt) {
      const minutes = Math.max(0, Math.round((thread.firstRespondedAt.getTime() - thread.occurredAt.getTime()) / 60000))
      bucket.responseSamples.push(minutes)
    }

    buckets.set(assigneeId, bucket)
  }

  return {
    generatedAt: now.toISOString(),
    items: Array.from(buckets.values())
      .map((item) => ({
        assigneeId: item.assigneeId,
        assigneeName: item.assigneeName,
        activeThreads: item.activeThreads,
        resolvedToday: item.resolvedToday,
        avgResponseMinutes:
          item.responseSamples.length > 0
            ? Math.round(item.responseSamples.reduce((acc, value) => acc + value, 0) / item.responseSamples.length)
            : null,
        overdueThreads: item.overdueThreads,
      }))
      .sort((a, b) => {
        if (b.resolvedToday !== a.resolvedToday) return b.resolvedToday - a.resolvedToday
        if (a.overdueThreads !== b.overdueThreads) return a.overdueThreads - b.overdueThreads
        return a.assigneeName.localeCompare(b.assigneeName)
      }),
  }
}
