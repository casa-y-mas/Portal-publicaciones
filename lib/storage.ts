import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

export type StorageDriver = 'local' | 's3_mock'

export interface UploadResult {
  key: string
  url: string
  mimeType: string
  sizeBytes: number
  fileName: string
  driver: StorageDriver
  bucket?: string
}

const defaultLocalPublicDir = path.join(process.cwd(), 'public', 'uploads')
const defaultMockBucketDir = path.join(process.cwd(), '.mock-s3')

function getStorageDriver(): StorageDriver {
  return process.env.STORAGE_DRIVER === 's3_mock' ? 's3_mock' : 'local'
}

function safeExtension(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  if (!ext) return ''
  return ext.replace(/[^a-z0-9.]/g, '')
}

function buildObjectKey(fileName: string): string {
  const date = new Date()
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const ext = safeExtension(fileName)
  return `${year}/${month}/${randomUUID()}${ext}`
}

export async function uploadFileToStorage(file: File): Promise<UploadResult> {
  const bytes = Buffer.from(await file.arrayBuffer())
  const key = buildObjectKey(file.name)
  const driver = getStorageDriver()

  if (driver === 's3_mock') {
    const bucket = process.env.STORAGE_MOCK_BUCKET || 'media-dev-bucket'
    const baseDir = process.env.STORAGE_MOCK_DIR || defaultMockBucketDir
    const fullPath = path.join(baseDir, bucket, key)
    await mkdir(path.dirname(fullPath), { recursive: true })
    await writeFile(fullPath, bytes)

    return {
      key,
      url: `https://s3.mock.local/${bucket}/${key}`,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: bytes.byteLength,
      fileName: file.name,
      driver,
      bucket,
    }
  }

  const localDir = process.env.STORAGE_LOCAL_DIR || defaultLocalPublicDir
  const fullPath = path.join(localDir, key)
  await mkdir(path.dirname(fullPath), { recursive: true })
  await writeFile(fullPath, bytes)

  return {
    key,
    url: `/uploads/${key}`,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: bytes.byteLength,
    fileName: file.name,
    driver,
  }
}
