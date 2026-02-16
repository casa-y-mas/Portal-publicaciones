import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { uploadFileToStorage } from '@/lib/storage'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const maybeFile = formData.get('file')

  if (!(maybeFile instanceof File)) {
    return NextResponse.json({ message: 'Missing file field' }, { status: 400 })
  }

  if (maybeFile.size <= 0) {
    return NextResponse.json({ message: 'Empty file' }, { status: 400 })
  }

  const maxUploadSizeBytes = Number(process.env.MAX_UPLOAD_SIZE_BYTES || 25 * 1024 * 1024)
  if (maybeFile.size > maxUploadSizeBytes) {
    return NextResponse.json({ message: `File too large (max ${maxUploadSizeBytes} bytes)` }, { status: 413 })
  }

  const result = await uploadFileToStorage(maybeFile)
  return NextResponse.json(result, { status: 201 })
}
