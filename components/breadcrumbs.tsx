'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/calendar': 'Calendar',
  '/scheduled-posts': 'Scheduled Posts',
  '/create': 'Create Post',
  '/library': 'Media Library',
  '/approvals': 'Approvals',
  '/social-accounts': 'Social Accounts',
  '/logs': 'Logs',
  '/settings': 'Settings',
  '/users': 'Users',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      <Link href="/dashboard" className="flex items-center hover:text-foreground transition-colors">
        <Home size={16} />
      </Link>

      {segments.map((segment, index) => {
        const path = '/' + segments.slice(0, index + 1).join('/');
        const label = breadcrumbMap[path] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <div key={path} className="flex items-center gap-2">
            <ChevronRight size={16} />
            {index === segments.length - 1 ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link href={path} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
