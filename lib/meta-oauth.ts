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

type MetaPageIdentity = {
  pageId: string
  pageName: string
  pageAccessToken: string
  instagramUserId: string | null
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
  const shortLivedToken = json.access_token as string

  const exchangeUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
  exchangeUrl.searchParams.set('grant_type', 'fb_exchange_token')
  exchangeUrl.searchParams.set('client_id', env.appId)
  exchangeUrl.searchParams.set('client_secret', env.appSecret)
  exchangeUrl.searchParams.set('fb_exchange_token', shortLivedToken)

  const longLivedResponse = await fetch(exchangeUrl.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  const longLivedJson = await longLivedResponse.json().catch(() => null)

  const hasLongLivedToken = Boolean(longLivedResponse.ok && longLivedJson?.access_token)
  const effectiveAccessToken = hasLongLivedToken ? (longLivedJson.access_token as string) : shortLivedToken
  const effectiveExpiresIn =
    hasLongLivedToken && typeof longLivedJson?.expires_in === 'number'
      ? longLivedJson.expires_in
      : expiresIn

  return {
    accessToken: effectiveAccessToken,
    refreshToken: null,
    expiresAt: new Date(Date.now() + effectiveExpiresIn * 1000),
    scopes: [] as string[],
    source: 'meta' as const,
  }
}

async function fetchMetaPages(userAccessToken: string) {
  const env = getRequiredEnv()
  if (!env.isLiveConfigured) {
    return []
  }

  const normalizedToken = userAccessToken.trim()
  if (!normalizedToken) {
    throw new Error('La cuenta no tiene un token OAuth valido. Reconecta la cuenta en Meta.')
  }

  if (
    normalizedToken.startsWith('meta_access_') ||
    normalizedToken.startsWith('meta_refresh_') ||
    normalizedToken.startsWith('demo_')
  ) {
    throw new Error('La cuenta sigue con un token simulado o incompleto. Desconecta OAuth y vuelve a conectar con Meta.')
  }

  const url = new URL('https://graph.facebook.com/v19.0/me/accounts')
  url.searchParams.set('fields', 'id,name,access_token,instagram_business_account{id,username}')
  url.searchParams.set('access_token', normalizedToken)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  const json = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(json?.error?.message ?? 'No se pudieron leer las paginas conectadas en Meta.')
  }

  if (!Array.isArray(json?.data)) return []
  return json.data
    .filter((item: unknown) => typeof item === 'object' && item !== null)
    .map((item: unknown): MetaPageIdentity => {
      const page = item as Record<string, unknown>
      return {
        pageId: typeof page.id === 'string' ? page.id : '',
        pageName: typeof page.name === 'string' ? page.name : '',
        pageAccessToken: typeof page.access_token === 'string' ? page.access_token : '',
        instagramUserId:
          typeof page.instagram_business_account === 'object' &&
          page.instagram_business_account &&
          typeof (page.instagram_business_account as Record<string, unknown>).id === 'string'
            ? ((page.instagram_business_account as Record<string, unknown>).id as string)
            : null,
      }
    })
    .filter((page: MetaPageIdentity) => Boolean(page.pageId && page.pageName && page.pageAccessToken))
}

function selectMetaPage(pages: MetaPageIdentity[], desiredPageId?: string | null) {
  if (!pages.length) return null
  if (desiredPageId) {
    const exact = pages.find((page) => page.pageId === desiredPageId)
    if (exact) return exact
  }
  return pages[0]
}

