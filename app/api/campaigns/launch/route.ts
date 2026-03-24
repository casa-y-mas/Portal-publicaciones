import { ContentType, PostStatus, Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { getCampaignBlueprint } from '@/lib/campaign-blueprints'
import { prisma } from '@/lib/prisma'
import { resolveProjectRecord } from '@/lib/project-resolution'

const launchCampaignSchema = z.object({
  projectId: z.string().min(1),
  blueprintKey: z.string().min(1),
  startDate: z.string().date(),
  mediaAssetId: z.string().optional().or(z.literal('')),
  platforms: z.array(z.string().trim().min(1)).min(1),
  status: z.enum(['draft', 'scheduled']),
})

function buildCampaignStamp(blueprintKey: string, blueprintName: string, step: number, total: number) {
  return {
    enabled: false,
    campaign: {
      blueprintKey,
      blueprintName,
      step,
      total,
    },
  } satisfies Prisma.InputJsonValue
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const raw = await request.json()
  const parsed = launchCampaignSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Payload invalido.', errors: parsed.error.flatten() }, { status: 400 })
  }

  const blueprint = getCampaignBlueprint(parsed.data.blueprintKey)
  if (!blueprint) {
    return NextResponse.json({ message: 'Plantilla de campana no encontrada.' }, { status: 404 })
  }

  const project = await resolveProjectRecord(parsed.data.projectId)
  if (!project) {
    return NextResponse.json({ message: 'Proyecto no encontrado.' }, { status: 404 })
  }

  const mediaAssetId = parsed.data.mediaAssetId || null
  if (parsed.data.status === 'scheduled' && !mediaAssetId) {
    return NextResponse.json({ message: 'Para programar una campana debes asociar una pieza multimedia.' }, { status: 400 })
  }

  if (mediaAssetId) {
    const media = await prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
      select: { id: true, projectId: true },
    })
    if (!media) {
      return NextResponse.json({ message: 'Archivo multimedia no encontrado.' }, { status: 404 })
    }
    if (media.projectId !== project.id) {
      return NextResponse.json({ message: 'La media debe pertenecer al mismo proyecto.' }, { status: 400 })
    }
  }

  const baseDate = new Date(`${parsed.data.startDate}T00:00:00`)
  if (Number.isNaN(baseDate.getTime())) {
    return NextResponse.json({ message: 'Fecha inicial invalida.' }, { status: 400 })
  }

  try {
    const createdPosts = await prisma.$transaction(
      blueprint.steps.map((step, index) => {
        const publishAt = new Date(baseDate)
        publishAt.setDate(baseDate.getDate() + step.dayOffset)
        publishAt.setHours(step.hour, step.minute, 0, 0)

        if (parsed.data.status === 'scheduled' && publishAt.getTime() < Date.now()) {
          throw new Error(`La pieza ${index + 1} quedaria en una fecha pasada.`)
        }

        return prisma.scheduledPost.create({
          data: {
            title: `${step.title} · ${project.name}`,
            caption: step.caption,
            contentType: step.contentType as ContentType,
            status: parsed.data.status as PostStatus,
            publishAt,
            projectId: project.id,
            creatorId: session.user.id,
            mediaAssetId,
            platformsJson: parsed.data.platforms,
            recurrenceJson: buildCampaignStamp(blueprint.key, blueprint.name, index + 1, blueprint.steps.length),
          },
          select: {
            id: true,
            title: true,
            publishAt: true,
            status: true,
          },
        })
      }),
    )

    return NextResponse.json({
      item: {
        blueprint: blueprint.name,
        project: project.name,
        total: createdPosts.length,
        posts: createdPosts.map((post, index) => ({
          id: post.id,
          title: post.title,
          publishAt: post.publishAt.toISOString(),
          status: post.status,
          step: index + 1,
        })),
      },
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo generar la campana.' },
      { status: 400 },
    )
  }
}
