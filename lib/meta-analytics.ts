import { AccountStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'

type Platform = 'facebook' | 'instagram'

type GraphErrorPayload = {
  error?: {
    message?: string
  }
}

export interface MetaAnalyticsSummary {
  mode: 'live' | 'mock'
  periodDays: number
  totals: {
    impressions: number
    reach: number
    engagements: number
    profileViews: number
    engagementRate: number
  }
  perPlatform: Array<{
    platform: Platform
    impressions: number
    reach: number
    engagements: number
    profileViews: number
  }>
  connectedAccounts: number
  analyzedAccounts: number
  warnings: string[]
}

function clampDays(input: number) {
  if (!Number.isFinite(input)) return 7
  return Math.min(Math.max(Math.trunc(input), 1), 90)
}

function readInsightValue<T>(data: unknown, metric: string): T | null {
  if (!Array.isArray(data)) return null
  const entry = data.find((item) => typeof item === 'object' && item !== null && (item as { name?: string }).name === metric) as
    | { values?: Array<{ value?: unknown }> }
    | undefined
  if (!entry?.values?.length) return null
  return (entry.values[entry.values.length - 1]?.value ?? null) as T | null
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
  const json = (await response.json().catch(() => null)) as GraphErrorPayload | null
  if (!response.ok) {
    throw new Error(json?.error?.message ?? 'Error consultando Meta Graph API.')
  }
  return json
}

async function fetchInsightMetricValue(input: {
  id: string
  token: string
  metric: string
  period?: 'day'
  since?: Date
  until?: Date
}) {
  const url = new URL(`https://graph.facebook.com/v19.0/${encodeURIComponent(input.id)}/insights`)
  url.searchParams.set('metric', input.metric)
  if (input.period) {
    url.searchParams.set('period', input.period)
  }
  if (input.since) {
    url.searchParams.set('since', Math.floor(input.since.getTime() / 1000).toString())
  }
  if (input.until) {
    url.searchParams.set('until', Math.floor(input.until.getTime() / 1000).toString())
  }
  url.searchParams.set('access_token', input.token)
  const json = await fetchGraph(url)
  const data = (json as { data?: unknown }).data
  return asNumber(readInsightValue<number>(data, input.metric))
}

async function fetchFirstSupportedMetric(input: {
  id: string
  token: string
  metrics: string[]
  period?: 'day'
  since?: Date
  until?: Date
  warnings: string[]
  warningPrefix: string
}) {
  for (const metric of input.metrics) {
    try {
      const value = await fetchInsightMetricValue({
        id: input.id,
        token: input.token,
        metric,
        period: input.period,
        since: input.since,
        until: input.until,
      })
      return value
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Metrica no disponible.'
      if (!message.toLowerCase().includes('valid insights metric')) {
        input.warnings.push(`${input.warningPrefix} (${metric}): ${message}`)
      }
    }
  }
  return 0
}

export async function getMetaAnalyticsSummary(daysInput = 7): Promise<MetaAnalyticsSummary> {
  const periodDays = clampDays(daysInput)
  const mode = (process.env.PUBLISHER_MODE?.trim().toLowerCase() || 'mock') as 'live' | 'mock'
  const now = new Date()
  const since = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

  const accounts = await prisma.socialAccount.findMany({
    where: {
      platform: { in: ['facebook', 'instagram'] },
      status: { in: [AccountStatus.connected, AccountStatus.token_expiring] },
      accessToken: { not: null },
    },
    select: {
      id: true,
      platform: true,
      accessToken: true,
      pageId: true,
      instagramUserId: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  const warnings: string[] = []
  const totals = {
    impressions: 0,
    reach: 0,
    engagements: 0,
    profileViews: 0,
    engagementRate: 0,
  }
  const byPlatform: Record<Platform, { impressions: number; reach: number; engagements: number; profileViews: number }> = {
    facebook: { impressions: 0, reach: 0, engagements: 0, profileViews: 0 },
    instagram: { impressions: 0, reach: 0, engagements: 0, profileViews: 0 },
  }

  if (mode !== 'live') {
    const published = await prisma.scheduledPost.count({
      where: { status: 'published', publishAt: { gte: since, lte: now } },
    })
    totals.impressions = published * 1200
    totals.reach = Math.round(totals.impressions * 0.62)
    totals.engagements = Math.round(totals.impressions * 0.048)
    totals.profileViews = Math.round(totals.reach * 0.09)
    totals.engagementRate = totals.reach > 0 ? Number(((totals.engagements / totals.reach) * 100).toFixed(2)) : 0

    byPlatform.facebook = {
      impressions: Math.round(totals.impressions * 0.45),
      reach: Math.round(totals.reach * 0.44),
      engagements: Math.round(totals.engagements * 0.42),
      profileViews: Math.round(totals.profileViews * 0.33),
    }
    byPlatform.instagram = {
      impressions: totals.impressions - byPlatform.facebook.impressions,
      reach: totals.reach - byPlatform.facebook.reach,
      engagements: totals.engagements - byPlatform.facebook.engagements,
      profileViews: totals.profileViews - byPlatform.facebook.profileViews,
    }

    warnings.push('Modo mock activo. Las metricas son estimadas desde publicaciones internas.')
    return {
      mode,
      periodDays,
      totals,
      perPlatform: [
        { platform: 'facebook', ...byPlatform.facebook },
        { platform: 'instagram', ...byPlatform.instagram },
      ],
      connectedAccounts: accounts.length,
      analyzedAccounts: 0,
      warnings,
    }
  }

  let analyzedAccounts = 0

  for (const account of accounts.slice(0, 20)) {
    const token = account.accessToken
    if (!token) continue

    try {
      if (account.platform === 'facebook') {
        if (!account.pageId) {
          warnings.push(`Cuenta ${account.id}: falta pageId para insights de Facebook.`)
          continue
        }

        const impressions = await fetchFirstSupportedMetric({
          id: account.pageId,
          token,
          metrics: ['page_impressions'],
          period: 'day',
          since,
          until: now,
          warnings,
          warningPrefix: `Cuenta ${account.id}: sin metrica valida de impresiones en Facebook`,
        })
        const engagements = await fetchFirstSupportedMetric({
          id: account.pageId,
          token,
          metrics: ['page_post_engagements', 'page_engaged_users'],
          period: 'day',
          since,
          until: now,
          warnings,
          warningPrefix: `Cuenta ${account.id}: sin metrica valida de interacciones en Facebook`,
        })
        const reach = await fetchFirstSupportedMetric({
          id: account.pageId,
          token,
          metrics: ['page_impressions_unique', 'page_posts_impressions_unique'],
          period: 'day',
          since,
          until: now,
          warnings,
          warningPrefix: `Cuenta ${account.id}: sin metrica valida de alcance en Facebook`,
        })

        byPlatform.facebook.impressions += impressions
        byPlatform.facebook.engagements += engagements
        byPlatform.facebook.reach += reach
        analyzedAccounts += 1
      }

      if (account.platform === 'instagram') {
        if (!account.instagramUserId) {
          warnings.push(`Cuenta ${account.id}: falta instagramUserId para insights de Instagram.`)
          continue
        }

        const impressions = await fetchFirstSupportedMetric({
          id: account.instagramUserId,
          token,
          metrics: ['impressions'],
          period: 'day',
          since,
          until: now,
          warnings,
          warningPrefix: `Cuenta ${account.id}: sin metrica valida de impresiones en Instagram`,
        })
        const reach = await fetchFirstSupportedMetric({
          id: account.instagramUserId,
          token,
          metrics: ['reach'],
          period: 'day',
          since,
          until: now,
          warnings,
          warningPrefix: `Cuenta ${account.id}: sin metrica valida de alcance en Instagram`,
        })
        const profileViews = await fetchFirstSupportedMetric({
          id: account.instagramUserId,
          token,
          metrics: ['profile_views', 'profile_visits'],
          period: 'day',
          since,
          until: now,
          warnings,
          warningPrefix: `Cuenta ${account.id}: sin metrica valida de visitas de perfil en Instagram`,
        })

        const mediaUrl = new URL(`https://graph.facebook.com/v19.0/${encodeURIComponent(account.instagramUserId)}/media`)
        mediaUrl.searchParams.set('fields', 'like_count,comments_count,timestamp')
        mediaUrl.searchParams.set('since', Math.floor(since.getTime() / 1000).toString())
        mediaUrl.searchParams.set('access_token', token)
        const mediaJson = await fetchGraph(mediaUrl)
        const mediaData = (mediaJson as { data?: Array<{ like_count?: number; comments_count?: number }> }).data ?? []
        const engagements = mediaData.reduce((acc, item) => acc + asNumber(item.like_count) + asNumber(item.comments_count), 0)

        byPlatform.instagram.impressions += impressions
        byPlatform.instagram.reach += reach
        byPlatform.instagram.profileViews += profileViews
        byPlatform.instagram.engagements += engagements
        analyzedAccounts += 1
      }
    } catch (error) {
      warnings.push(`Cuenta ${account.id}: ${error instanceof Error ? error.message : 'Error de insights.'}`)
    }
  }

  totals.impressions = byPlatform.facebook.impressions + byPlatform.instagram.impressions
  totals.reach = byPlatform.facebook.reach + byPlatform.instagram.reach
  totals.engagements = byPlatform.facebook.engagements + byPlatform.instagram.engagements
  totals.profileViews = byPlatform.facebook.profileViews + byPlatform.instagram.profileViews
  totals.engagementRate = totals.reach > 0 ? Number(((totals.engagements / totals.reach) * 100).toFixed(2)) : 0

  return {
    mode,
    periodDays,
    totals,
    perPlatform: [
      { platform: 'facebook', ...byPlatform.facebook },
      { platform: 'instagram', ...byPlatform.instagram },
    ],
    connectedAccounts: accounts.length,
    analyzedAccounts,
    warnings,
  }
}
