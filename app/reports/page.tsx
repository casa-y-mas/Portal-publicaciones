'use client'

import { Breadcrumbs } from '@/components/breadcrumbs'
import { reportSummary } from '@/lib/mock-data'

export default function ReportsPage() {
  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Reports</h1>
        <p className="text-muted-foreground">Publicaciones por periodo, por red, por proyecto y porcentaje de fallos.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-sm text-muted-foreground">Publicaciones esta semana</p>
          <p className="text-3xl font-bold mt-2">{reportSummary.weekPosts}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-sm text-muted-foreground">Publicaciones este mes</p>
          <p className="text-3xl font-bold mt-2">{reportSummary.monthPosts}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-sm text-muted-foreground">Porcentaje de fallos</p>
          <p className="text-3xl font-bold mt-2">{reportSummary.failureRate}%</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="font-semibold mb-4">Por red social</h3>
          <div className="space-y-3">
            {reportSummary.byNetwork.map((item) => (
              <div key={item.network} className="flex items-center justify-between text-sm">
                <span>{item.network}</span>
                <span className="font-semibold">{item.total}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="font-semibold mb-4">Por proyecto</h3>
          <div className="space-y-3">
            {reportSummary.byProject.map((item) => (
              <div key={item.project} className="flex items-center justify-between text-sm">
                <span>{item.project}</span>
                <span className="font-semibold">{item.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
