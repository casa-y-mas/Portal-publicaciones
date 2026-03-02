import { NextResponse } from 'next/server'

import { getNotificationsData, markAllNotificationsAsRead } from '@/lib/operations-feed'

export async function GET() {
  const data = await getNotificationsData()
  return NextResponse.json(data)
}

export async function PATCH() {
  await markAllNotificationsAsRead()
  const data = await getNotificationsData()
  return NextResponse.json(data)
}
