export type Platform = 'Instagram' | 'Facebook' | 'TikTok' | 'YouTube Shorts' | 'X' | 'LinkedIn'

export type PostStatus =
  | 'draft'
  | 'pending-approval'
  | 'approved'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'cancelled'

export interface RecurrenceData {
  enabled: boolean
  type?: 'hourly' | 'daily' | 'weekday' | 'weekend' | 'weekly' | 'custom' | null
  endType?: 'never' | 'date'
  endDate?: string
  customFrequency?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  customInterval?: number
  customWeekDays?: number[]
  customMonthDay?: number
  customYearDate?: string
}

const now = new Date()

const withTime = (date: Date, hour: number, minute = 0) => {
  const value = new Date(date)
  value.setHours(hour, minute, 0, 0)
  return value
}

const daysFromNow = (days: number, hour: number, minute = 0) => {
  const value = new Date(now)
  value.setDate(value.getDate() + days)
  return withTime(value, hour, minute)
}

const formatDate = (date: Date) => date.toISOString().slice(0, 10)

export const projects = [
  {
    id: '1',
    name: 'Residencial Aurora',
    color: '#3B82F6',
    location: 'Santo Domingo',
    status: 'active',
    units: 240,
    description: 'Proyecto residencial premium con amenidades familiares y club social.',
  },
  {
    id: '2',
    name: 'Condominio Miraflores',
    color: '#10B981',
    location: 'Santiago',
    status: 'active',
    units: 130,
    description: 'Condominio urbano orientado a familias jovenes e inversionistas.',
  },
  {
    id: '3',
    name: 'Torres del Sol',
    color: '#F97316',
    location: 'Santo Domingo Este',
    status: 'active',
    units: 360,
    description: 'Complejo mixto con torres residenciales y zona comercial integrada.',
  },
  {
    id: '4',
    name: 'Vista Horizonte',
    color: '#8B5CF6',
    location: 'Punta Cana',
    status: 'planning',
    units: 98,
    description: 'Desarrollo frente al mar en fase de pre-lanzamiento.',
  },
  {
    id: '5',
    name: 'Parque Central Norte',
    color: '#EAB308',
    location: 'Santiago Norte',
    status: 'active',
    units: 180,
    description: 'Proyecto de ticket medio con enfoque en primera vivienda.',
  },
]

export const roles = [
  {
    id: 'admin',
    name: 'Administrador',
    permissions: [
      'upload_media',
      'create_schedule',
      'edit_schedule',
      'cancel_schedule',
      'approve_reject',
      'manual_publish',
      'connect_social',
      'view_logs',
      'manage_users',
      'manage_projects',
    ],
  },
  {
    id: 'supervisor',
    name: 'Supervisor / Aprobador',
    permissions: [
      'upload_media',
      'create_schedule',
      'edit_schedule',
      'cancel_schedule',
      'approve_reject',
      'manual_publish',
      'view_logs',
    ],
  },
  {
    id: 'editor',
    name: 'Editor / Community Manager',
    permissions: ['upload_media', 'create_schedule', 'edit_schedule'],
  },
  {
    id: 'viewer',
    name: 'Solo lectura',
    permissions: ['view_dashboard', 'view_reports'],
  },
]

export const users = [
  { id: '1', name: 'Maria Garcia', email: 'maria@inmosocial.com', role: 'editor', status: 'active', avatar: 'MG' },
  { id: '2', name: 'Juan Martinez', email: 'juan@inmosocial.com', role: 'editor', status: 'active', avatar: 'JM' },
  { id: '3', name: 'Carlos Lopez', email: 'carlos@inmosocial.com', role: 'supervisor', status: 'active', avatar: 'CL' },
  { id: '4', name: 'Sofia Rodriguez', email: 'sofia@inmosocial.com', role: 'editor', status: 'active', avatar: 'SR' },
  { id: '5', name: 'Andrea Lopez', email: 'andrea@inmosocial.com', role: 'editor', status: 'active', avatar: 'AL' },
  { id: '6', name: 'Admin User', email: 'admin@inmosocial.com', role: 'admin', status: 'active', avatar: 'AD' },
]

