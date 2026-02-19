import Link from 'next/link'
import { AlertTriangle, ArrowRight, Gauge, Layers3, Rocket, ShieldCheck } from 'lucide-react'

import { StatusBadge } from '@/components/base/status-badge'
import type { DashboardCommandCenterData } from '@/lib/dashboard-data'

interface OperationsCenterProps {
  data: DashboardCommandCenterData
}

function toBarWidth(value: number, total: number): string {
  if (total <= 0) return '0%'
  return `${Math.max(6, Math.round((value / total) * 100))}%`
}

export function OperationsCenter({ data }: OperationsCenterProps) {
  const totalStatus = data.statusMix.reduce((sum, item) => sum + item.total, 0)
  const totalPlatform = data.platformMix.reduce((sum, item) => sum + item.total, 0)

  return (
    <div className="surface-card p-6 enter-up space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-primary/85 mb-2">Centro de operaciones</p>
          <h3 className="text-xl font-semibold">Pulso estrategico del contenido</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Detecta cuellos de botella, riesgos de ejecucion y oportunidades de crecimiento antes que impacten resultados.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 min-w-[150px]">
          <p className="text-xs text-muted-foreground mb-1">Salud operativa</p>
          <div className="flex items-center gap-2">
            <Gauge size={16} className="text-primary" />
            <p className="text-2xl font-semibold">{data.healthScore}%</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="surface-muted p-4">
          <p className="text-xs text-muted-foreground mb-1">Pendientes en 24h</p>
          <p className="text-2xl font-semibold">{data.pendingApprovalNext24h}</p>
          <p className="text-xs text-muted-foreground mt-1">Publicaciones que requieren aprobacion inmediata.</p>
        </div>
        <div className="surface-muted p-4">
          <p className="text-xs text-muted-foreground mb-1">Fallos 7 dias</p>
          <p className="text-2xl font-semibold">{data.failedLast7d}</p>
          <p className="text-xs text-muted-foreground mt-1">Incidencias recientes que afectan continuidad.</p>
        </div>
        <div className="surface-muted p-4">
          <p className="text-xs text-muted-foreground mb-1">Programadas 7 dias</p>
          <p className="text-2xl font-semibold">{data.scheduledNext7d}</p>
          <p className="text-xs text-muted-foreground mt-1">Carga operativa proyectada para la semana.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="surface-muted p-4">
          <p className="text-sm font-semibold mb-3">Mix por estado</p>
          <div className="space-y-2">
            {data.statusMix.map((item) => (
              <div key={item.status}>
                <div className="flex items-center justify-between mb-1">
                  <StatusBadge status={item.status} />
                  <span className="text-xs font-semibold">{item.total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary/80 rounded-full" style={{ width: toBarWidth(item.total, totalStatus) }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-muted p-4">
          <p className="text-sm font-semibold mb-3">Potencia por red</p>
          <div className="space-y-2">
            {data.platformMix.map((item) => (
              <div key={item.platform}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm">{item.platform}</p>
                  <span className="text-xs font-semibold">{item.total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-accent/85 rounded-full" style={{ width: toBarWidth(item.total, totalPlatform) }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-muted p-4">
          <p className="text-sm font-semibold mb-3">Proyectos bajo carga</p>
          <div className="space-y-2">
            {data.projectPulse.map((item) => (
              <div key={item.project} className="flex items-center justify-between border border-border rounded-lg px-3 py-2 bg-card/70">
                <p className="text-sm">{item.project}</p>
                <span className="text-xs font-semibold text-primary">{item.upcoming} proximas</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/publicaciones-programadas" className="surface-muted p-3 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Sala de ejecucion</p>
            <Rocket size={16} className="text-primary" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Editar, duplicar y cancelar con trazabilidad.</p>
        </Link>
        <Link href="/approvals" className="surface-muted p-3 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Aprobacion urgente</p>
            <AlertTriangle size={16} className="text-accent" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Vaciar pendientes antes del corte operativo.</p>
        </Link>
        <Link href="/library" className="surface-muted p-3 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Biblioteca premium</p>
            <Layers3 size={16} className="text-primary" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Activos listos para usar por proyecto.</p>
        </Link>
        <Link href="/reports" className="surface-muted p-3 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Inteligencia comercial</p>
            <ShieldCheck size={16} className="text-primary" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Reporte ejecutivo para toma de decision.</p>
        </Link>
      </div>

      <div className="flex justify-end">
        <Link href="/create" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
          Crear contenido de alto impacto
          <ArrowRight size={15} className="ml-1.5" />
        </Link>
      </div>
    </div>
  )
}
