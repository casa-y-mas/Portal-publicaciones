import { NextResponse } from 'next/server'
import { MediaAssetType } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const updateMediaSchema = z.object({
  fileName: z.string().min(2).optional(),
  url: z.string().url().optional(),
  mimeType: z.string().min(3).optional(),
  type: z.nativeEnum(MediaAssetType).optional(),
  sizeBytes: z.number().int().positive().optional(),
  projectId: z.string().min(1).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
})

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const media = await prisma.mediaAsset.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, color: true } },
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  })

  if (!media) {
    return NextResponse.json({ message: 'Media not found' }, { status: 404 })
  }

  return NextResponse.json(media)
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const raw = await request.json()
  const parsed = updateMediaSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid payload', errors: parsed.error.flatten() }, { status: 400 })
  }

  const existing = await prisma.mediaAsset.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json({ message: 'Media not found' }, { status: 404 })
  }

  if (parsed.data.projectId) {
    const projectExists = await prisma.project.findUnique({
      where: { id: parsed.data.projectId },
      select: { id: true },
    })
    if (!projectExists) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 })
    }
  }

  const updated = await prisma.mediaAsset.update({
    where: { id },
    data: {
      ...(parsed.data.fileName ? { fileName: parsed.data.fileName } : {}),
      ...(parsed.data.url ? { url: parsed.data.url } : {}),
      ...(parsed.data.mimeType ? { mimeType: parsed.data.mimeType } : {}),
      ...(parsed.data.type ? { type: parsed.data.type } : {}),
      ...(parsed.data.sizeBytes ? { sizeBytes: parsed.data.sizeBytes } : {}),
      ...(parsed.data.projectId ? { projectId: parsed.data.projectId } : {}),
      ...(parsed.data.tags ? { tagsJson: parsed.data.tags } : {}),
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.mediaAsset.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json({ message: 'Media not found' }, { status: 404 })
  }

  await prisma.mediaAsset.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
