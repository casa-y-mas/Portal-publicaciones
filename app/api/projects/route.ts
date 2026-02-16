import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET() {
  const items = await prisma.project.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      color: true,
    },
  })

  return NextResponse.json({ items })
}
