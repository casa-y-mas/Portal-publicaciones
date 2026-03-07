import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { getMetaPagesForAccount, selectMetaAccountPage } from '@/lib/meta-oauth'

const selectPageSchema = z.object({
  pageId: z.string().trim().min(1),
})

async function ensurePrivilege() {
  const session = await getServerSession(authOptions)
  return session?.user?.role === 'admin' || session?.user?.role === 'supervisor'
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const hasPrivilegedRole = await ensurePrivilege()
  if (!hasPrivilegedRole) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const result = await getMetaPagesForAccount(id)
    return NextResponse.json({
      item: {
        accountId: result.account.id,
        selectedPageId: result.account.pageId,
        selectedPageName: result.account.pageName,
        pages: result.pages,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudieron obtener las paginas.' },
      { status: 400 },
    )
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const hasPrivilegedRole = await ensurePrivilege()
  if (!hasPrivilegedRole) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const { id } = await context.params
  const raw = await request.json()
  const parsed = selectPageSchema.safeParse(raw)

  if (!parsed.success) {
    return NextResponse.json({ message: 'Payload invalido.', errors: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const updated = await selectMetaAccountPage({
      accountId: id,
      pageId: parsed.data.pageId,
    })

    return NextResponse.json({
      item: {
        id: updated.id,
        pageId: updated.pageId,
        pageName: updated.pageName,
        instagramUserId: updated.instagramUserId,
        status: updated.status,
        lastError: updated.lastError,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo seleccionar la pagina.' },
      { status: 400 },
    )
  }
}
