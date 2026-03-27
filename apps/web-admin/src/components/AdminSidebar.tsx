'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavSection {
  title: string;
  items: { label: string; href: string; icon: string }[];
}

const sections: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', href: '/', icon: '◫' }],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Cases', href: '/cases', icon: '◈' },
      { label: 'Moderation Queue', href: '/moderation', icon: '⚑' },
    ],
  },
  {
    title: 'Trust',
    items: [
      { label: 'Organizations', href: '/organizations', icon: '⏣' },
      { label: 'Partners', href: '/partners', icon: '⬡' },
      { label: 'Verifications', href: '/organizations?tab=verifications', icon: '✓' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Users', href: '/users', icon: '⦿' },
      { label: 'Reviews', href: '/moderation?tab=reviews', icon: '★' },
      { label: 'Messages', href: '/moderation?tab=messages', icon: '✉' },
    ],
  },
  {
    title: 'AI',
    items: [
      { label: 'Correspondence', href: '/ai/correspondence', icon: '⚡' },
      { label: 'Discovery', href: '/ai/discovery', icon: '◉' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Audit Log', href: '/audit-log', icon: '☰' },
      { label: 'Settings', href: '/settings', icon: '⚙' },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href.split('?')[0]!);
  };

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-3 left-3 z-50 rounded-md bg-slate-800 p-2 text-white md:hidden"
        aria-label="Toggle sidebar"
      >
        <span className="text-lg">{collapsed ? '☰' : '✕'}</span>
      </button>

      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-white transition-transform md:translate-x-0 ${
          collapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-700 px-5">
          <span className="text-xl font-bold tracking-tight text-brand-400">
            PetCentral
          </span>
          <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
            Admin
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-5">
              <h3 className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </h3>
              {section.items.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={() => setCollapsed(true)}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    isActive(item.href)
                      ? 'bg-slate-700/70 font-medium text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="w-5 text-center text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-700 px-4 py-3">
          <p className="text-xs text-slate-500">PetCentral Admin v0.0.1</p>
        </div>
      </aside>
    </>
  );
}
