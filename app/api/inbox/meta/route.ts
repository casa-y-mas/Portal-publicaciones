import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { InboxStatus } from '@prisma/client'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { addInboxThreadNote, getMetaSocialInbox, updateInboxThread } from '@/lib/meta-inbox'

const updateThreadSchema = z.object({
  threadId: z.string().trim().min(1),
  status: z.nativeEnum(InboxStatus).optional(),
  assignedToId: z.string().trim().min(1).nullable().optional(),
})

const createNoteSchema = z.object({
  threadId: z.string().trim().min(1),
  body: z.string().trim().min(2).max(2000),
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const limitRaw = request.nextUrl.searchParams.get('limit')
  const limit = limitRaw ? Number(limitRaw) : 80

  try {
    const summary = await getMetaSocialInbox(limit)
    return NextResponse.json({ summary })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo obtener el inbox social.' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const raw = await request.json().catch(() => null)
  const parsed = updateThreadSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Payload invalido.', errors: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const updated = await updateInboxThread({
      threadId: parsed.data.threadId,
      status: parsed.data.status,
      assignedToId: parsed.data.assignedToId,
      actingUserId: session.user.id,
    })

    return NextResponse.json({
      item: {
        id: updated.id,
        status: updated.status,
        assignedToId: updated.assignedToId,
        resolvedAt: updated.resolvedAt?.toISOString() ?? null,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo actualizar la conversacion.' },
      { status: 400 },
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const raw = await request.json().catch(() => null)
  const parsed = createNoteSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Payload invalido.', errors: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const note = await addInboxThreadNote({
      threadId: parsed.data.threadId,
      body: parsed.data.body,
      authorId: session.user.id,
    })

    return NextResponse.json({
      item: {
        id: note.id,
        body: note.body,
        createdAt: note.createdAt.toISOString(),
        author: note.author,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo agregar la nota.' },
      { status: 400 },
    )
  }
}
