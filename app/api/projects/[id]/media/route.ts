import { NextResponse } from 'next/server'
import { syncProjectMedia } from '@/lib/project-media'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params

  try {
    const { project, items } = await syncProjectMedia(id)
    if (!project) {
      return NextResponse.json({ message: 'Proyecto no encontrado.' }, { status: 404 })
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        color: project.color,
      },
      total: items.length,
      items,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'PROJECT_NOT_FOUND') {
      return NextResponse.json({ message: 'Proyecto no encontrado.' }, { status: 404 })
    }
    const message = error instanceof Error ? error.message : 'No se pudo cargar la media del proyecto externo.'
    return NextResponse.json({ message }, { status: 502 })
  }
}
