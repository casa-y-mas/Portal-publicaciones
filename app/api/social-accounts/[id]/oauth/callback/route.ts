import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { failMetaOAuth, finalizeMetaOAuth } from '@/lib/meta-oauth'

const oauthCallbackSchema = z.object({
  state: z.string().trim().min(8),
  code: z.string().trim().min(4).optional().or(z.literal('')),
  pageId: z.string().trim().optional().or(z.literal('')),
  pageName: z.string().trim().optional().or(z.literal('')),
  instagramUserId: z.string().trim().optional().or(z.literal('')),
  scopes: z.array(z.string().trim().min(1)).optional(),
})

async function ensurePrivilege() {
  const session = await getServerSession(authOptions)
  return session?.user?.role === 'admin' || session?.user?.role === 'supervisor'
}

function getSocialAccountsRedirectUrl(request: NextRequest) {
  const appUrl = process.env.APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim() || ''
  const baseUrl = appUrl || request.nextUrl.origin
  return new URL('/social-accounts', baseUrl)
}

function serializeAccount(updated: Awaited<ReturnType<typeof finalizeMetaOAuth>>) {
  return {
    id: updated.id,
    platform: updated.platform,
    username: updated.username,
    type: updated.type,
    status: updated.status,
    expiresAt: updated.expiresAt?.toISOString() ?? null,
    oauthProvider: updated.oauthProvider,
    oauthConnected: Boolean(updated.connectedAt && updated.accessToken),
    connectedAt: updated.connectedAt?.toISOString() ?? null,
    tokenLastChecked: updated.tokenLastChecked?.toISOString() ?? null,
    tokenScopes: updated.tokenScopes ? updated.tokenScopes.split(',').map((scope) => scope.trim()).filter(Boolean) : [],
    pageId: updated.pageId,
    pageName: updated.pageName,
    instagramUserId: updated.instagramUserId,
    lastError: updated.lastError,
    projectId: updated.projectId,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    project: updated.project,
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const hasPrivilegedRole = await ensurePrivilege()
  if (!hasPrivilegedRole) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const { id } = await context.params
  const raw = await request.json()
  const parsed = oauthCallbackSchema.safeParse(raw)

  if (!parsed.success) {
    return NextResponse.json({ message: 'Payload invalido.', errors: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const updated = await finalizeMetaOAuth({
      accountId: id,
      state: parsed.data.state,
      code: parsed.data.code || null,
      pageId: parsed.data.pageId || null,
      pageName: parsed.data.pageName || null,
      instagramUserId: parsed.data.instagramUserId || null,
      scopes: parsed.data.scopes ?? [],
    })

    return NextResponse.json({ item: serializeAccount(updated) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo completar OAuth.'
    await failMetaOAuth(id, message)
    return NextResponse.json({ message }, { status: 400 })
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const state = request.nextUrl.searchParams.get('state') ?? ''
  const code = request.nextUrl.searchParams.get('code') ?? ''
  const errorReason = request.nextUrl.searchParams.get('error_description') || request.nextUrl.searchParams.get('error')
  const redirectUrl = getSocialAccountsRedirectUrl(request)

  if (errorReason) {
    await failMetaOAuth(id, errorReason)
    return NextResponse.redirect(redirectUrl)
  }

  try {
    await finalizeMetaOAuth({
      accountId: id,
      state,
      code,
    })
  } catch (error) {
    await failMetaOAuth(id, error instanceof Error ? error.message : 'No se pudo completar OAuth.')
  }

  return NextResponse.redirect(redirectUrl)
}
