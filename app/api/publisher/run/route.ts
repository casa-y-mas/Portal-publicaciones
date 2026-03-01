import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { authOptions } from '@/lib/auth'
import { processScheduledPublications } from '@/lib/publishing'

export async function POST() {
  const session = await getServerSession(authOptions)

  const hasPrivilegedRole = session?.user?.role === 'admin' || session?.user?.role === 'supervisor'
  if (!hasPrivilegedRole) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const summary = await processScheduledPublications(20)
  return NextResponse.json(summary)
}
