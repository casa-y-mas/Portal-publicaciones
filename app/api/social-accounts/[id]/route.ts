import { AccountPlatform, AccountStatus } from '@prisma/client'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { resolveProjectRecord } from '@/lib/project-resolution'

const updateSocialAccountSchema = z.object({
  platform: z.nativeEnum(AccountPlatform).optional(),
  username: z.string().trim().min(2).max(120).optional(),
  type: z.string().trim().min(2).max(80).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  expiresAt: z.string().datetime().optional().or(z.literal('')),
  projectId: z.string().min(1).optional(),
})

function serializeAccount(item: {
  id: string
  platform: AccountPlatform
  username: string
  type: string
  status: AccountStatus
  expiresAt: Date | null
  oauthProvider: string | null
  accessToken: string | null
  connectedAt: Date | null
  tokenLastChecked: Date | null
  tokenScopes: string | null
  pageId: string | null
  pageName: string | null
  instagramUserId: string | null
  lastError: string | null
  projectId: string
  createdAt: Date
  updatedAt: Date
  project: { id: string; name: string; color: string }
}) {
  return {
    id: item.id,
    platform: item.platform,
    username: item.username,
    type: item.type,
    status: item.status,
    expiresAt: item.expiresAt?.toISOString() ?? null,
    oauthProvider: item.oauthProvider,
    oauthConnected: Boolean(item.connectedAt && item.accessToken),
    connectedAt: item.connectedAt?.toISOString() ?? null,
    tokenLastChecked: item.tokenLastChecked?.toISOString() ?? null,
    tokenScopes: item.tokenScopes ? item.tokenScopes.split(',').map((scope) => scope.trim()).filter(Boolean) : [],
    pageId: item.pageId,
    pageName: item.pageName,
    instagramUserId: item.instagramUserId,
    lastError: item.lastError,
    projectId: item.projectId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    project: item.project,
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    const json = await request.json()
    const parsed = updateSocialAccountSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Payload invalido.',
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    let resolvedProjectId: string | undefined
    if (parsed.data.projectId) {
      const project = await resolveProjectRecord(parsed.data.projectId)

      if (!project) {
        return NextResponse.json({ message: 'Proyecto no encontrado.' }, { status: 404 })
      }

      resolvedProjectId = project.id
    }

    const updated = await prisma.socialAccount.update({
      where: { id },
      data: {
        platform: parsed.data.platform,
        username: parsed.data.username,
        type: parsed.data.type,
        status: parsed.data.status,
        expiresAt: parsed.data.expiresAt !== undefined ? (parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null) : undefined,
        projectId: resolvedProjectId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    })

    return NextResponse.json({ item: serializeAccount(updated) })
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ message: 'Cuenta social no encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'No se pudo actualizar la cuenta social.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    await prisma.socialAccount.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ message: 'Cuenta social no encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'No se pudo eliminar la cuenta social.' }, { status: 500 })
  }
}
