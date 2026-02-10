'use client'

import { useState } from 'react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    company: 'InmoSocial Suite',
    timezone: 'America/Mexico_City',
    noPublishDays: ['sunday'],
  })

  const timezones = [
    'America/New_York',
    'America/Mexico_City',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Madrid',
    'Asia/Tokyo',
  ]

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  const toggleDay = (day: string) => {
    setSettings(prev => ({
      ...prev,
      noPublishDays: prev.noPublishDays.includes(day)
        ? prev.noPublishDays.filter(d => d !== day)
        : [...prev.noPublishDays, day],
    }))
  }

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar navigation */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {['general', 'team', 'billing'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-b-0 transition-colors ${
                  activeTab === tab
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Company Info */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold block mb-2">Company Name</label>
                    <Input
                      value={settings.company}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, company: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Timezone */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Timezone</h3>
                <select className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground">
                  {timezones.map(tz => (
                    <option key={tz} value={tz} selected={tz === settings.timezone}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              {/* Publishing Rules */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Publishing Rules</h3>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Posts will not be automatically published on these days
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {days.map(day => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`p-3 rounded-lg border-2 transition-colors text-sm font-semibold capitalize ${
                          settings.noPublishDays.includes(day)
                            ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button>Save Changes</Button>
            </div>
          )}

          {/* Team Settings */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Team Members</h3>
                  <Button size="sm">Add Member</Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Manage team members and their roles. Visit{' '}
                  <button className="text-primary hover:underline">Users</button> page for detailed
                  management.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Invite Link</h3>
                <div className="flex gap-2">
                  <Input
                    value="https://inmosocial.com/invite/abc123def456"
                    readOnly
                    className="flex-1"
                  />
                  <Button variant="outline">
                    <Link size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Billing Settings */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Professional</p>
                      <p className="text-sm text-muted-foreground">
                        $99/month • Billed annually
                      </p>
                    </div>
                    <Button variant="outline">Change Plan</Button>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Billing Information</h3>
                <div className="space-y-4">
                  <div className="text-sm">
                    <p className="text-muted-foreground">Next billing date</p>
                    <p className="font-semibold">March 6, 2025</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">💳 Visa ending in 4242</p>
                  <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                    Update
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
