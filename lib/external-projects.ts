const EXTERNAL_PROJECTS_BASE_URL = 'https://api-portal.casaymas.online/public/proyectos'

interface ExternalOwner {
  id?: number
  nombre?: string
  email?: string
  telefono?: string
}

interface ExternalDistrict {
  id?: number
  nombre?: string
  provincia?: string
  departamento?: string
}

interface ExternalLocation {
  distrito?: ExternalDistrict
  urbanizacion?: string
  calle?: string
  numero?: string
}

interface ExternalMediaImage {
  indice?: number
  imagen?: string
  titulo?: string
  is_portada?: boolean
}

interface ExternalMediaVideo {
  indice?: number
  video?: string
}

interface ExternalUnit {
  slug?: string
  titulo?: string
  habitaciones?: number
  baños?: number
  area_construida?: string
  area_total?: string
  precio_soles?: string
  precio_dolares?: string
  subtipo_inmueble?: string
  portada?: string
}

export interface ExternalProject {
  id?: number
  slug?: string
  titulo?: string
  descripcion?: string
  fecha_actualizacion?: string
  tipo_operacion?: string
  estado?: string
  num_visitas?: number
  num_favoritos?: number
  area_total?: string
  precio_soles?: string
  precio_dolares?: string
  portada?: string
  is_proyecto?: boolean
  is_unidad?: boolean
  dueño?: ExternalOwner
  ubicacion?: ExternalLocation
  caracteristicas?: string[]
  imagenes?: ExternalMediaImage[]
  videos?: ExternalMediaVideo[]
  planos?: Array<{ imagen?: string; plano?: string; url?: string }>
  unidades?: ExternalUnit[]
}

export interface NormalizedProjectItem {
  id: string
  slug: string
  name: string
  tipoOperacion: string
  color: string
  description: string | null
  createdAt: string
  updatedAt: string
  estado: string
  dueñoNombre: string | null
  ubicacionTexto: string | null
  portada: string | null
  numVisitas: number
  numFavoritos: number
  areaTotalM2: string | null
  precioSoles: string | null
  precioDolares: string | null
  _count: {
    posts: number
    mediaAssets: number
    socialAccounts: number
  }
}

export interface NormalizedProjectMediaItem {
  id: string
  fileName: string
  url: string
  mimeType: string
  type: 'image' | 'video'
  sizeBytes: number
  createdAt: string
  uploadedBy: { id: string; name: string; email: string } | null
}

function getProjectColor(seed: string): string {
  const palette = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EAB308', '#EF4444', '#06B6D4', '#84CC16']
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return palette[Math.abs(hash) % palette.length]
}

export function normalizeExternalProject(project: ExternalProject): NormalizedProjectItem {
  const baseId = project.id != null ? String(project.id) : project.slug ?? crypto.randomUUID()
  const imagesCount = Array.isArray(project.imagenes) ? project.imagenes.length : 0
  const videosCount = Array.isArray(project.videos) ? project.videos.length : 0
  const planosCount = Array.isArray(project.planos) ? project.planos.length : 0
  const unitsCount = Array.isArray(project.unidades) ? project.unidades.length : 0
  const ownerName = project.dueño?.nombre?.trim()
  const districtName = project.ubicacion?.distrito?.nombre?.trim()

  const portadaFromImages = (project.imagenes ?? []).find((img) => img && img.is_portada)?.imagen?.trim()
  const portada = (project.portada ?? portadaFromImages ?? '').trim() || null

  const tipoOperacion = (project.tipo_operacion?.trim() || (project.is_proyecto ? 'Proyecto' : 'Inmueble')) as string
  const estado = (project.estado?.trim() || 'Publicado') as string

  const numVisitas = typeof project.num_visitas === 'number' ? project.num_visitas : Number(project.num_visitas ?? 0) || 0
  const numFavoritos = typeof project.num_favoritos === 'number' ? project.num_favoritos : Number(project.num_favoritos ?? 0) || 0

  const areaTotalM2 = (() => {
    if (typeof project.area_total !== 'string') return null
    const raw = project.area_total.trim()
    if (!raw) return null
    const num = Number(raw)
    if (Number.isNaN(num)) return raw
    if (num <= 0) return '0'
    return raw
  })()
  const precioSoles = typeof project.precio_soles === 'string' && project.precio_soles.trim().length > 0 ? project.precio_soles.trim() : null
  const precioDolares =
    typeof project.precio_dolares === 'string' && project.precio_dolares.trim().length > 0 ? project.precio_dolares.trim() : null

  const ubicacionTextoFinal =
    [project.ubicacion?.distrito?.nombre?.trim(), project.ubicacion?.urbanizacion?.trim()]
      .filter((p): p is string => Boolean(p))
      .join(' - ') || null

  const descriptionParts = [project.descripcion?.trim(), ownerName ? `Dueno: ${ownerName}` : null, districtName ? `Distrito: ${districtName}` : null]
    .filter((part): part is string => Boolean(part))
    .join('\n')

  return {
    id: baseId,
    slug: project.slug?.trim() || String(project.id ?? baseId),
    name: project.titulo?.trim() || project.slug?.trim() || `Proyecto ${baseId}`,
    tipoOperacion,
    color: getProjectColor(baseId),
    description: descriptionParts || null,
    createdAt: project.fecha_actualizacion ?? new Date().toISOString(),
    updatedAt: project.fecha_actualizacion ?? new Date().toISOString(),
    estado,
    dueñoNombre: ownerName ?? null,
    ubicacionTexto: ubicacionTextoFinal,
    portada,
    numVisitas,
    numFavoritos,
    areaTotalM2,
    precioSoles,
    precioDolares,
    _count: {
      posts: unitsCount,
      mediaAssets: imagesCount + videosCount + planosCount,
      socialAccounts: 0,
    },
  }
}

