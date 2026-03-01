import { randomUUID } from 'crypto'

import { AccountStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'

type FinalizeInput = {
  accountId: string
  state: string
  code?: string | null
  pageId?: string | null
  pageName?: string | null
  instagramUserId?: string | null
  scopes?: string[]
}

function getRequiredEnv() {
  const appId = process.env.META_APP_ID?.trim() || ''
  const appSecret = process.env.META_APP_SECRET?.trim() || ''
  const appUrl = process.env.APP_URL?.trim() || ''

  return {
    appId,
    appSecret,
    appUrl,
    isLiveConfigured: Boolean(appId && appSecret && appUrl),
  }
}

export function getMetaRedirectUri(accountId: string) {
  const { appUrl } = getRequiredEnv()
  if (!appUrl) return null
  return `${appUrl.replace(/\/$/, '')}/api/social-accounts/${accountId}/oauth/callback`
}

export async function createMetaOAuthStart(accountId: string) {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      platform: true,
      username: true,
      project: { select: { name: true } },
    },
  })

  if (!account) {
    throw new Error('Cuenta social no encontrada.')
  }

  const oauthState = randomUUID()
  await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      oauthProvider: 'meta',
      oauthState,
      lastError: null,
    },
  })

  const scopes = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'instagram_basic',
    'instagram_content_publish',
  ]

  const env = getRequiredEnv()
  const redirectUri = getMetaRedirectUri(accountId)
  const authUrl =
    env.isLiveConfigured && redirectUri
      ? `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(env.appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(oauthState)}&scope=${encodeURIComponent(scopes.join(','))}`
      : null

  return {
    account,
    oauthState,
    scopes,
    authUrl,
    mode: authUrl ? 'live' : 'mock',
  }
}

async function exchangeCodeForMetaToken(code: string, redirectUri: string) {
  const env = getRequiredEnv()
  if (!env.isLiveConfigured) {
    return {
      accessToken: `meta_access_${code}`,
      refreshToken: `meta_refresh_${code}`,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      scopes: [] as string[],
      source: 'mock' as const,
    }
  }

  const url = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
  url.searchParams.set('client_id', env.appId)
  url.searchParams.set('client_secret', env.appSecret)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('code', code)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  const json = await response.json().catch(() => null)
  if (!response.ok || !json?.access_token) {
    throw new Error(json?.error?.message ?? 'No se pudo intercambiar el codigo OAuth con Meta.')
  }

  const expiresIn = typeof json.expires_in === 'number' ? json.expires_in : 60 * 24 * 60 * 60
  return {
    accessToken: json.access_token as string,
    refreshToken: null,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    scopes: [] as string[],
    source: 'meta' as const,
  }
}

async function fetchMetaPageIdentity(accessToken: string) {
  const env = getRequiredEnv()
  if (!env.isLiveConfigured) {
    return {
      pageId: null,
      pageName: null,
      instagramUserId: null,
      scopes: [] as string[],
    }
  }

  const url = new URL('https://graph.facebook.com/v19.0/me/accounts')
  url.searchParams.set('fields', 'id,name,access_token,instagram_business_account{id,username}')
  url.searchParams.set('access_token', accessToken)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  const json = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(json?.error?.message ?? 'No se pudieron leer las paginas conectadas en Meta.')
  }

  const firstPage = Array.isArray(json?.data) ? json.data[0] : null
  return {
    pageId: firstPage?.id ?? null,
    pageName: firstPage?.name ?? null,
    instagramUserId: firstPage?.instagram_business_account?.id ?? null,
    scopes: Array.isArray(json?.perms) ? json.perms.filter((item: unknown): item is string => typeof item === 'string') : [],
  }
}

export async function finalizeMetaOAuth(input: FinalizeInput) {
  const existing = await prisma.socialAccount.findUnique({
    where: { id: input.accountId },
    select: {
      id: true,
      oauthState: true,
      username: true,
    },
  })

  if (!existing) {
    throw new Error('Cuenta social no encontrada.')
  }

  if (!existing.oauthState || existing.oauthState !== input.state) {
    throw new Error('Estado OAuth invalido o vencido.')
  }

  const redirectUri = getMetaRedirectUri(input.accountId)
  const tokenBundle = input.code && redirectUri
    ? await exchangeCodeForMetaToken(input.code, redirectUri)
    : {
        accessToken: 'meta_access_mock',
        refreshToken: 'meta_refresh_mock',
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        scopes: [] as string[],
        source: 'mock' as const,
      }

  const metaIdentity =
    tokenBundle.source === 'meta'
      ? await fetchMetaPageIdentity(tokenBundle.accessToken)
      : {
          pageId: input.pageId ?? null,
          pageName: input.pageName ?? null,
          instagramUserId: input.instagramUserId ?? null,
          scopes: input.scopes ?? [],
        }

  const now = new Date()
  const updated = await prisma.socialAccount.update({
    where: { id: input.accountId },
    data: {
      status: AccountStatus.connected,
      oauthProvider: 'meta',
      oauthState: null,
      accessToken: tokenBundle.accessToken,
      refreshToken: tokenBundle.refreshToken,
      tokenScopes: Array.from(new Set([...(input.scopes ?? []), ...tokenBundle.scopes, ...metaIdentity.scopes])).join(','),
      tokenLastChecked: now,
      connectedAt: now,
      lastError: null,
      expiresAt: tokenBundle.expiresAt,
      pageId: metaIdentity.pageId,
      pageName: metaIdentity.pageName,
      instagramUserId: metaIdentity.instagramUserId,
    },
    include: {
      project: {
        select: { id: true, name: true, color: true },
      },
    },
  })

  return updated
}

export async function failMetaOAuth(accountId: string, message: string) {
  try {
    await prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        status: AccountStatus.disconnected,
        tokenLastChecked: new Date(),
        lastError: message,
      },
    })
  } catch {
    // best effort
  }
}
