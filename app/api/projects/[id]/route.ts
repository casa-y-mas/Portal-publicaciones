import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

const updateProjectSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    color: z.string().trim().regex(/^#([0-9a-fA-F]{6})$/, 'Color invalido. Usa formato #RRGGBB.').optional(),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  })

const projectSelect = {
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
} as const

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await prisma.project.findUnique({
    where: { id },
    select: projectSelect,
  })

  if (!item) {
    return NextResponse.json({ message: 'Proyecto no encontrado.' }, { status: 404 })
  }

  return NextResponse.json({ item })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const json = await request.json()
    const parsed = updateProjectSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Payload invalido.',
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: parsed.data.name,
        color: parsed.data.color,
        description: parsed.data.description === '' ? null : parsed.data.description,
      },
      select: projectSelect,
    })

    return NextResponse.json({ item: updated })
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error) {
      if (error.code === 'P2025') {
        return NextResponse.json({ message: 'Proyecto no encontrado.' }, { status: 404 })
      }
      if (error.code === 'P2002') {
        return NextResponse.json({ message: 'Ya existe un proyecto con ese nombre.' }, { status: 409 })
      }
    }

    return NextResponse.json({ message: 'No se pudo actualizar el proyecto.' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    await prisma.project.delete({
      where: { id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ message: 'Proyecto no encontrado.' }, { status: 404 })
    }
    return NextResponse.json({ message: 'No se pudo eliminar el proyecto.' }, { status: 500 })
  }
}
