import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { authOptions } from '@/lib/auth'
import { getProjectPublishingReadiness, getPublishingQueueSnapshot, processScheduledPublications } from '@/lib/publishing'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, {
    status: init?.status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

async function isAuthorized() {
  const internalToken = process.env.PUBLISHER_RUN_TOKEN?.trim()
  const requestHeaders = await headers()
  const requestToken = requestHeaders.get('x-publisher-token')?.trim()
  const isInternalCall = Boolean(internalToken && requestToken && requestToken === internalToken)

  if (isInternalCall) return true

  const session = await getServerSession(authOptions)
  return session?.user?.role === 'admin' || session?.user?.role === 'supervisor'
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return json({ message: 'No autorizado.' }, { status: 401 })
  }

  const projectId = request.nextUrl.searchParams.get('projectId')?.trim()
  if (projectId) {
    const readiness = await getProjectPublishingReadiness(projectId)
    return json({ readiness })
  }

  const snapshot = await getPublishingQueueSnapshot()
  return json({ snapshot })
}

export async function POST(request: NextRequest) {
  const authorized = await isAuthorized()
  if (!authorized) {
    return json({ message: 'No autorizado.' }, { status: 401 })
  }

  try {
    const limitRaw = request.nextUrl.searchParams.get('limit')
    const postId = request.nextUrl.searchParams.get('postId')?.trim() || undefined
    const limit = limitRaw ? Number(limitRaw) : 20
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.trunc(limit), 1), 100) : 20

    const summary = await processScheduledPublications({
      limit: safeLimit,
      targetPostId: postId,
    })
    return json(summary)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno ejecutando el publicador.'
    return json({ message }, { status: 500 })
  }
}
