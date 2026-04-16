import { NextResponse } from 'next/server'
import { z } from 'zod'

const contextValueSchema = z.union([z.string(), z.number()]).nullable().optional()

const generateSchema = z.object({
  tone: z.string().min(1).optional(),
  objective: z.string().min(1).optional(),
  modoIA: z.string().min(1).optional(),
  objetivoIA: z.string().min(1).optional(),
  projectName: z.string().min(1),
  projectContext: z.union([
    z
      .object({
        tipoOperacion: contextValueSchema,
        estado: contextValueSchema,
        ubicacion: contextValueSchema,
        areaTotalM2: contextValueSchema,
        precioSoles: contextValueSchema,
        precioDolares: contextValueSchema,
        descripcionProyecto: contextValueSchema,
      })
      .nullable(),
    z.string(),
  ]).optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
})

function normalizeContextValue(value: string | number | null | undefined): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

function buildProjectContextLines(
  projectContext:
    | {
        tipoOperacion?: string | number | null
        estado?: string | number | null
        ubicacion?: string | number | null
        areaTotalM2?: string | number | null
        precioSoles?: string | number | null
        precioDolares?: string | number | null
        descripcionProyecto?: string | number | null
      }
    | string
    | null
    | undefined,
) {
  if (!projectContext) return []
  if (typeof projectContext === 'string') {
    const text = projectContext.trim()
    return text ? [`Contexto del proyecto: ${text}`] : []
  }

  const tipoOperacion = normalizeContextValue(projectContext.tipoOperacion)
  const estado = normalizeContextValue(projectContext.estado)
  const ubicacion = normalizeContextValue(projectContext.ubicacion)
  const areaTotalM2 = normalizeContextValue(projectContext.areaTotalM2)
  const precioSoles = normalizeContextValue(projectContext.precioSoles)
  const precioDolares = normalizeContextValue(projectContext.precioDolares)
  const descripcionProyecto = normalizeContextValue(projectContext.descripcionProyecto)

  return [
    tipoOperacion ? `Tipo de operacion: ${tipoOperacion}` : null,
    estado ? `Estado: ${estado}` : null,
    ubicacion ? `Ubicacion: ${ubicacion}` : null,
    areaTotalM2 ? `Area total m2: ${areaTotalM2}` : null,
    precioSoles ? `Precio en soles: ${precioSoles}` : null,
    precioDolares ? `Precio en dolares: ${precioDolares}` : null,
    descripcionProyecto ? `Descripcion del proyecto: ${descripcionProyecto}` : null,
  ].filter(Boolean) as string[]
}

function stripCodeFences(text: string): string {
  return text.replace(/```json|```/g, '').trim()
}

function extractJsonObject(text: string): unknown | null {
  const cleaned = stripCodeFences(text)
  try {
    return JSON.parse(cleaned)
  } catch {
    // Intentar extraer el primer objeto JSON aunque el modelo devuelva texto alrededor.
    const first = cleaned.indexOf('{')
    const last = cleaned.lastIndexOf('}')
    if (first === -1 || last === -1 || last <= first) return null
    const candidate = cleaned.slice(first, last + 1)
    try {
      return JSON.parse(candidate)
    } catch {
      return null
    }
  }
}

function tryExtractVariantsFromText(text: string): string[] {
  const extracted = extractJsonObject(text)

  if (Array.isArray(extracted)) {
    return extracted.filter((v) => typeof v === 'string').slice(0, 3)
  }

  if (extracted && typeof extracted === 'object') {
    const variantsRaw = (extracted as any)?.variants ?? (extracted as any)?.variantList ?? (extracted as any)?.items
    if (Array.isArray(variantsRaw)) {
      return variantsRaw.filter((v) => typeof v === 'string').slice(0, 3)
    }
  }

  // Fallback: buscar "variants": [ ... ] aunque no sea parseable como JSON completo.
  const variantsKeyMatch = text.match(/"variants"\s*:\s*\[([\s\S]*?)\]/i)
  if (variantsKeyMatch?.[1]) {
    const arrayText = `[${variantsKeyMatch[1]}]`
    try {
      const arr = JSON.parse(arrayText) as unknown
      if (Array.isArray(arr)) return arr.filter((v) => typeof v === 'string').slice(0, 3)
    } catch {
      // ignore
    }
  }

  // 1) Extraer viñetas o numeraciones: "1) ...", "- ...", "* ..."
  const bulletLines = Array.from(text.matchAll(/^\s*(?:\d+\)|\d+\.|-|\*)\s*(.+)$/gm)).map((m) => m[1]).filter(Boolean)
  if (bulletLines.length > 0) return bulletLines.slice(0, 3)

  // 2) Último recurso: extraer frases entre comillas (puede capturar ruido).
  const quotedStrings = Array.from(text.matchAll(/"([^"]+)"/g)).map((m) => m[1]).filter(Boolean)
  if (quotedStrings.length > 0) return quotedStrings.slice(0, 3)

  // 3) Nada que parsear
  return []
}

