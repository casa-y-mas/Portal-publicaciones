'use client'

import { publishedByDay } from '@/lib/mock-data'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function PublicationChart() {
  return (
    <div className="surface-card p-6 enter-up">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Publicaciones esta semana</h3>
        <p className="text-xs text-muted-foreground mt-1">Actividad diaria por fecha de salida</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={publishedByDay}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.7)" />
          <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            cursor={{ fill: 'hsl(var(--primary) / 0.08)' }}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
            }}
          />
          <Bar dataKey="posts" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