export const socialAccounts = [
  {
    id: '1',
    platform: 'Instagram',
    username: '@residencialaurora',
    type: 'Business',
    status: 'connected',
    expiresAt: formatDate(daysFromNow(42, 0)),
    oauthConnected: true,
    pageName: 'Residencial Aurora',
    linkedInstagram: '@residencialaurora',
  },
  {
    id: '2',
    platform: 'Facebook',
    username: 'Condominio Miraflores',
    type: 'Page',
    status: 'connected',
    expiresAt: formatDate(daysFromNow(57, 0)),
    oauthConnected: true,
    pageName: 'Condominio Miraflores',
    linkedInstagram: '@mirafloresprop',
  },
  {
    id: '3',
    platform: 'Instagram',
    username: '@torresdelsolrd',
    type: 'Creator',
    status: 'token-expiring',
    expiresAt: formatDate(daysFromNow(8, 0)),
    oauthConnected: true,
    pageName: 'Torres del Sol',
    linkedInstagram: '@torresdelsolrd',
  },
  {
    id: '4',
    platform: 'Facebook',
    username: 'Parque Central Norte',
    type: 'Page',
    status: 'connected',
    expiresAt: formatDate(daysFromNow(26, 0)),
    oauthConnected: true,
    pageName: 'Parque Central Norte',
    linkedInstagram: '@parquecentralnorte',
  },
]

export const mediaLibrary = [
  {
    id: '1',
    filename: 'torres-lanzamiento-reel.mp4',
    type: 'video',
    duration: '00:42',
    size: '15 MB',
    resolution: '1080x1920',
    thumbnail: 'Reel',
    project: 'Torres del Sol',
    category: 'Lanzamiento',
    tags: ['reel', 'branding', 'lanzamiento'],
    uploadedBy: 'Maria Garcia',
    uploadedAt: daysFromNow(-12, 10),
  },
  {
    id: '2',
    filename: 'miraflores-tour-amenidades.mp4',
    type: 'video',
    duration: '02:09',
    size: '49 MB',
    resolution: '1080x1920',
    thumbnail: 'Tour',
    project: 'Condominio Miraflores',
    category: 'Tour',
    tags: ['amenidades', 'video-largo'],
    uploadedBy: 'Juan Martinez',
    uploadedAt: daysFromNow(-9, 14),
  },
  {
    id: '3',
    filename: 'aurora-fachada-atardecer.jpg',
    type: 'image',
    duration: null,
    size: '4.5 MB',
    resolution: '2160x2160',
    thumbnail: 'Imagen',
    project: 'Residencial Aurora',
    category: 'Arquitectura',
    tags: ['fachada', 'branding'],
    uploadedBy: 'Sofia Rodriguez',
    uploadedAt: daysFromNow(-7, 17),
  },
  {
    id: '4',
    filename: 'pcn-ubicacion-mapa.jpg',
    type: 'image',
    duration: null,
    size: '2.7 MB',
    resolution: '1920x1080',
    thumbnail: 'Mapa',
    project: 'Parque Central Norte',
    category: 'Ubicacion',
    tags: ['mapa', 'zona'],
    uploadedBy: 'Andrea Lopez',
    uploadedAt: daysFromNow(-5, 11),
  },
  {
    id: '5',
    filename: 'torres-interiores-carrusel-01.jpg',
    type: 'image',
    duration: null,
    size: '3.2 MB',
    resolution: '1080x1080',
    thumbnail: 'Carrusel',
    project: 'Torres del Sol',
    category: 'Interiores',
    tags: ['interiores', 'carrusel'],
    uploadedBy: 'Maria Garcia',
    uploadedAt: daysFromNow(-4, 9),
  },
  {
    id: '6',
    filename: 'vista-horizonte-teaser.mp4',
    type: 'video',
    duration: '00:28',
    size: '11 MB',
    resolution: '1080x1920',
    thumbnail: 'Teaser',
    project: 'Vista Horizonte',
    category: 'Prelanzamiento',
    tags: ['teaser', 'punta-cana'],
    uploadedBy: 'Admin User',
    uploadedAt: daysFromNow(-2, 13),
  },
]

export const sequenceGroups = [
  {
    id: 'seq-1',
    name: 'Serie de lanzamiento - Torres del Sol',
    project: 'Torres del Sol',
    mode: 'interval',
    intervalValue: 1,
    intervalUnit: 'day',
    totalItems: 8,
    startAt: daysFromNow(1, 9),
  },
  {
    id: 'seq-2',
    name: 'Semana de Open House',
    project: 'Residencial Aurora',
    mode: 'fixed-dates',
    intervalValue: null,
    intervalUnit: null,
    totalItems: 4,
    startAt: daysFromNow(3, 10),
  },
]