function sanitizeVariants(input: string[]): string[] {
  const blocked = new Set(['variants', 'variant', 'descripcion', 'descripciones', 'caption', 'captions'])
  return input
    .map((v) => v.trim().replace(/^\([^)]*\)\s*/g, ''))
    .filter((v) => v.length >= 10)
    .filter((v) => !blocked.has(v.toLowerCase()))
    .filter((v) => /[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]/.test(v))
    .slice(0, 3)
}

function buildFallbackVariants(params: {
  tone: string
  objective: string
  projectName: string
  title?: string
  subtitle?: string
}): string[] {
  const { objective, projectName, title, subtitle } = params
  const name = projectName || 'este proyecto'
  const titleLine = title?.trim() ? title.trim() : 'Inmueble de ejemplo'
  const subtitleLine = subtitle?.trim() ? subtitle.trim() : null
  const base = `${titleLine} en ${name}. ${subtitleLine ? subtitleLine + '. ' : ''}✨ Vive una propuesta inmobiliaria con excelente distribucion, ubicacion estrategica y valor de inversion. 🏡 Agenda tu visita y solicita precio por WhatsApp.`

  const v1 = `${base} 📍 Descubre ambientes pensados para tu comodidad diaria, con espacios funcionales y buena iluminacion para disfrutar cada momento en familia.`
  const v2 = `Si buscas ${objective}, esta opcion destaca por su propuesta comercial y potencial de plusvalia. 🔑 ${titleLine} ofrece comodidad, conectividad y una oportunidad ideal para dar el siguiente paso. 📲 Escribenos y coordina tu visita hoy.`
  const v3 = `Conoce ${titleLine} en ${name}: una alternativa ideal para vivir o invertir con confianza. 🌟 Diseno funcional, entorno favorable y beneficios que marcan diferencia. 💬 Solicita informacion completa, precio actualizado y recorrido personalizado por WhatsApp.`

  return [v1, v2, v3].map((v) => v.length > 520 ? v.slice(0, 517) + '...' : v)
}

