'use client'

import { useState } from 'react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { publicationRules, roles } from '@/lib/mock-data'

type Tab = 'general' | 'security' | 'scheduler' | 'rules' | 'roles'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [settings, setSettings] = useState({
    company: 'InmoSocial Suite',
    timezone: 'America/Santo_Domingo',
    queueName: 'publication-queue',
    schedulerIntervalMinutes: 1,
    maxRetries: 3,
    encryptedTokens: true,
    strictRoles: true,
    auditLogs: true,
  })

  const tabs: Tab[] = ['general', 'security', 'scheduler', 'rules', 'roles']

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Configuracion administrativa, seguridad, scheduler y reglas de publicacion.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-b-0 transition-colors ${
                  activeTab === tab ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'general' && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">General</h3>
              <div>
                <label className="text-sm font-semibold block mb-2">Nombre de empresa</label>
                <Input value={settings.company} onChange={(e) => setSettings((prev) => ({ ...prev, company: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Zona horaria</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings((prev) => ({ ...prev, timezone: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2"
                >
                  <option value="America/Santo_Domingo">America/Santo_Domingo</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Mexico_City">America/Mexico_City</option>
                  <option value="Europe/Madrid">Europe/Madrid</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">Seguridad</h3>
              <p className="text-sm text-muted-foreground">Tokens cifrados, roles estrictos y logs auditables.</p>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.encryptedTokens}
                  onChange={(e) => setSettings((prev) => ({ ...prev, encryptedTokens: e.target.checked }))}
                />
                <span>Tokens cifrados en almacenamiento</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.strictRoles}
                  onChange={(e) => setSettings((prev) => ({ ...prev, strictRoles: e.target.checked }))}
                />
                <span>Control estricto por roles y permisos</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.auditLogs}
                  onChange={(e) => setSettings((prev) => ({ ...prev, auditLogs: e.target.checked }))}
                />
                <span>Auditoria obligatoria para cambios de programacion</span>
              </label>
            </div>
          )}

          {activeTab === 'scheduler' && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">Scheduler y cola</h3>
              <p className="text-sm text-muted-foreground">Motor en background con reintentos y manejo de errores API.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-2">Intervalo scheduler (min)</label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.schedulerIntervalMinutes}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, schedulerIntervalMinutes: Number.parseInt(e.target.value, 10) || 1 }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2">Reintentos maximos</label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.maxRetries}
                    onChange={(e) => setSettings((prev) => ({ ...prev, maxRetries: Number.parseInt(e.target.value, 10) || 1 }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Nombre de cola</label>
                <Input value={settings.queueName} onChange={(e) => setSettings((prev) => ({ ...prev, queueName: e.target.value }))} />
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">Reglas de publicacion</h3>
              <div className="space-y-3">
                {publicationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                    <div>
                      <p className="font-semibold">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">Aplica a: {rule.appliesTo}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${rule.enabled ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                      {rule.enabled ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">Roles y permisos</h3>
              <p className="text-sm text-muted-foreground">Matriz de autorizaciones para multi-proyecto y multi-cuenta.</p>
              <div className="space-y-3">
                {roles.map((role) => (
                  <div key={role.id} className="border border-border rounded-lg p-3">
                    <p className="font-semibold">{role.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{role.permissions.join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button>Guardar cambios</Button>
        </div>
      </div>
    </div>
  )
}
