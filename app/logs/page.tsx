import { Breadcrumbs } from '@/components/breadcrumbs'
import { StatusBadge } from '@/components/base/status-badge'
import { getLogsData } from '@/lib/operations-feed'

export default async function LogsPage() {
  const logs = await getLogsData(80)

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="view-title">Registros</h1>
        <p className="view-subtitle">Bitacora operativa real de publicacion, errores y acciones del sistema.</p>
      </div>

      <div className="surface-card p-6">
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={log.level} />
                    <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{log.category}</span>
                    <span className="text-xs text-muted-foreground">{log.action}</span>
                  </div>
                  <p className="font-semibold mt-2">{log.summary}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {log.targetType ?? 'sistema'} {log.targetId ? `· ${log.targetId}` : ''}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
              </div>

              {log.detail ? (
                <pre className="mt-3 rounded-lg bg-muted/40 p-3 text-xs overflow-x-auto">{JSON.stringify(log.detail, null, 2)}</pre>
              ) : null}
            </div>
          ))}

          {logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Aun no hay registros operativos.</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
