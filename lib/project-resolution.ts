import { prisma } from '@/lib/prisma'
import { fetchExternalProjectByIdOrSlug, normalizeExternalProject } from '@/lib/external-projects'

type LocalProjectRecord = {
  id: string
  name: string
  color: string
  description: string | null
}

function selectLocalProject(project: LocalProjectRecord | null) {
  if (!project) return null
  return {
    id: project.id,
    name: project.name,
    color: project.color,
    description: project.description,
  }
}

export async function resolveProjectRecord(projectIdOrSlug: string): Promise<LocalProjectRecord | null> {
  const projectKey = projectIdOrSlug.trim()
  if (!projectKey) return null

  const localById = await prisma.project.findUnique({
    where: { id: projectKey },
    select: { id: true, name: true, color: true, description: true },
  })

  try {
    const externalProject = await fetchExternalProjectByIdOrSlug(projectKey)
    if (!externalProject) {
      return selectLocalProject(localById)
    }

    const normalized = normalizeExternalProject(externalProject)
    const existingByExternalId =
      normalized.id === projectKey
        ? localById
        : await prisma.project.findUnique({
            where: { id: normalized.id },
            select: { id: true, name: true, color: true, description: true },
          })

    if (existingByExternalId) {
      return prisma.project.update({
        where: { id: existingByExternalId.id },
        data: {
          name: normalized.name,
          color: normalized.color,
          description: normalized.description,
        },
        select: { id: true, name: true, color: true, description: true },
      })
    }

    const existingByName = await prisma.project.findUnique({
      where: { name: normalized.name },
      select: { id: true, name: true, color: true, description: true },
    })

    if (existingByName) {
      return prisma.project.update({
        where: { id: existingByName.id },
        data: {
          color: normalized.color,
          description: normalized.description,
        },
        select: { id: true, name: true, color: true, description: true },
      })
    }

    return prisma.project.create({
      data: {
        id: normalized.id,
        name: normalized.name,
        color: normalized.color,
        description: normalized.description,
      },
      select: { id: true, name: true, color: true, description: true },
    })
  } catch {
    return selectLocalProject(localById)
  }
}
