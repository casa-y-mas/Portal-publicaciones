'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Search, Bell, LogOut, Settings } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import { notifications } from '@/lib/mock-data'

export function Topbar() {
  const [searchOpen, setSearchOpen] = useState(false)
  const { data: session } = useSession()
  const unreadCount = notifications.filter((item) => !item.read).length

  const userName = session?.user?.name ?? 'Usuario'
  const userRole = session?.user?.role ?? 'editor'
  const userInitials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function handleSignOut() {
    await signOut({ callbackUrl: '/auth/login' })
  }

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 bg-card border-b border-border h-16 z-30">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <div className="flex-1 max-w-md">
          {searchOpen ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder="Buscar publicaciones, proyectos..."
                className="pl-10 w-full"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-muted-foreground text-sm hover:bg-muted/80 transition-colors"
            >
              <Search size={18} />
              <span>Buscar...</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 ml-4">
          <Link href="/notifications" className="relative p-2 hover:bg-muted rounded-lg transition-colors">
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
              <button className="flex items-center gap-2 pl-3 pr-2 py-2 hover:bg-muted rounded-lg transition-colors">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {userInitials}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-4 py-2">
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
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
