'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, FileText, Plus, Library, CheckCircle, Zap, DotSquare as LogSquare, Settings, Users, ChevronDown, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    label: 'Scheduled Posts',
    href: '/scheduled-posts',
    icon: FileText,
  },
  {
    label: 'Create',
    href: '/create',
    icon: Plus,
  },
  {
    label: 'Library',
    href: '/library',
    icon: Library,
  },
  {
    label: 'Approvals',
    href: '/approvals',
    icon: CheckCircle,
  },
  {
    label: 'Social Accounts',
    href: '/social-accounts',
    icon: Zap,
  },
  {
    label: 'Logs',
    href: '/logs',
    icon: LogSquare,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    label: 'Users',
    href: '/users',
    icon: Users,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed md:hidden bottom-4 right-4 z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-lg"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-40 transform transition-transform duration-200 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              IS
            </div>
            <h1 className="text-lg font-bold text-sidebar-foreground">
              InmoSocial
            </h1>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="bg-sidebar-accent/30 rounded-lg p-4 text-center">
            <p className="text-xs text-sidebar-foreground mb-2">
              Version 1.0.0
            </p>
            <button className="text-xs text-sidebar-primary hover:underline w-full">
              Release Notes
            </button>
          </div>
        </div>
      </aside>

      {/* Content offset for desktop */}
      <div className="md:ml-64" />
    </>
  );
}
