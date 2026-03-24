import { prisma } from '@/lib/prisma'
import { fetchExternalProjectByIdOrSlug, normalizeExternalProjectMedia } from '@/lib/external-projects'
import { resolveProjectRecord } from '@/lib/project-resolution'

type SyncedMediaItem = {
  id: string
  fileName: string
  url: string
  mimeType: string
  type: 'image' | 'video'
  sizeBytes: number
  createdAt: Date
  updatedAt: Date
  projectId: string
  uploadedById: string | null
}

export async function syncProjectMedia(projectIdOrSlug: string): Promise<{
  project: { id: string; name: string; color: string }
  items: SyncedMediaItem[]
}> {
  const project = await resolveProjectRecord(projectIdOrSlug)
  if (!project) {
    throw new Error('PROJECT_NOT_FOUND')
  }

  const externalProject = await fetchExternalProjectByIdOrSlug(projectIdOrSlug)
  const normalizedMedia = externalProject ? normalizeExternalProjectMedia(externalProject) : []

  for (const item of normalizedMedia) {
    await prisma.mediaAsset.upsert({
      where: { id: item.id },
      update: {
        fileName: item.fileName,
        url: item.url,
        mimeType: item.mimeType,
        type: item.type,
        sizeBytes: item.sizeBytes,
        projectId: project.id,
      },
      create: {
        id: item.id,
        fileName: item.fileName,
        url: item.url,
        mimeType: item.mimeType,
        type: item.type,
        sizeBytes: item.sizeBytes,
        projectId: project.id,
        uploadedById: null,
      },
    })
  }

  const items = await prisma.mediaAsset.findMany({
    where: { projectId: project.id },
    orderBy: [{ createdAt: 'asc' }, { fileName: 'asc' }],
  })

  return {
    project: {
      id: project.id,
      name: project.name,
      color: project.color,
    },
    items,
  }
}
