import { BrainCircuit, CheckCircle2, Clock3, Rocket } from 'lucide-react'

import type { ProjectOptimizationRecommendation } from '@/lib/dashboard-data'

export function OptimizationLab({ recommendations }: { recommendations: ProjectOptimizationRecommendation[] }) {
  return (
    <div className="surface-card p-6 enter-up">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-primary/85 mb-2">Optimizador IA</p>
          <h3 className="text-lg font-semibold">Mejor red y horario por proyecto</h3>
          <p className="text-xs text-muted-foreground mt-1">Recomendaciones predictivas con aprendizaje del historico operativo.</p>
        </div>
        <div className="rounded-xl bg-primary/12 text-primary p-2.5">
          <BrainCircuit size={18} />
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="surface-muted p-4 text-sm text-muted-foreground">Aun no hay suficiente historico para generar recomendaciones.</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recommendations.map((item) => (
            <div key={item.projectId} className="surface-muted p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold">{item.projectName}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.rationale}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-border bg-card/70 px-2 py-2">
                  <p className="text-muted-foreground mb-1">Red ideal</p>
                  <p className="font-semibold">{item.recommendedPlatform}</p>
                </div>
                <div className="rounded-lg border border-border bg-card/70 px-2 py-2">
                  <p className="text-muted-foreground mb-1">Ventana</p>
                  <p className="font-semibold">{item.recommendedWindow}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 text-green-700 dark:text-green-300 px-2 py-1 font-semibold">
                  <CheckCircle2 size={12} />
                  Exito estimado {item.successRate}%
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 text-accent-foreground dark:text-accent px-2 py-1 font-semibold">
                  <Clock3 size={12} />
                  Confianza {item.confidence}%
                </span>
              </div>

              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${item.confidence}%` }} />
              </div>

              <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <Rocket size={11} />
                Muestra historica: {item.sampleSize} publicaciones
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
