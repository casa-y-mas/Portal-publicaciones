export type CampaignBlueprintKey = 'lanzamiento' | 'open_house' | 'ultimo_empuje'

export interface CampaignBlueprintStep {
  dayOffset: number
  hour: number
  minute: number
  contentType: 'post' | 'reel' | 'story' | 'carousel'
  title: string
  caption: string
}

export interface CampaignBlueprint {
  key: CampaignBlueprintKey
  name: string
  description: string
  recommendedPlatforms: string[]
  steps: CampaignBlueprintStep[]
}

export const campaignBlueprints: CampaignBlueprint[] = [
  {
    key: 'lanzamiento',
    name: 'Lanzamiento inmobiliario',
    description: 'Secuencia para presentar un proyecto nuevo, generar interes y abrir conversaciones comerciales.',
    recommendedPlatforms: ['Instagram', 'Facebook'],
    steps: [
      {
        dayOffset: 0,
        hour: 10,
        minute: 0,
        contentType: 'reel',
        title: 'Teaser de lanzamiento',
        caption: 'Presenta el proyecto con un teaser visual y una promesa clara de valor para captar atencion.',
      },
      {
        dayOffset: 1,
        hour: 18,
        minute: 30,
        contentType: 'carousel',
        title: 'Atributos del proyecto',
        caption: 'Destaca ubicacion, amenidades, diseno y valor de inversion con un carrusel comercial.',
      },
      {
        dayOffset: 3,
        hour: 11,
        minute: 15,
        contentType: 'post',
        title: 'Llamado a visita',
        caption: 'Invita a agendar recorrido, recibir brochure o contactar por WhatsApp con urgencia comercial.',
      },
    ],
  },
  {
    key: 'open_house',
    name: 'Open house',
    description: 'Campana de asistencia para visitas guiadas, recordatorios y cierre de asistencia.',
    recommendedPlatforms: ['Instagram', 'Facebook', 'TikTok'],
    steps: [
      {
        dayOffset: 0,
        hour: 9,
        minute: 0,
        contentType: 'story',
        title: 'Anuncio de open house',
        caption: 'Comunica fecha, horario y propuesta de valor del evento para activar reservas.',
      },
      {
        dayOffset: 1,
        hour: 19,
        minute: 0,
        contentType: 'reel',
        title: 'Recorrido anticipado',
        caption: 'Muestra espacios clave del inmueble para aumentar intencion de visita.',
      },
      {
        dayOffset: 2,
        hour: 8,
        minute: 30,
        contentType: 'story',
        title: 'Recordatorio de asistencia',
        caption: 'Refuerza la cita con CTA directo y mensaje de cupos limitados.',
      },
      {
        dayOffset: 2,
        hour: 17,
        minute: 45,
        contentType: 'post',
        title: 'Cierre del evento',
        caption: 'Recoge leads tardios y canaliza consultas para quienes no asistieron.',
      },
    ],
  },
  {
    key: 'ultimo_empuje',
    name: 'Ultimo empuje comercial',
    description: 'Secuencia corta para mover unidades rezagadas con sentido de urgencia.',
    recommendedPlatforms: ['Instagram', 'Facebook', 'LinkedIn'],
    steps: [
      {
        dayOffset: 0,
        hour: 12,
        minute: 0,
        contentType: 'post',
        title: 'Disponibilidad limitada',
        caption: 'Activa urgencia con foco en ultimas unidades o condiciones especiales por tiempo limitado.',
      },
      {
        dayOffset: 1,
        hour: 18,
        minute: 15,
        contentType: 'carousel',
        title: 'Beneficios finales',
        caption: 'Resume razones concretas para cerrar la decision hoy: ubicacion, financiamiento y plusvalia.',
      },
      {
        dayOffset: 2,
        hour: 10,
        minute: 30,
        contentType: 'story',
        title: 'Ultimo llamado',
        caption: 'Empuja el cierre con mensaje directo, escasez y CTA a asesor comercial.',
      },
    ],
  },
]

export function getCampaignBlueprint(key: string) {
  return campaignBlueprints.find((item) => item.key === key)
}
