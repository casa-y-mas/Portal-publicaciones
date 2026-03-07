import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { authOptions } from '@/lib/auth'
import { generateWeeklyExecutiveReport, getWeeklyExecutiveReport } from '@/lib/executive-reports'

async function ensureAuthorized() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return false
  return session.user.role === 'admin' || session.user.role === 'supervisor'
}

export async function GET() {
  const authorized = await ensureAuthorized()
  if (!authorized) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const report = await getWeeklyExecutiveReport()
  return NextResponse.json({ report })
}

export async function POST() {
  const authorized = await ensureAuthorized()
  if (!authorized) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const report = await generateWeeklyExecutiveReport()
  return NextResponse.json({ report })
}
