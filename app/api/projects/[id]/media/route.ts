import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      color: true,
    },
  })

  if (!project) {
    return NextResponse.json({ message: 'Proyecto no encontrado.' }, { status: 404 })
  }

  const items = await prisma.mediaAsset.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
    include: {
      project: { select: { id: true, name: true, color: true } },
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json({
    project,
    total: items.length,
    items,
  })
}
