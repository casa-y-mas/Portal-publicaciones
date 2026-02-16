'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Plus,
  Library,
  CheckCircle,
  Zap,
  DotSquare as LogSquare,
  Settings,
  Users,
  Building2,
  BarChart3,
  Bell,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Panel', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Calendario', href: '/calendar', icon: Calendar },
  { label: 'Publicaciones programadas', href: '/scheduled-posts', icon: FileText },
  { label: 'Crear', href: '/create', icon: Plus },
  { label: 'Biblioteca', href: '/library', icon: Library },
  { label: 'Aprobaciones', href: '/approvals', icon: CheckCircle },
  { label: 'Proyectos', href: '/projects', icon: Building2 },
  { label: 'Reportes', href: '/reports', icon: BarChart3 },
  { label: 'Notificaciones', href: '/notifications', icon: Bell },
  { label: 'Cuentas sociales', href: '/social-accounts', icon: Zap },
  { label: 'Registros', href: '/logs', icon: LogSquare },
  { label: 'Configuracion', href: '/settings', icon: Settings },
  { label: 'Usuarios', href: '/users', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed md:hidden bottom-4 right-4 z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-lg"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-40 transform transition-transform duration-200 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-sidebar-border bg-gradient-to-b from-primary/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow">
              IN
            </div>
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">InmoSocial</h1>
              <p className="text-[11px] text-sidebar-foreground/65">Suite de publicaciones</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-scroll relative flex-1 overflow-y-auto py-4 px-3 pr-2">
          <p className="px-3 pb-3 text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/55">Navegacion</p>
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
                      : 'text-sidebar-foreground/90 hover:bg-sidebar-accent/35 hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-[15px]">{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="pointer-events-none sticky bottom-0 h-8 bg-gradient-to-t from-sidebar to-transparent" />
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="rounded-xl border border-sidebar-border bg-white/5 p-3">
            <p className="text-xs text-sidebar-foreground/70">Plan activo</p>
            <p className="text-sm font-semibold text-sidebar-foreground mt-1">Equipo Pro</p>
          </div>
        </div>
      </aside>

      <div className="md:ml-64" />
    </>
  );
}
