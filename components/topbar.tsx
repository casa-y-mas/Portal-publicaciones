'use client';

import { useState } from 'react';
import { Search, Bell, LogOut, Settings, Sun, Moon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';

export function Topbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState('dark'); // Declare theme and setTheme
  const [mounted, setMounted] = useState(false); // Declare mounted

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 bg-card border-b border-border h-16 z-30">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Search */}
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

        {/* Right side */}
        <div className="flex items-center gap-4 ml-4">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-3 pr-2 py-2 hover:bg-muted rounded-lg transition-colors">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                  CL
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-4 py-2">
                <p className="text-sm font-semibold">Carlos López</p>
                <p className="text-xs text-muted-foreground">Supervisor</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings size={16} className="mr-2" />
                <span>Configuración de Cuenta</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell size={16} className="mr-2" />
                <span>Preferencias</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut size={16} className="mr-2" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
