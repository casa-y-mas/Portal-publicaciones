import { AccountPlatform, AccountStatus } from '@prisma/client'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

const createSocialAccountSchema = z.object({
  platform: z.nativeEnum(AccountPlatform),
  username: z.string().trim().min(2).max(120),
  type: z.string().trim().min(2).max(80),
  status: z.nativeEnum(AccountStatus).optional(),
  expiresAt: z.string().datetime().optional().or(z.literal('')),
  projectId: z.string().min(1),
})

export async function GET() {
  const items = await prisma.socialAccount.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
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

  return NextResponse.json({
    items: items.map((item) => ({
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
    })),
  })
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = createSocialAccountSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Payload invalido.',
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const project = await prisma.project.findUnique({
      where: { id: parsed.data.projectId },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json({ message: 'Proyecto no encontrado.' }, { status: 404 })
    }

    const created = await prisma.socialAccount.create({
      data: {
        platform: parsed.data.platform,
        username: parsed.data.username,
        type: parsed.data.type,
        status: parsed.data.status ?? AccountStatus.connected,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        projectId: parsed.data.projectId,
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

    return NextResponse.json(
      {
        item: {
          id: created.id,
          platform: created.platform,
          username: created.username,
          type: created.type,
          status: created.status,
          expiresAt: created.expiresAt?.toISOString() ?? null,
          oauthProvider: created.oauthProvider,
          oauthConnected: Boolean(created.connectedAt && created.accessToken),
          connectedAt: created.connectedAt?.toISOString() ?? null,
          tokenLastChecked: created.tokenLastChecked?.toISOString() ?? null,
          tokenScopes: created.tokenScopes ? created.tokenScopes.split(',').map((scope) => scope.trim()).filter(Boolean) : [],
          pageId: created.pageId,
          pageName: created.pageName,
          instagramUserId: created.instagramUserId,
          lastError: created.lastError,
          projectId: created.projectId,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
          project: created.project,
        },
      },
      { status: 201 },
    )
  } catch {
    return NextResponse.json({ message: 'No se pudo crear la cuenta social.' }, { status: 500 })
  }
}
