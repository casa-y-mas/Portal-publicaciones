export type Platform =
  | 'Instagram'
  | 'Facebook'
  | 'TikTok'
  | 'YouTube Shorts'
  | 'X'
  | 'LinkedIn'

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
const daysFromNow = (days: number, hour: number, minute = 0) => {
  const date = new Date(now)
  date.setDate(date.getDate() + days)
  date.setHours(hour, minute, 0, 0)
  return date
}

export const projects = [
  {
    id: '1',
    name: 'Residencial Aurora',
    color: '#3B82F6',
    location: 'Santo Domingo',
    status: 'active',
    units: 240,
    description: 'Luxury residential complex with social areas and family amenities.',
  },
  {
    id: '2',
    name: 'Condominio Miraflores',
    color: '#10B981',
    location: 'Santiago',
    status: 'active',
    units: 130,
    description: 'Modern condominium focused on young families and investors.',
  },
  {
    id: '3',
    name: 'Torres del Sol',
    color: '#F97316',
    location: 'Santo Domingo Este',
    status: 'active',
    units: 360,
    description: 'Mixed project with commercial floors and premium apartments.',
  },
  {
    id: '4',
    name: 'Vista Horizonte',
    color: '#8B5CF6',
    location: 'Punta Cana',
    status: 'planning',
    units: 98,
    description: 'Beachside development currently in pre-launch phase.',
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
  {
    id: '1',
    name: 'Maria Garcia',
    email: 'maria@inmosocial.com',
    role: 'editor',
    status: 'active',
    avatar: 'MG',
  },
  {
    id: '2',
    name: 'Juan Martinez',
    email: 'juan@inmosocial.com',
    role: 'editor',
    status: 'active',
    avatar: 'JM',
  },
  {
    id: '3',
    name: 'Carlos Lopez',
    email: 'carlos@inmosocial.com',
    role: 'supervisor',
    status: 'active',
    avatar: 'CL',
  },
  {
    id: '4',
    name: 'Sofia Rodriguez',
    email: 'sofia@inmosocial.com',
    role: 'editor',
    status: 'active',
    avatar: 'SR',
  },
  {
    id: '5',
    name: 'Andrea Lopez',
    email: 'andrea@inmosocial.com',
    role: 'viewer',
    status: 'inactive',
    avatar: 'AL',
  },
  {
    id: '6',
    name: 'Admin User',
    email: 'admin@inmosocial.com',
    role: 'admin',
    status: 'active',
    avatar: 'AD',
  },
]

export const socialAccounts = [
  {
    id: '1',
    platform: 'Instagram',
    username: '@residencialaurora',
    type: 'Business',
    status: 'connected',
    expiresAt: '2026-04-15',
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
    expiresAt: '2026-06-20',
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
    expiresAt: '2026-02-20',
    oauthConnected: true,
    pageName: 'Torres del Sol',
    linkedInstagram: '@torresdelsolrd',
  },
]

export const mediaLibrary = [
  {
    id: '1',
    filename: 'video-torres-01.mp4',
    type: 'video',
    duration: '00:45',
    size: '15 MB',
    resolution: '1080x1920',
    thumbnail: 'Reel',
    project: 'Torres del Sol',
    category: 'Tour',
    tags: ['reel', 'lanzamiento'],
    uploadedBy: 'Maria Garcia',
    uploadedAt: daysFromNow(-5, 11),
  },
  {
    id: '2',
    filename: 'foto-aurora-fachada.jpg',
    type: 'image',
    duration: null,
    size: '4.2 MB',
    resolution: '2160x2160',
    thumbnail: 'Imagen',
    project: 'Residencial Aurora',
    category: 'Arquitectura',
    tags: ['fachada', 'branding'],
    uploadedBy: 'Juan Martinez',
    uploadedAt: daysFromNow(-8, 9),
  },
  {
    id: '3',
    filename: 'miraflores-tour.mp4',
    type: 'video',
    duration: '02:15',
    size: '48 MB',
    resolution: '1080x1920',
    thumbnail: 'Tour',
    project: 'Condominio Miraflores',
    category: 'Tour',
    tags: ['amenidades', 'visita'],
    uploadedBy: 'Sofia Rodriguez',
    uploadedAt: daysFromNow(-3, 14),
  },
  {
    id: '4',
    filename: 'carousel-sala-01.jpg',
    type: 'image',
    duration: null,
    size: '3.1 MB',
    resolution: '1080x1080',
    thumbnail: 'Carrusel',
    project: 'Torres del Sol',
    category: 'Interiores',
    tags: ['lujo', 'carrusel'],
    uploadedBy: 'Maria Garcia',
    uploadedAt: daysFromNow(-2, 10),
  },
]

export const sequenceGroups = [
  {
    id: 'seq-1',
    name: '10 reels - Torres del Sol',
    project: 'Torres del Sol',
    mode: 'interval',
    intervalValue: 1,
    intervalUnit: 'day',
    totalItems: 10,
    startAt: daysFromNow(1, 9),
  },
  {
    id: 'seq-2',
    name: 'Open house launch week',
    project: 'Residencial Aurora',
    mode: 'fixed-dates',
    intervalValue: null,
    intervalUnit: null,
    totalItems: 3,
    startAt: daysFromNow(2, 9),
  },
]

export const scheduledPosts = [
  {
    id: '1',
    title: 'Lanzamiento Torres del Sol',
    platforms: ['Instagram', 'Facebook'] as Platform[],
    contentType: 'reel',
    publishAt: daysFromNow(1, 9),
    status: 'scheduled' as PostStatus,
    creator: 'Maria Garcia',
    approver: 'Carlos Lopez',
    project: 'Torres del Sol',
    caption: 'Conoce nuestro nuevo proyecto residencial en video.',
    hashtags: '#inmobiliaria #torresdelsol #hogar',
    thumbnail: 'Video',
    sequenceGroupId: 'seq-1',
    sequenceOrder: 1,
    recurrence: {
      enabled: true,
      type: 'weekly',
      endType: 'date',
      endDate: '2026-04-30',
    } as RecurrenceData,
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
    title: 'Promocion fin de semana',
    platforms: ['Facebook'] as Platform[],
    contentType: 'carousel',
    publishAt: daysFromNow(3, 11),
    status: 'approved' as PostStatus,
    creator: 'Andrea Lopez',
    approver: 'Carlos Lopez',
    project: 'Residencial Aurora',
    caption: 'Oferta de cierre con bono por reserva online.',
    hashtags: '#oferta #residencialaurora',
    thumbnail: 'Carrusel',
    recurrence: {
      enabled: true,
      type: 'weekday',
      endType: 'never',
    } as RecurrenceData,
  },
  {
    id: '4',
    title: 'Story apertura de sala',
    platforms: ['Instagram'] as Platform[],
    contentType: 'story',
    publishAt: daysFromNow(0, 18),
    status: 'publishing' as PostStatus,
    creator: 'Sofia Rodriguez',
    approver: 'Carlos Lopez',
    project: 'Torres del Sol',
    caption: 'Estamos en vivo para resolver tus dudas.',
    hashtags: '#story #openhouse',
    thumbnail: 'Story',
  },
  {
    id: '5',
    title: 'Testimonios clientes',
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
    caption: 'Contenido fallido por token expirado.',
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
    caption: 'Espacios interiores con luz natural.',
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
    caption: 'Evento cancelado por cambio de agenda comercial.',
    hashtags: '#evento #actualizacion',
    thumbnail: 'Evento',
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
    submittedAt: daysFromNow(0, 8),
  },
  {
    id: '2',
    postId: '7',
    title: 'Galeria interior torre A',
    creator: 'Andrea Lopez',
    caption: 'Espacios interiores con luz natural.',
    platforms: ['Instagram'],
    proposedDate: daysFromNow(4, 12),
    status: 'pending',
    submittedAt: daysFromNow(0, 9),
  },
  {
    id: '3',
    postId: '5',
    title: 'Testimonios clientes',
    creator: 'Juan Martinez',
    caption: 'Familias que ya dieron el paso cuentan su experiencia.',
    platforms: ['Facebook', 'Instagram'],
    proposedDate: daysFromNow(-1, 15),
    status: 'approved',
    submittedAt: daysFromNow(-2, 11),
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
    requestPayload: { caption: 'Testimonios...', mediaId: 'asset_15' },
    responsePayload: { postId: 'ig_123456', timestamp: '2026-02-09T15:00:00Z' },
  },
  {
    id: '2',
    postId: '6',
    platform: 'Instagram',
    statusCode: 401,
    result: 'error',
    timestamp: daysFromNow(-2, 10, 30),
    requestPayload: { caption: 'Contenido...', mediaId: 'asset_22' },
    responsePayload: { error: 'Unauthorized', message: 'Token expired' },
    errorMessage: 'Instagram token expired. Reconnect account to continue.',
  },
  {
    id: '3',
    postId: '1',
    platform: 'Facebook',
    statusCode: 202,
    result: 'queued',
    timestamp: daysFromNow(1, 9),
    requestPayload: { caption: 'Lanzamiento...', mediaId: 'asset_03' },
    responsePayload: { queueId: 'job_9921' },
  },
]

export const auditTrail = [
  {
    id: 'a1',
    user: 'Carlos Lopez',
    action: 'approval',
    target: 'Post 2',
    details: 'Approved and moved to scheduled.',
    at: daysFromNow(0, 10),
  },
  {
    id: 'a2',
    user: 'Maria Garcia',
    action: 'edit_caption',
    target: 'Post 1',
    details: 'Caption updated before publication.',
    at: daysFromNow(-1, 16),
  },
  {
    id: 'a3',
    user: 'Sofia Rodriguez',
    action: 'reschedule',
    target: 'Post 8',
    details: 'Moved publication to next week and later cancelled.',
    at: daysFromNow(-1, 18),
  },
]

export const notifications = [
  {
    id: 'n1',
    type: 'failed',
    title: 'Publicacion fallida en Instagram',
    message: 'Post 6 fallo por token expirado.',
    createdAt: daysFromNow(-1, 11),
    read: false,
  },
  {
    id: 'n2',
    type: 'token-expired',
    title: 'Token por expirar',
    message: 'Cuenta @torresdelsolrd expira en 10 dias.',
    createdAt: daysFromNow(-1, 9),
    read: false,
  },
  {
    id: 'n3',
    type: 'approval',
    title: 'Pendiente de aprobacion',
    message: 'Hay 2 publicaciones esperando revision.',
    createdAt: daysFromNow(0, 8),
    read: true,
  },
  {
    id: 'n4',
    type: 'success',
    title: 'Publicacion exitosa',
    message: 'Post 5 fue publicado en Facebook e Instagram.',
    createdAt: daysFromNow(-1, 15),
    read: true,
  },
]

export const reportSummary = {
  weekPosts: 18,
  monthPosts: 72,
  failureRate: 6.3,
  byNetwork: [
    { network: 'Instagram', total: 38 },
    { network: 'Facebook', total: 24 },
    { network: 'TikTok', total: 6 },
    { network: 'YouTube Shorts', total: 4 },
  ],
  byProject: [
    { project: 'Torres del Sol', total: 29 },
    { project: 'Residencial Aurora', total: 25 },
    { project: 'Condominio Miraflores', total: 18 },
  ],
}

export const publicationRules = [
  {
    id: 'r1',
    name: 'No publicar domingos',
    appliesTo: 'all',
    enabled: true,
  },
  {
    id: 'r2',
    name: 'Requiere aprobacion para reels',
    appliesTo: 'reel',
    enabled: true,
  },
  {
    id: 'r3',
    name: 'Max 3 publicaciones por dia y proyecto',
    appliesTo: 'project',
    enabled: true,
  },
]

export const dashboardStats = {
  scheduledToday: 4,
  scheduledThisWeek: 12,
  pendingApproval: 2,
  failedPosts: 1,
  publishedThisMonth: 31,
  engagementRate: 13.8,
}

export const publishedByDay = [
  { day: 'Mon', posts: 4 },
  { day: 'Tue', posts: 6 },
  { day: 'Wed', posts: 3 },
  { day: 'Thu', posts: 5 },
  { day: 'Fri', posts: 7 },
  { day: 'Sat', posts: 3 },
  { day: 'Sun', posts: 1 },
]
