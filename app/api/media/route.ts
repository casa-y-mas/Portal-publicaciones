import { NextResponse } from 'next/server'
import { MediaAssetType } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mediaUrlSchema = z.string().trim().min(1).refine(
  (value) => value.startsWith('/') || /^https?:\/\//i.test(value),
  'URL invalida.',
)

const createMediaSchema = z.object({
  fileName: z.string().min(2),
  url: mediaUrlSchema,
  mimeType: z.string().min(3),
  type: z.nativeEnum(MediaAssetType),
  sizeBytes: z.number().int().positive(),
  projectId: z.string().min(1),
  tags: z.array(z.string().trim().min(1)).optional().default([]),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim() || ''
  const projectId = searchParams.get('projectId') || undefined
  const type = searchParams.get('type') as MediaAssetType | null
  const tag = searchParams.get('tag')?.trim() || ''

  const media = await prisma.mediaAsset.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { fileName: { contains: search, mode: 'insensitive' } },
              { mimeType: { contains: search, mode: 'insensitive' } },
              { project: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
      ...(projectId ? { projectId } : {}),
      ...(type && Object.values(MediaAssetType).includes(type) ? { type } : {}),
      ...(tag ? { tagsJson: { array_contains: [tag] } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      project: { select: { id: true, name: true, color: true } },
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json({ items: media })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const raw = await request.json()
  const parsed = createMediaSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid payload', errors: parsed.error.flatten() }, { status: 400 })
  }

  const projectExists = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    select: { id: true },
  })
  if (!projectExists) {
    return NextResponse.json({ message: 'Project not found' }, { status: 404 })
  }

  const uploader = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  })

  const created = await prisma.mediaAsset.create({
    data: {
      fileName: parsed.data.fileName,
      url: parsed.data.url,
      mimeType: parsed.data.mimeType,
      type: parsed.data.type,
      sizeBytes: parsed.data.sizeBytes,
      projectId: parsed.data.projectId,
      tagsJson: parsed.data.tags,
      uploadedById: uploader?.id ?? null,
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json(created, { status: 201 })
}
