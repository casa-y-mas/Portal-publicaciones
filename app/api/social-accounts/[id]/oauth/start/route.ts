import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { authOptions } from '@/lib/auth'
import { createMetaOAuthStart } from '@/lib/meta-oauth'

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const hasPrivilegedRole = session?.user?.role === 'admin' || session?.user?.role === 'supervisor'
  if (!hasPrivilegedRole) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const { id } = await context.params
  try {
    const start = await createMetaOAuthStart(id)

    return NextResponse.json({
      item: {
        accountId: start.account.id,
        provider: 'meta',
        state: start.oauthState,
        authUrl: start.authUrl,
        mode: start.mode,
        requiresRedirect: start.mode === 'live',
        accountLabel: start.account.username,
        project: start.account.project.name,
        platform: start.account.platform,
        scopes: start.scopes,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo iniciar OAuth.' },
      { status: 400 },
    )
  }
}
