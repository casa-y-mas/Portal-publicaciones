import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [users, projects, posts] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.scheduledPost.count(),
    ])

    return NextResponse.json({
      ok: true,
      db: 'connected',
      counts: { users, projects, posts },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        db: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown database error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
