import { Breadcrumbs } from '@/components/breadcrumbs'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { UpcomingPostsTable } from '@/components/dashboard/upcoming-posts-table'
import { PublicationChart } from '@/components/dashboard/publication-chart'
import { getDashboardStats, getUpcomingPosts } from '@/lib/dashboard-data'

export default async function DashboardPage() {
  const [stats, upcomingPosts] = await Promise.all([getDashboardStats(), getUpcomingPosts(5)])

  return (
    <div>
      <Breadcrumbs />

      <div className="dashboard-hero mb-8 enter-up">
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.16em] text-primary/90 mb-3">Control comercial</p>
          <h1 className="view-title mb-3">Panel ejecutivo</h1>
          <p className="text-sm md:text-base text-foreground/85 max-w-2xl">
            Supervisa campañas, aprobaciones y rendimiento de publicaciones para proyectos inmobiliarios desde un solo lugar.
          </p>
        </div>
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -left-8 -bottom-20 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="grid gap-6">
        <DashboardStats stats={stats} />

        <div className="grid md:grid-cols-2 gap-6">
          <PublicationChart />
          <div className="surface-card p-6 enter-up">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Distribucion por red social</h3>
              <p className="text-xs text-muted-foreground mt-1">Peso de contenido por plataforma</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Instagram</span>
                <div className="flex items-center gap-2">
                  <div className="w-28 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '65%' }} />
                  </div>
                  <span className="text-sm font-semibold">65%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Facebook</span>
                <div className="flex items-center gap-2">
                  <div className="w-28 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: '25%' }} />
                  </div>
                  <span className="text-sm font-semibold">25%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">TikTok</span>
                <div className="flex items-center gap-2">
                  <div className="w-28 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: '10%' }} />
                  </div>
                  <span className="text-sm font-semibold">10%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <UpcomingPostsTable posts={upcomingPosts} />
      </div>
    </div>
  )
}
