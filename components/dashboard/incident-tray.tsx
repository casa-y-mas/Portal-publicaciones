import Link from 'next/link'
import { AlertTriangle, ArrowRight, Siren, TriangleAlert } from 'lucide-react'

import type { OperationalIncidentItem } from '@/lib/dashboard-data'

export function IncidentTray({ incidents }: { incidents: OperationalIncidentItem[] }) {
  return (
    <div className="surface-card p-6 enter-up">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold">Bandeja de incidencias</h3>
          <p className="text-xs text-muted-foreground mt-1">Prioriza bloqueos de aprobacion, fallos y huecos de media.</p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 text-destructive px-2.5 py-1 text-xs font-semibold">
          <Siren size={13} />
          {incidents.length} activas
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="surface-muted p-4 text-sm text-muted-foreground">No hay incidencias criticas en este momento.</div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div key={incident.id} className="surface-muted p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {incident.severity === 'alta' ? (
                    <TriangleAlert size={14} className="text-destructive shrink-0" />
                  ) : (
                    <AlertTriangle size={14} className="text-accent shrink-0" />
                  )}
                  <p className="text-sm font-semibold truncate">{incident.title}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {incident.project} • {new Date(incident.publishAt).toLocaleString()}
                </p>
              </div>
              <Link href={incident.actionHref} className="text-xs font-semibold text-primary inline-flex items-center gap-1 whitespace-nowrap">
                Resolver
                <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
