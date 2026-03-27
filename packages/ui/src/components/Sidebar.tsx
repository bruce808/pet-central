import { type ReactNode } from 'react';
import clsx from 'clsx';

export interface SidebarItem {
  label: string;
  href: string;
  icon?: ReactNode;
  active?: boolean;
  badge?: string | number;
}

export interface SidebarProps {
  items: SidebarItem[];
  children?: ReactNode;
}

export function Sidebar({ items, children }: SidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {children && <div className="border-b border-gray-200 px-4 py-4">{children}</div>}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                {item.icon && <span className="h-5 w-5 flex-shrink-0">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={clsx(
                      'ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      item.active
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
