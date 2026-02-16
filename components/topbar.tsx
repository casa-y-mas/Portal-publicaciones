'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Search, Bell, LogOut, Settings, Plus } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ThemeToggle } from '@/components/theme-toggle'
import { notifications } from '@/lib/mock-data'

interface ProjectOption {
  id: string
  name: string
}

export function Topbar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchOpen, setSearchOpen] = useState(false)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const { data: session } = useSession()
  const unreadCount = notifications.filter((item) => !item.read).length
  const selectedProjectId = searchParams.get('projectId') ?? 'all'

  const userName = session?.user?.name ?? 'Usuario'
  const userRole = session?.user?.role ?? 'editor'
  const roleLabel: Record<string, string> = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    editor: 'Editor',
    viewer: 'Visualizador',
  }

  const userInitials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  useEffect(() => {
    let mounted = true

    const loadProjects = async () => {
      try {
        const response = await fetch('/api/projects')
        if (!response.ok) return
        const json = await response.json()
        if (mounted) {
          const list = (json.items ?? []).map((item: { id: string; name: string }) => ({
            id: item.id,
            name: item.name,
          }))
          setProjects(list)
        }
      } catch {
        // no-op
      }
    }

    loadProjects()

    return () => {
      mounted = false
    }
  }, [])

  const selectedProjectName = useMemo(() => {
    if (selectedProjectId === 'all') return 'Todos los proyectos'
    return projects.find((project) => project.id === selectedProjectId)?.name ?? 'Proyecto'
  }, [projects, selectedProjectId])

  function handleProjectChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('projectId')
    } else {
      params.set('projectId', value)
    }

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  async function handleSignOut() {
    await signOut({ callbackUrl: '/auth/login' })
  }

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 z-30 border-b border-border bg-background/75 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <div className="flex-1 max-w-xl">
          {searchOpen ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder="Buscar publicaciones, proyectos..."
                className="pl-10 w-full rounded-xl border-border/70 bg-card/80"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-muted-foreground text-sm hover:border-primary/35 transition-colors"
            >
              <Search size={18} />
              <span>Buscar campana, activo o proyecto...</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 ml-4">
          <div className="hidden xl:block min-w-56">
            <Select value={selectedProjectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="h-10 rounded-xl bg-card border-border text-sm">
                <SelectValue placeholder="Seleccionar proyecto">{selectedProjectName}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Link
            href="/create"
            className="hidden md:inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow hover:brightness-105 transition-all"
          >
            <Plus size={16} />
            Nueva publicacion
          </Link>

          <Link href="/notifications" className="relative p-2.5 hover:bg-muted rounded-xl transition-colors border border-transparent hover:border-border">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-2 pr-2 py-1.5 hover:bg-muted rounded-xl transition-colors border border-transparent hover:border-border">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold shadow-sm">
                  {userInitials}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-4 py-2">
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-xs text-muted-foreground capitalize">{roleLabel[userRole] ?? userRole}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings size={16} className="mr-2" />
                <span>Configuracion de cuenta</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                <LogOut size={16} className="mr-2" />
                <span>Cerrar sesion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