export async function POST(request: Request) {
  const geminiKey = process.env.GEMINI_API_KEY?.trim()
  if (!geminiKey) {
    return NextResponse.json({ message: 'Falta GEMINI_API_KEY en el servidor.' }, { status: 500 })
  }

  const body = generateSchema.safeParse(await request.json())
  if (!body.success) {
    return NextResponse.json({ message: 'Payload invalido.', errors: body.error.flatten() }, { status: 400 })
  }

  const tone = (body.data.modoIA ?? body.data.tone ?? '').trim()
  const objective = (body.data.objetivoIA ?? body.data.objective ?? '').trim()
  const { projectName, projectContext, title, subtitle } = body.data
  const projectContextLines = buildProjectContextLines(projectContext)

  if (!tone || !objective) {
    return NextResponse.json({ message: 'Faltan parametros de IA (modoIA y objetivoIA).' }, { status: 400 })
  }

  const prompt = [
    'Genera 3 variantes de descripcion/caption para un inmueble de ejemplo.',
    'Idioma: espanol.',
    'Requisitos:',
    '- Devuelve un JSON con la forma: {"variants":["...","...","..."]}',
    '- Devuelve SOLO el JSON (sin texto adicional y sin ```).',
    '- Cada variante debe tener entre 220 y 520 caracteres.',
    '- Debe incluir al menos una llamada a la accion (WhatsApp/visita/solicita precio).',
    '- Debe sonar comercial para venta/alquiler de inmuebles.',
    '- Usa iconos/emojis de apoyo (ej: ✨🏡📍🔑💬📲), con naturalidad.',
    '- No inicies con "(profesional)", "(juvenil)" ni ningun texto entre parentesis del tono.',
    '- No repitas palabras vacias como "variants", "caption", etc.',
    '- No inventes datos (usa solo los que te doy).',
    '',
    `Datos: tono=${tone}, objetivo=${objective}`,
    `Inmueble/Proyecto de ejemplo: ${projectName}`,
    ...projectContextLines,
    title ? `Titulo: ${title}` : null,
    subtitle ? `Subtitulo: ${subtitle}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.9,
      topP: 0.9,
      maxOutputTokens: 512,
    },
  }

  const fallbackPrompt = [
    'Escribe exactamente 3 descripciones cortas para un inmueble de ejemplo.',
    'Formato obligatorio: JSON puro {"variants":["texto1","texto2","texto3"]}',
    'No escribas ninguna otra clave ni texto extra.',
    'Cada descripcion debe tener CTA, enfoque comercial y emojis de apoyo.',
    'No uses prefijos entre parentesis como "(profesional)".',
    `Contexto: tono=${tone}, objetivo=${objective}, inmueble=${projectName}`,
    ...projectContextLines,
    title ? `Titulo: ${title}` : null,
    subtitle ? `Subtitulo: ${subtitle}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const fallbackPayload = {
    ...payload,
    contents: [{ role: 'user', parts: [{ text: fallbackPrompt }] }],
  }

  const listModels = async (apiVersion: 'v1' | 'v1beta') => {
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${encodeURIComponent(geminiKey)}`
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => null)
    if (!res || !res.ok) return []
    const data = (await res.json().catch(() => null)) as any
    const models = Array.isArray(data?.models) ? data.models : Array.isArray(data?.model) ? data.model : []
    return models as any[]
  }

  const tryGenerateWithModel = async (apiVersion: 'v1' | 'v1beta', model: string, bodyPayload: unknown) => {
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
    }).catch(() => null)
    if (!response) return { ok: false as const, errorMessage: 'Error de red con Gemini.' }
    const parsed = (await response.json().catch(() => null)) as any
    if (!response.ok) return { ok: false as const, errorMessage: parsed?.error?.message ?? 'Error consultando Gemini.' }
    return { ok: true as const, json: parsed }
  }

  const candidates: Array<{ apiVersion: 'v1' | 'v1beta'; model: string }> = []

  // 1) Descubrir candidatos reales con ListModels.
  for (const apiVersion of ['v1beta', 'v1'] as const) {
    const models = await listModels(apiVersion)
    for (const m of models) {
      const rawName = typeof m?.name === 'string' ? m.name : ''
      const model = rawName.startsWith('models/') ? rawName.slice('models/'.length) : rawName
      if (!model) continue

      const methods: unknown = m?.supportedGenerationMethods ?? m?.generationMethods ?? m?.supported_methods
      const methodStrings = Array.isArray(methods) ? (methods.filter((x) => typeof x === 'string') as string[]) : []

      const supportsGenerateContent =
        methodStrings.length === 0 ? true : methodStrings.some((method) => method.toLowerCase().includes('generatecontent'))

      if (supportsGenerateContent) {
        candidates.push({ apiVersion, model })
      }
    }
  }

  // 2) Si no pudimos descubrir nada, usamos fallback conservador.
  if (candidates.length === 0) {
    candidates.push(
      { apiVersion: 'v1beta', model: 'gemini-1.5-flash' },
      { apiVersion: 'v1beta', model: 'gemini-1.0-pro' },
      { apiVersion: 'v1', model: 'gemini-1.5-flash' },
      { apiVersion: 'v1', model: 'gemini-1.0-pro' },
    )
  }

  let lastErrorMessage: string | null = null
  let json: any = null

  for (const candidate of candidates) {
    const result = await tryGenerateWithModel(candidate.apiVersion, candidate.model, payload)
    if (result.ok) {
      json = result.json
      lastErrorMessage = null
      break
    }
    lastErrorMessage = result.errorMessage
  }

  if (!json) return NextResponse.json({ message: lastErrorMessage ?? 'Error consultando Gemini.' }, { status: 502 })

  const text =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ??
    json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('\n') ??
    ''

  let variants = sanitizeVariants(tryExtractVariantsFromText(text))

  if (variants.length < 3) {
    // Reintento con prompt estricto en el primer modelo disponible.
    const first = candidates[0]
    if (first) {
      const retry = await tryGenerateWithModel(first.apiVersion, first.model, fallbackPayload)
      if (retry.ok) {
        const retryText =
          retry.json?.candidates?.[0]?.content?.parts?.[0]?.text ??
          retry.json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('\n') ??
          ''
        variants = sanitizeVariants(tryExtractVariantsFromText(retryText))
      }
    }
  }

  if (variants.length === 0) {
    // Nunca romper la UI: responder siempre el formato solicitado.
    const fallback = buildFallbackVariants({ tone, objective, projectName, title, subtitle })
    return NextResponse.json({ variants: fallback.slice(0, 3) })
  }

  // Si solo llegaron 1-2, completa con fallback para asegurar 3 variantes.
  if (variants.length < 3) {
    const fallback = buildFallbackVariants({ tone, objective, projectName, title, subtitle })
    variants = [...variants, ...fallback].slice(0, 3)
  }

  return NextResponse.json({ variants: variants.slice(0, 3) })
}