export const scheduledPosts = [
  {
    id: '1',
    title: 'Lanzamiento oficial Torres del Sol',
    platforms: ['Instagram', 'Facebook'] as Platform[],
    contentType: 'reel',
    publishAt: daysFromNow(1, 9),
    status: 'scheduled' as PostStatus,
    creator: 'Maria Garcia',
    approver: 'Carlos Lopez',
    project: 'Torres del Sol',
    caption: 'Conoce nuestro nuevo proyecto residencial en video.',
    hashtags: '#torresdelsol #inmobiliaria #nuevohogar',
    thumbnail: 'Video',
    sequenceGroupId: 'seq-1',
    sequenceOrder: 1,
    recurrence: { enabled: true, type: 'weekly', endType: 'date', endDate: formatDate(daysFromNow(45, 0)) } as RecurrenceData,
  },
  {
    id: '2',
    title: 'Tour virtual Miraflores',
    platforms: ['Instagram'] as Platform[],
    contentType: 'post',
    publishAt: daysFromNow(2, 14, 30),
    status: 'pending-approval' as PostStatus,
    creator: 'Juan Martinez',
    approver: null,
    project: 'Condominio Miraflores',
    caption: 'Descubre amenidades y espacios ideales para familia.',
    hashtags: '#miraflores #departamentos #inversion',
    thumbnail: 'Post',
  },
  {
    id: '3',
    title: 'Promocion de cierre de mes',
    platforms: ['Facebook', 'Instagram'] as Platform[],
    contentType: 'carousel',
    publishAt: daysFromNow(3, 11),
    status: 'approved' as PostStatus,
    creator: 'Andrea Lopez',
    approver: 'Carlos Lopez',
    project: 'Residencial Aurora',
    caption: 'Bono por reserva online disponible hasta fin de mes.',
    hashtags: '#residencialaurora #promocion',
    thumbnail: 'Carrusel',
    recurrence: { enabled: true, type: 'weekday', endType: 'never' } as RecurrenceData,
  },
  {
    id: '4',
    title: 'Story apertura de sala modelo',
    platforms: ['Instagram'] as Platform[],
    contentType: 'story',
    publishAt: daysFromNow(0, 18),
    status: 'publishing' as PostStatus,
    creator: 'Sofia Rodriguez',
    approver: 'Carlos Lopez',
    project: 'Torres del Sol',
    caption: 'Estamos en vivo para resolver tus dudas.',
    hashtags: '#openhouse #story',
    thumbnail: 'Story',
  },
  {
    id: '5',
    title: 'Testimonios de clientes',
    platforms: ['Facebook', 'Instagram'] as Platform[],
    contentType: 'reel',
    publishAt: daysFromNow(-1, 15),
    status: 'published' as PostStatus,
    creator: 'Juan Martinez',
    approver: 'Carlos Lopez',
    project: 'Residencial Aurora',
    caption: 'Familias que ya dieron el paso cuentan su experiencia.',
    hashtags: '#clientes #testimonios',
    thumbnail: 'Reel',
  },
  {
    id: '6',
    title: 'Post con token vencido',
    platforms: ['Instagram'] as Platform[],
    contentType: 'post',
    publishAt: daysFromNow(-2, 10, 30),
    status: 'failed' as PostStatus,
    creator: 'Maria Garcia',
    approver: 'Carlos Lopez',
    project: 'Condominio Miraflores',
    caption: 'Contenido no publicado por token expirado.',
    hashtags: '#error #token',
    thumbnail: 'Error',
  },
  {
    id: '7',
    title: 'Galeria interior torre A',
    platforms: ['Instagram'] as Platform[],
    contentType: 'carousel',
    publishAt: daysFromNow(4, 12),
    status: 'draft' as PostStatus,
    creator: 'Andrea Lopez',
    approver: null,
    project: 'Torres del Sol',
    caption: 'Espacios interiores con luz natural y acabados premium.',
    hashtags: '#interiorismo #torresdelsol',
    thumbnail: 'Galeria',
  },
  {
    id: '8',
    title: 'Evento de inauguracion',
    platforms: ['Facebook'] as Platform[],
    contentType: 'reel',
    publishAt: daysFromNow(5, 16),
    status: 'cancelled' as PostStatus,
    creator: 'Sofia Rodriguez',
    approver: 'Carlos Lopez',
    project: 'Residencial Aurora',
    caption: 'Evento reprogramado por ajuste de agenda comercial.',
    hashtags: '#evento #actualizacion',
    thumbnail: 'Evento',
  },
  {
    id: '9',
    title: 'Comparativo de metrajes por torre',
    platforms: ['LinkedIn', 'Facebook'] as Platform[],
    contentType: 'post',
    publishAt: daysFromNow(1, 11, 15),
    status: 'scheduled' as PostStatus,
    creator: 'Admin User',
    approver: 'Carlos Lopez',
    project: 'Torres del Sol',
    caption: 'Ficha tecnica comparativa para perfil inversionista.',
    hashtags: '#linkedin #inversion',
    thumbnail: 'Ficha',
  },
  {
    id: '10',
    title: 'Video de avance de obra',
    platforms: ['YouTube Shorts', 'TikTok'] as Platform[],
    contentType: 'reel',
    publishAt: daysFromNow(-3, 13),
    status: 'published' as PostStatus,
    creator: 'Maria Garcia',
    approver: 'Carlos Lopez',
    project: 'Parque Central Norte',
    caption: 'Actualizacion semanal de avance de construccion.',
    hashtags: '#obranueva #avancedeobra',
    thumbnail: 'Short',
  },
  {
    id: '11',
    title: 'Tips de financiamiento hipotecario',
    platforms: ['X', 'LinkedIn'] as Platform[],
    contentType: 'post',
    publishAt: daysFromNow(-4, 9, 45),
    status: 'published' as PostStatus,
    creator: 'Sofia Rodriguez',
    approver: 'Carlos Lopez',
    project: 'Condominio Miraflores',
    caption: 'Recomendaciones para acelerar aprobacion bancaria.',
    hashtags: '#financiamiento #hipoteca',
    thumbnail: 'Tips',
  },
  {
    id: '12',
    title: 'Teaser de Vista Horizonte',
    platforms: ['Instagram', 'TikTok'] as Platform[],
    contentType: 'story',
    publishAt: daysFromNow(6, 19),
    status: 'scheduled' as PostStatus,
    creator: 'Admin User',
    approver: 'Carlos Lopez',
    project: 'Vista Horizonte',
    caption: 'Pre-lanzamiento exclusivo en zona de playa.',
    hashtags: '#puntacana #prelanzamiento',
    thumbnail: 'Teaser',
  },
]

