import { NextResponse } from 'next/server'
import { getNormalizedProjects } from '@/lib/external-projects'

export async function GET() {
  try {
    const items = await getNormalizedProjects()
    return NextResponse.json({ items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron cargar los proyectos externos.'
    return NextResponse.json({ message }, { status: 502 })
  }
}

export async function POST() {
  return NextResponse.json(
    { message: 'La creacion local de proyectos esta deshabilitada. Los proyectos se sincronizan desde API externa.' },
    { status: 405 },
  )
}
