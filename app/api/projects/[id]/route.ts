import { NextResponse } from 'next/server'
import { fetchExternalProjectByIdOrSlug, normalizeExternalProject } from '@/lib/external-projects'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const externalItem = await fetchExternalProjectByIdOrSlug(id)
    if (externalItem) {
      const item = normalizeExternalProject(externalItem)
      return NextResponse.json({ item })
    }

    return NextResponse.json({ message: 'Proyecto no encontrado.' }, { status: 404 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo consultar el proyecto externo.'
    return NextResponse.json({ message }, { status: 502 })
  }
}

export async function PATCH() {
  return NextResponse.json(
    { message: 'La edicion local de proyectos esta deshabilitada. Los proyectos se sincronizan desde API externa.' },
    { status: 405 },
  )
}

export async function DELETE() {
  return NextResponse.json(
    { message: 'La eliminacion local de proyectos esta deshabilitada. Los proyectos se sincronizan desde API externa.' },
    { status: 405 },
  )
}
