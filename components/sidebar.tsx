'use client';

import Image from 'next/image';
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
  Megaphone,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Panel', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Calendario', href: '/calendar', icon: Calendar },
  { label: 'Publicaciones programadas', href: '/publicaciones-programadas', icon: FileText },
  { label: 'Crear', href: '/create', icon: Plus },
  { label: 'Biblioteca', href: '/library', icon: Library },
  { label: 'Aprobaciones', href: '/approvals', icon: CheckCircle },
  { label: 'Proyectos', href: '/projects', icon: Building2 },
  { label: 'Campanas', href: '/campaigns', icon: Megaphone },
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
        className="fixed bottom-4 right-4 z-50 rounded-full bg-primary p-3 text-primary-foreground shadow-lg md:hidden"
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
        className={`fixed left-0 top-0 z-40 flex h-screen w-[86vw] max-w-[18rem] flex-col border-r border-sidebar-border bg-sidebar transform transition-transform duration-200 md:w-64 md:max-w-none md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-sidebar-border bg-gradient-to-b from-primary/20 to-transparent p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl shadow">
              <Image
                src="/img/Icono.webp"
                alt="Casa y Mas"
                fill
                className="object-cover"
                sizes="36px"
                priority
              />
            </div>
            <div>
              <h1 className="text-base font-semibold text-sidebar-foreground md:text-lg">Casa y Mas</h1>
              <p className="text-[10px] text-sidebar-foreground/65 md:text-[11px]">Suite de publicaciones</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-scroll relative flex-1 overflow-y-auto px-2 py-3 pr-1 md:px-3 md:py-4 md:pr-2">
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
                  <Icon size={18} className="shrink-0" />
                  <span className="text-sm leading-5 md:text-[15px]">{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="pointer-events-none sticky bottom-0 h-8 bg-gradient-to-t from-sidebar to-transparent" />
        </nav>

        {/* <div className="p-4 border-t border-sidebar-border">
          <div className="rounded-xl border border-sidebar-border bg-white/5 p-3">
            <p className="text-xs text-sidebar-foreground/70">Plan activo</p>
            <p className="text-sm font-semibold text-sidebar-foreground mt-1">Equipo Pro</p>
          </div>
        </div> */}
      </aside>

      <div className="md:ml-64" />
    </>
  );
}
