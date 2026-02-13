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

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your social media activity</p>
      </div>

      <div className="grid gap-6">
        <DashboardStats stats={stats} />

        <div className="grid md:grid-cols-2 gap-6">
          <PublicationChart />
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Social Media Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Instagram</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: '65%' }} />
                  </div>
                  <span className="text-sm font-semibold">65%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Facebook</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: '25%' }} />
                  </div>
                  <span className="text-sm font-semibold">25%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">TikTok</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500" style={{ width: '10%' }} />
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
