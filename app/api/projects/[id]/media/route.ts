import { NextResponse } from 'next/server'
import { fetchExternalProjectByIdOrSlug, normalizeExternalProjectMedia } from '@/lib/external-projects'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params

  try {
    const project = await fetchExternalProjectByIdOrSlug(id)
    if (!project) {
      return NextResponse.json({ message: 'Proyecto no encontrado.' }, { status: 404 })
    }

    const items = normalizeExternalProjectMedia(project)
    const projectId = project.id != null ? String(project.id) : project.slug ?? id
    const projectName = project.titulo?.trim() || project.slug || `Proyecto ${projectId}`

    return NextResponse.json({
      project: {
        id: projectId,
        name: projectName,
        color: '#3B82F6',
      },
      total: items.length,
      items,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo cargar la media del proyecto externo.'
    return NextResponse.json({ message }, { status: 502 })
  }
}
