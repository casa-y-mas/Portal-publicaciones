import { AccountStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { getNormalizedProjects } from '@/lib/external-projects'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get('scope')?.trim().toLowerCase()

  if (scope === 'publishing-buckets') {
    const rows = await prisma.project.findMany({
      where: {
        socialAccounts: {
          some: {
            status: { in: [AccountStatus.connected, AccountStatus.token_expiring] },
            accessToken: { not: null },
          },
        },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ items: rows })
  }

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
