import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{6})$/, 'Color invalido. Usa formato #RRGGBB.'),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
})

export async function GET() {
  const items = await prisma.project.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      color: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          posts: true,
          mediaAssets: true,
          socialAccounts: true,
        },
      },
    },
  })

  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = createProjectSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Payload invalido.',
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const created = await prisma.project.create({
      data: {
        name: parsed.data.name,
        color: parsed.data.color,
        description: parsed.data.description || null,
      },
      select: {
        id: true,
        name: true,
        color: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            mediaAssets: true,
            socialAccounts: true,
          },
        },
      },
    })

    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ message: 'Ya existe un proyecto con ese nombre.' }, { status: 409 })
    }

    return NextResponse.json({ message: 'No se pudo crear el proyecto.' }, { status: 500 })
  }
}
