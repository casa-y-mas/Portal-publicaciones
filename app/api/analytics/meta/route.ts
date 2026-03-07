import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

import { authOptions } from '@/lib/auth'
import { getMetaAnalyticsSummary } from '@/lib/meta-analytics'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const daysRaw = request.nextUrl.searchParams.get('days')
  const days = daysRaw ? Number(daysRaw) : 7

  try {
    const summary = await getMetaAnalyticsSummary(days)
    return NextResponse.json({ summary })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo obtener analytics de Meta.' },
      { status: 500 },
    )
  }
}
