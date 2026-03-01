import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const hasPrivilegedRole = session?.user?.role === 'admin' || session?.user?.role === 'supervisor'
  if (!hasPrivilegedRole) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const updated = await prisma.socialAccount.update({
      where: { id },
      data: {
        status: 'disconnected',
        oauthState: null,
        accessToken: null,
        refreshToken: null,
        tokenScopes: null,
        tokenLastChecked: new Date(),
        connectedAt: null,
        lastError: null,
        pageId: null,
        pageName: null,
        instagramUserId: null,
      },
      include: {
        project: {
          select: { id: true, name: true, color: true },
        },
      },
    })

    return NextResponse.json({
      item: {
        id: updated.id,
        platform: updated.platform,
        username: updated.username,
        type: updated.type,
        status: updated.status,
        expiresAt: updated.expiresAt?.toISOString() ?? null,
        oauthProvider: updated.oauthProvider,
        oauthConnected: false,
        connectedAt: null,
        tokenLastChecked: updated.tokenLastChecked?.toISOString() ?? null,
        tokenScopes: [],
        pageId: null,
        pageName: null,
        instagramUserId: null,
        lastError: updated.lastError,
        projectId: updated.projectId,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        project: updated.project,
      },
    })
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ message: 'Cuenta social no encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'No se pudo desconectar la cuenta.' }, { status: 500 })
  }
}
