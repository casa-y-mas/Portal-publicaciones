'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Bell, LogOut, Plus, Search, Settings } from 'lucide-react'

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
  const [hydrated, setHydrated] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { data: session } = useSession()
  const selectedProjectId = searchParams.get('projectId') ?? 'all'

  const userName = hydrated ? (session?.user?.name ?? 'Usuario') : 'Usuario'
  const userRole = hydrated ? (session?.user?.role ?? 'editor') : 'editor'
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
    setHydrated(true)

    let mounted = true

    const loadHeaderData = async () => {
      try {
        const [projectsResponse, notificationsResponse] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/notifications'),
        ])

        if (projectsResponse.ok) {
          const json = await projectsResponse.json()
          if (mounted) {
            setProjects(
              (json.items ?? []).map((item: { id: string; name: string }) => ({
                id: item.id,
                name: item.name,
              })),
            )
          }
        }

        if (notificationsResponse.ok && mounted) {
          const json = await notificationsResponse.json()
          setUnreadCount(json.unreadCount ?? 0)
        }
      } catch {
        // no-op
      }
    }

    loadHeaderData()

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
    <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-background/75 backdrop-blur-xl md:left-64">
      <div className="flex min-h-16 items-center justify-between gap-2 px-3 py-2 sm:px-4 md:px-6">
        <div className="flex min-w-0 flex-1 max-w-xl items-center">
          {searchOpen ? (
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder="Buscar publicaciones, proyectos..."
                className="w-full rounded-xl border-border/70 bg-card/80 pl-10"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            </div>
          ) : (
            <>
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/35 md:flex"
              >
                <Search size={18} />
                <span>Buscar campana, activo o proyecto...</span>
              </button>
              <button
                onClick={() => setSearchOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/35 md:hidden"
                aria-label="Buscar"
              >
                <Search size={18} />
              </button>
            </>
          )}
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-1.5 sm:gap-2 md:ml-4 md:gap-3">
          <div className="hidden xl:block min-w-56">
            <Select value={selectedProjectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="h-10 rounded-xl border-border bg-card text-sm">
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
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow transition-all hover:brightness-105"
          >
            <Plus size={16} />
            <span className="hidden lg:inline">Nueva publicacion</span>
          </Link>

          <Link
            href="/notifications"
            className="relative rounded-xl border border-transparent p-2.5 transition-colors hover:border-border hover:bg-muted"
          >
            <Bell size={20} />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white">
                {unreadCount}
              </span>
            ) : null}
          </Link>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl border border-transparent px-1.5 py-1.5 transition-colors hover:border-border hover:bg-muted sm:px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                  {userInitials}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-4 py-2">
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-xs capitalize text-muted-foreground">{roleLabel[userRole] ?? userRole}</p>
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