function inferMimeType(url: string, type: 'image' | 'video'): string {
  const lower = url.toLowerCase()
  if (type === 'video') {
    if (lower.endsWith('.webm')) return 'video/webm'
    if (lower.endsWith('.mov')) return 'video/quicktime'
    return 'video/mp4'
  }
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

export async function fetchExternalProjects(): Promise<ExternalProject[]> {
  const response = await fetch(`${EXTERNAL_PROJECTS_BASE_URL}/`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    throw new Error(`No se pudo consultar API externa de proyectos (${response.status}).`)
  }

  const json: unknown = await response.json()
  if (!Array.isArray(json)) return []
  return json as ExternalProject[]
}

export async function fetchExternalProjectByIdOrSlug(idOrSlug: string): Promise<ExternalProject | null> {
  const isNumericId = /^\d+$/.test(idOrSlug)
  const endpoint = isNumericId ? `${EXTERNAL_PROJECTS_BASE_URL}/id/${idOrSlug}/` : `${EXTERNAL_PROJECTS_BASE_URL}/${idOrSlug}/`
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  })

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`No se pudo consultar el proyecto (${response.status}).`)
  }

  const json: unknown = await response.json()
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null
  return json as ExternalProject
}

export async function getNormalizedProjects(): Promise<NormalizedProjectItem[]> {
  const items = await fetchExternalProjects()
  return items.map(normalizeExternalProject).sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export function normalizeExternalProjectMedia(project: ExternalProject): NormalizedProjectMediaItem[] {
  const updatedAt = project.fecha_actualizacion ?? new Date().toISOString()
  const owner = project.dueño
  const uploadedBy =
    owner && owner.id != null
      ? {
          id: String(owner.id),
          name: owner.nombre?.trim() || 'Sin autor',
          email: owner.email?.trim() || '',
        }
      : null

  const imageItems = (project.imagenes ?? [])
    .filter((image) => typeof image.imagen === 'string' && image.imagen.trim().length > 0)
    .map((image, index) => {
      const url = image.imagen!.trim()
      return {
        id: `${project.slug ?? project.id ?? 'project'}-img-${image.indice ?? index}`,
        fileName: url.split('/').pop() ?? `imagen-${index + 1}`,
        url,
        mimeType: inferMimeType(url, 'image'),
        type: 'image' as const,
        sizeBytes: 0,
        createdAt: updatedAt,
        uploadedBy,
      }
    })

  const videoItems = (project.videos ?? [])
    .filter((video) => typeof video.video === 'string' && video.video.trim().length > 0)
    .map((video, index) => {
      const url = video.video!.trim()
      return {
        id: `${project.slug ?? project.id ?? 'project'}-video-${video.indice ?? index}`,
        fileName: url.split('/').pop() ?? `video-${index + 1}`,
        url,
        mimeType: inferMimeType(url, 'video'),
        type: 'video' as const,
        sizeBytes: 0,
        createdAt: updatedAt,
        uploadedBy,
      }
    })

  return [...imageItems, ...videoItems]
}
