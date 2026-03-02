import Link from 'next/link'
import { AlertTriangle, ArrowRight, BellRing, Clock3, ShieldAlert, Zap } from 'lucide-react'

import type { ExecutiveInboxData } from '@/lib/dashboard-data'

function metricToneClass(tone: 'primary' | 'warning' | 'danger' | 'neutral') {
  if (tone === 'danger') return 'border-destructive/30 bg-destructive/5'
  if (tone === 'warning') return 'border-amber-500/30 bg-amber-500/5'
  if (tone === 'primary') return 'border-primary/30 bg-primary/5'
  return 'border-border bg-muted/30'
}

function itemIcon(category: 'vencida' | 'aprobacion' | 'token' | 'fallo' | 'alerta') {
  if (category === 'vencida') return <Clock3 size={15} className="text-destructive" />
  if (category === 'aprobacion') return <AlertTriangle size={15} className="text-amber-500" />
  if (category === 'token') return <ShieldAlert size={15} className="text-amber-500" />
  if (category === 'fallo') return <Zap size={15} className="text-destructive" />
  return <BellRing size={15} className="text-primary" />
}

export function ExecutiveInbox({ data }: { data: ExecutiveInboxData }) {
  return (
    <section className="surface-card p-6 enter-up space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-primary/85 mb-2">Inbox operativo</p>
          <h3 className="text-xl font-semibold">Centro de control</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Una sola bandeja para resolver bloqueos de ejecucion, aprobaciones y riesgos de cuentas antes de que afecten resultados.
          </p>
        </div>
        <Link href="/notifications" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
          Ver alertas
          <ArrowRight size={15} className="ml-1.5" />
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        {data.metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className={`rounded-2xl border p-4 transition-colors hover:border-primary/40 ${metricToneClass(metric.tone)}`}
          >
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="text-3xl font-semibold mt-2">{metric.value}</p>
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {data.items.length > 0 ? data.items.map((item) => (
          <div key={item.id} className="surface-muted p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {itemIcon(item.category)}
                <p className="text-sm font-semibold truncate">{item.title}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    item.priority === 'alta'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}
                >
                  {item.priority}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              <p className="text-[11px] text-muted-foreground mt-2">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
            <Link href={item.href} className="text-xs font-semibold text-primary inline-flex items-center gap-1 whitespace-nowrap">
              Resolver
              <ArrowRight size={13} />
            </Link>
          </div>
        )) : (
          <div className="surface-muted p-5 text-sm text-muted-foreground">
            No hay bloqueos operativos en este momento. La cola esta bajo control.
          </div>
        )}
      </div>
    </section>
  )
}
