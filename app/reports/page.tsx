import { Breadcrumbs } from '@/components/breadcrumbs'
import { WeeklyReportPanel } from '@/components/dashboard/weekly-report-panel'
import { getReportSummary } from '@/lib/dashboard-data'
import { getWeeklyExecutiveReport } from '@/lib/executive-reports'
import { getMetaAnalyticsSummary } from '@/lib/meta-analytics'
import { getPostPerformanceSummary } from '@/lib/post-performance'

export default async function ReportsPage() {
  const [reportSummary, metaSummary, weeklyReport, postPerformance] = await Promise.all([
    getReportSummary(),
    getMetaAnalyticsSummary(7),
    getWeeklyExecutiveReport(),
    getPostPerformanceSummary(30),
  ])

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Reportes</h1>
        <p className="text-muted-foreground">Resumen real desde base de datos por periodo, por red, por proyecto y porcentaje de fallos.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-sm text-muted-foreground">Publicaciones ultimos 7 dias</p>
          <p className="text-3xl font-bold mt-2">{reportSummary.weekPosts}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-sm text-muted-foreground">Publicaciones ultimos 30 dias</p>
          <p className="text-3xl font-bold mt-2">{reportSummary.monthPosts}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-sm text-muted-foreground">Porcentaje de fallos</p>
          <p className="text-3xl font-bold mt-2">{reportSummary.failureRate}%</p>
        </div>
      </div>

      <div className="mb-6">
        <WeeklyReportPanel initialReport={weeklyReport} />
      </div>

      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h3 className="font-semibold">Analytics Meta (ultimos {metaSummary.periodDays} dias)</h3>
          <span className="text-xs rounded-full border border-border px-2 py-1 text-muted-foreground">
            Modo: {metaSummary.mode}
          </span>
        </div>

        <div className="grid md:grid-cols-5 gap-3 mb-4">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Impresiones</p>
            <p className="text-xl font-bold">{metaSummary.totals.impressions.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Alcance</p>
            <p className="text-xl font-bold">{metaSummary.totals.reach.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Interacciones</p>
            <p className="text-xl font-bold">{metaSummary.totals.engagements.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Visitas perfil</p>
            <p className="text-xl font-bold">{metaSummary.totals.profileViews.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Engagement rate</p>
            <p className="text-xl font-bold">{metaSummary.totals.engagementRate}%</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {metaSummary.perPlatform.map((item) => (
            <div key={item.platform} className="rounded-lg border border-border p-3">
              <p className="text-sm font-semibold capitalize mb-2">{item.platform}</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Impresiones: <span className="text-foreground font-semibold">{item.impressions.toLocaleString()}</span></p>
                <p>Alcance: <span className="text-foreground font-semibold">{item.reach.toLocaleString()}</span></p>
                <p>Interacciones: <span className="text-foreground font-semibold">{item.engagements.toLocaleString()}</span></p>
                <p>Visitas perfil: <span className="text-foreground font-semibold">{item.profileViews.toLocaleString()}</span></p>
              </div>
            </div>
          ))}
        </div>

        {metaSummary.warnings.length > 0 ? (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2">Observaciones</p>
            <div className="space-y-1">
              {metaSummary.warnings.slice(0, 6).map((warning) => (
                <p key={warning} className="text-xs text-amber-700 dark:text-amber-200">{warning}</p>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="font-semibold mb-4">Por red social</h3>
          <div className="space-y-3">
            {reportSummary.byNetwork.length > 0 ? reportSummary.byNetwork.map((item) => (
              <div key={item.network} className="flex items-center justify-between text-sm">
                <span>{item.network}</span>
                <span className="font-semibold">{item.total}</span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Aun no hay publicaciones suficientes para este periodo.</p>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="font-semibold mb-4">Por proyecto</h3>
          <div className="space-y-3">
            {reportSummary.byProject.length > 0 ? reportSummary.byProject.map((item) => (
              <div key={item.project} className="flex items-center justify-between text-sm">
                <span>{item.project}</span>
                <span className="font-semibold">{item.total}</span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Aun no hay actividad suficiente para este periodo.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 mt-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h3 className="font-semibold">Estadisticas por publicacion (ultimos {postPerformance.periodDays} dias)</h3>
          <span className="text-xs rounded-full border border-border px-2 py-1 text-muted-foreground">
            Nivel interno
          </span>
        </div>

        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Total publicaciones</p>
            <p className="text-xl font-bold">{postPerformance.totals.totalPosts}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Publicadas</p>
            <p className="text-xl font-bold">{postPerformance.totals.published}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Fallidas</p>
            <p className="text-xl font-bold">{postPerformance.totals.failed}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Tasa promedio de exito</p>
            <p className="text-xl font-bold">{postPerformance.totals.avgSuccessRate}%</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-5">
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-semibold mb-3">Segmentacion por proyecto</p>
            <div className="space-y-2">
              {postPerformance.byProject.slice(0, 8).map((item) => (
                <div key={item.projectId} className="text-xs flex items-center justify-between gap-2">
                  <span className="text-muted-foreground truncate">{item.projectName}</span>
                  <span className="font-semibold">{item.total} • {item.published} ok • {item.failed} fail</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-semibold mb-3">Segmentacion por red</p>
            <div className="space-y-2">
              {postPerformance.byPlatform.slice(0, 8).map((item) => (
                <div key={item.platform} className="text-xs flex items-center justify-between gap-2">
                  <span className="text-muted-foreground capitalize">{item.platform}</span>
                  <span className="font-semibold">{item.total} • {item.published} ok • {item.failed} fail</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="py-2 pr-3">Publicacion</th>
                <th className="py-2 pr-3">Proyecto</th>
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Redes</th>
                <th className="py-2 pr-3">Exito</th>
                <th className="py-2 pr-3">Nivel</th>
              </tr>
            </thead>
            <tbody>
              {postPerformance.topPosts.map((item) => (
                <tr key={item.id} className="border-b border-border/60">
                  <td className="py-2 pr-3">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.status}</p>
                  </td>
                  <td className="py-2 pr-3">{item.projectName}</td>
                  <td className="py-2 pr-3">{new Date(item.publishAt).toLocaleString()}</td>
                  <td className="py-2 pr-3">{item.platforms.join(', ') || 'N/D'}</td>
                  <td className="py-2 pr-3">
                    {item.successRate}% ({item.successCount}/{item.executions})
                  </td>
                  <td className="py-2 pr-3 capitalize">{item.level}</td>
                </tr>
              ))}
              {postPerformance.topPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    Aun no hay publicaciones suficientes para calcular desempeno por post.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