export const approvals = [
  {
    id: '1',
    postId: '2',
    title: 'Tour virtual Miraflores',
    creator: 'Juan Martinez',
    caption: 'Descubre amenidades y espacios ideales para familia.',
    platforms: ['Instagram'],
    proposedDate: daysFromNow(2, 14, 30),
    status: 'pending',
    submittedAt: daysFromNow(0, 8, 15),
  },
  {
    id: '2',
    postId: '7',
    title: 'Galeria interior torre A',
    creator: 'Andrea Lopez',
    caption: 'Espacios interiores con luz natural y acabados premium.',
    platforms: ['Instagram'],
    proposedDate: daysFromNow(4, 12),
    status: 'pending',
    submittedAt: daysFromNow(-1, 18, 10),
  },
  {
    id: '3',
    postId: '11',
    title: 'Tips de financiamiento hipotecario',
    creator: 'Sofia Rodriguez',
    caption: 'Recomendaciones para acelerar aprobacion bancaria.',
    platforms: ['X', 'LinkedIn'],
    proposedDate: daysFromNow(-4, 9, 45),
    status: 'approved',
    submittedAt: daysFromNow(-5, 16, 30),
  },
]

export const logEntries = [
  {
    id: '1',
    postId: '5',
    platform: 'Instagram',
    statusCode: 200,
    result: 'success',
    timestamp: daysFromNow(-1, 15),
    requestPayload: { caption: 'Testimonios de clientes...', mediaId: 'asset_15' },
    responsePayload: { postId: 'ig_843264', timestamp: daysFromNow(-1, 15).toISOString() },
  },
  {
    id: '2',
    postId: '6',
    platform: 'Instagram',
    statusCode: 401,
    result: 'error',
    timestamp: daysFromNow(-2, 10, 30),
    requestPayload: { caption: 'Contenido no publicado...', mediaId: 'asset_22' },
    responsePayload: { error: 'Unauthorized', message: 'Token expired' },
    errorMessage: 'Instagram token expired. Reconnect account to continue.',
  },
  {
    id: '3',
    postId: '10',
    platform: 'YouTube Shorts',
    statusCode: 202,
    result: 'queued',
    timestamp: daysFromNow(-3, 13),
    requestPayload: { caption: 'Video de avance de obra...', mediaId: 'asset_03' },
    responsePayload: { queueId: 'job_9921' },
  },
]

export const auditTrail = [
  {
    id: 'a1',
    user: 'Carlos Lopez',
    action: 'approval',
    target: 'Post 11',
    details: 'Approved and moved to published queue.',
    at: daysFromNow(-4, 8, 30),
  },
  {
    id: 'a2',
    user: 'Maria Garcia',
    action: 'edit_caption',
    target: 'Post 1',
    details: 'Caption updated for CTA and hashtags.',
    at: daysFromNow(-1, 16, 10),
  },
  {
    id: 'a3',
    user: 'Sofia Rodriguez',
    action: 'reschedule',
    target: 'Post 8',
    details: 'Moved publication, then cancelled after campaign change.',
    at: daysFromNow(-1, 18, 20),
  },
  {
    id: 'a4',
    user: 'Admin User',
    action: 'connect_social',
    target: 'Parque Central Norte',
    details: 'Facebook page and Instagram account linked via OAuth.',
    at: daysFromNow(-2, 11, 5),
  },
]

