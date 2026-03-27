'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';

const titleMap: Record<string, string> = {
  '/': 'Dashboard',
  '/cases': 'Cases',
  '/moderation': 'Moderation Queue',
  '/organizations': 'Organizations',
  '/partners': 'Partners',
  '/users': 'Users',
  '/audit-log': 'Audit Log',
  '/ai/correspondence': 'AI Correspondence',
  '/ai/discovery': 'AI Discovery',
  '/settings': 'Settings',
  '/auth/login': 'Login',
};

function getBreadcrumbs(pathname: string) {
  if (pathname === '/') return [{ label: 'Dashboard', href: '/' }];
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    href: '/' + segments.slice(0, i + 1).join('/'),
  }));
}

function getTitle(pathname: string) {
  const base = '/' + pathname.split('/').filter(Boolean).slice(0, 2).join('/');
  return titleMap[base] || titleMap['/' + pathname.split('/')[1]] || 'Admin';
}

export function AdminTopBar() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const title = getTitle(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        <nav className="flex items-center gap-1 text-xs text-gray-500">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              <span className={i === breadcrumbs.length - 1 ? 'text-gray-700' : ''}>
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
          <span className="text-lg">🔔</span>
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              A
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Trust Analyst</p>
            </div>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  Profile
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  Settings
                </button>
                <hr className="my-1 border-gray-100" />
                <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