export async function finalizeMetaOAuth(input: FinalizeInput) {
  const existing = await prisma.socialAccount.findUnique({
    where: { id: input.accountId },
    select: {
      id: true,
      oauthState: true,
      username: true,
      platform: true,
    },
  })

  if (!existing) {
    throw new Error('Cuenta social no encontrada.')
  }

  if (!existing.oauthState || existing.oauthState !== input.state) {
    throw new Error('Estado OAuth invalido o vencido.')
  }

  const redirectUri = getMetaRedirectUri(input.accountId)
  const env = getRequiredEnv()
  if (env.isLiveConfigured && !input.code) {
    throw new Error('Meta no devolvio el codigo OAuth. Revisa la URI de redireccionamiento valida y vuelve a conectar la cuenta.')
  }

  const tokenBundle = input.code && redirectUri
    ? await exchangeCodeForMetaToken(input.code, redirectUri)
    : {
        accessToken: 'meta_access_mock',
        refreshToken: 'meta_refresh_mock',
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        scopes: [] as string[],
        source: 'mock' as const,
      }

  const pages =
    tokenBundle.source === 'meta'
      ? await fetchMetaPages(tokenBundle.accessToken)
      : []

  const selectedMetaPage =
    tokenBundle.source === 'meta'
      ? selectMetaPage(pages, input.pageId)
      : {
          pageId: input.pageId ?? '',
          pageName: input.pageName ?? '',
          pageAccessToken: tokenBundle.accessToken,
          instagramUserId: input.instagramUserId ?? null,
        }

  if (existing.platform === 'facebook' && !selectedMetaPage?.pageId) {
    throw new Error('La cuenta Meta no tiene paginas administrables. Crea una pagina de Facebook y vuelve a conectar.')
  }

  const now = new Date()
  const updated = await prisma.socialAccount.update({
    where: { id: input.accountId },
    data: {
      status: AccountStatus.connected,
      oauthProvider: 'meta',
      oauthState: null,
      accessToken: selectedMetaPage?.pageAccessToken ?? tokenBundle.accessToken,
      refreshToken: tokenBundle.source === 'meta' ? tokenBundle.accessToken : tokenBundle.refreshToken,
      tokenScopes: Array.from(new Set([...(input.scopes ?? []), ...tokenBundle.scopes])).join(','),
      tokenLastChecked: now,
      connectedAt: now,
      lastError: null,
      expiresAt: tokenBundle.expiresAt,
      pageId: selectedMetaPage?.pageId ?? null,
      pageName: selectedMetaPage?.pageName ?? null,
      instagramUserId: selectedMetaPage?.instagramUserId ?? null,
    },
    include: {
      project: {
        select: { id: true, name: true, color: true },
      },
    },
  })

  return updated
}

export async function getMetaPagesForAccount(accountId: string) {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      platform: true,
      refreshToken: true,
      accessToken: true,
      pageId: true,
      pageName: true,
      status: true,
    },
  })

  if (!account) {
    throw new Error('Cuenta social no encontrada.')
  }

  const userAccessToken = account.refreshToken || account.accessToken
  if (!userAccessToken) {
    throw new Error('La cuenta no tiene token OAuth. Reconecta la cuenta en Meta.')
  }

  const pages = await fetchMetaPages(userAccessToken)
  return {
    account,
    pages: pages.map((page: MetaPageIdentity) => ({
      pageId: page.pageId,
      pageName: page.pageName,
      instagramUserId: page.instagramUserId,
      isSelected: account.pageId === page.pageId,
    })),
  }
}

export async function selectMetaAccountPage(input: { accountId: string; pageId: string }) {
  const pagesResult = await getMetaPagesForAccount(input.accountId)
  const account = pagesResult.account
  const userAccessToken = account.refreshToken || account.accessToken
  if (!userAccessToken) {
    throw new Error('La cuenta no tiene token OAuth. Reconecta la cuenta en Meta.')
  }

  const pages = await fetchMetaPages(userAccessToken)
  const selected = pages.find((page: MetaPageIdentity) => page.pageId === input.pageId)
  if (!selected) {
    throw new Error('La pagina seleccionada no pertenece a esta cuenta.')
  }

  const updated = await prisma.socialAccount.update({
    where: { id: input.accountId },
    data: {
      status: AccountStatus.connected,
      accessToken: selected.pageAccessToken,
      pageId: selected.pageId,
      pageName: selected.pageName,
      instagramUserId: selected.instagramUserId,
      tokenLastChecked: new Date(),
      lastError: null,
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