export const notifications = [
  {
    id: 'n1',
    type: 'failed',
    title: 'Publicacion fallida en Instagram',
    message: 'Post 6 fallo por token expirado en @torresdelsolrd.',
    createdAt: daysFromNow(-2, 10, 35),
    read: false,
  },
  {
    id: 'n2',
    type: 'token-expired',
    title: 'Token por expirar',
    message: 'La cuenta @torresdelsolrd vence en 8 dias.',
    createdAt: daysFromNow(-1, 9, 10),
    read: false,
  },
  {
    id: 'n3',
    type: 'approval',
    title: 'Pendientes de aprobacion',
    message: 'Hay 2 publicaciones esperando revision del supervisor.',
    createdAt: daysFromNow(0, 8, 5),
    read: true,
  },
  {
    id: 'n4',
    type: 'success',
    title: 'Publicacion exitosa',
    message: 'Post 5 publicado correctamente en Facebook e Instagram.',
    createdAt: daysFromNow(-1, 15, 2),
    read: true,
  },
]

const postsInLastDays = (days: number) =>
  scheduledPosts.filter((post) => {
    const threshold = daysFromNow(-days, 0)
    return post.publishAt >= threshold && post.publishAt <= now
  })

const reportWindow = postsInLastDays(30)
const weekWindow = postsInLastDays(7)
const publishableStatuses: PostStatus[] = ['scheduled', 'publishing', 'published', 'failed', 'cancelled']
const processedPosts = reportWindow.filter((post) => publishableStatuses.includes(post.status))
const failedPosts = processedPosts.filter((post) => post.status === 'failed').length

const byNetworkMap = new Map<Platform, number>()
const byProjectMap = new Map<string, number>()
for (const post of reportWindow) {
  if (post.status === 'draft') continue
  for (const platform of post.platforms) {
    byNetworkMap.set(platform, (byNetworkMap.get(platform) ?? 0) + 1)
  }
  byProjectMap.set(post.project, (byProjectMap.get(post.project) ?? 0) + 1)
}

export const reportSummary = {
  weekPosts: weekWindow.filter((post) => post.status !== 'draft').length,
  monthPosts: reportWindow.filter((post) => post.status !== 'draft').length,
  failureRate: processedPosts.length === 0 ? 0 : Number(((failedPosts / processedPosts.length) * 100).toFixed(1)),
  byNetwork: Array.from(byNetworkMap.entries())
    .map(([network, total]) => ({ network, total }))
    .sort((a, b) => b.total - a.total),
  byProject: Array.from(byProjectMap.entries())
    .map(([project, total]) => ({ project, total }))
    .sort((a, b) => b.total - a.total),
}

export const publicationRules = [
  { id: 'r1', name: 'No publicar domingos', appliesTo: 'all', enabled: true },
  { id: 'r2', name: 'Requiere aprobacion para reels', appliesTo: 'reel', enabled: true },
  { id: 'r3', name: 'Maximo 3 publicaciones por dia y proyecto', appliesTo: 'project', enabled: true },
]

export const dashboardStats = {
  scheduledToday: scheduledPosts.filter((post) => {
    const sameDay = post.publishAt.toDateString() === now.toDateString()
    return sameDay && (post.status === 'scheduled' || post.status === 'publishing')
  }).length,
  scheduledThisWeek: scheduledPosts.filter((post) => post.publishAt >= now && post.publishAt <= daysFromNow(7, 23, 59)).length,
  pendingApproval: scheduledPosts.filter((post) => post.status === 'pending-approval').length,
  failedPosts: scheduledPosts.filter((post) => post.status === 'failed').length,
  publishedThisMonth: reportWindow.filter((post) => post.status === 'published').length,
  engagementRate: 12.9,
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const publishedMap = new Map<string, number>()
for (let i = 6; i >= 0; i -= 1) {
  const day = daysFromNow(-i, 0)
  publishedMap.set(dayNames[day.getDay()], 0)
}
for (const post of weekWindow) {
  if (post.status !== 'published') continue
  const key = dayNames[post.publishAt.getDay()]
  publishedMap.set(key, (publishedMap.get(key) ?? 0) + 1)
}

export const publishedByDay = Array.from(publishedMap.entries()).map(([day, posts]) => ({ day, posts }))
