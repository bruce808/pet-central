'use client';

import { type ReactNode, useState } from 'react';
import clsx from 'clsx';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
  content: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  variant?: 'underline' | 'pills' | 'contained';
  size?: 'sm' | 'md';
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export function Tabs({
  tabs,
  defaultTab,
  variant = 'underline',
  size = 'md',
  className,
  onTabChange,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={className}>
      <div
        role="tablist"
        className={clsx(
          'flex',
          variant === 'underline' && 'border-b border-gray-200 gap-0',
          variant === 'pills' && 'gap-1 rounded-xl bg-gray-100 p-1',
          variant === 'contained' && 'gap-0 rounded-xl bg-gray-100 p-1',
        )}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(tab.id)}
              className={clsx(
                'inline-flex items-center gap-1.5 font-medium transition-all whitespace-nowrap',
                size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm',
                variant === 'underline' && [
                  'border-b-2 -mb-px',
                  isActive
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                ],
                variant === 'pills' && [
                  'rounded-lg',
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                ],
                variant === 'contained' && [
                  'rounded-lg flex-1 justify-center',
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                ],
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={clsx(
                    'inline-flex items-center justify-center rounded-full text-xs font-medium',
                    isActive
                      ? 'bg-brand-100 text-brand-700 min-w-[20px] h-5 px-1.5'
                      : 'bg-gray-200 text-gray-600 min-w-[20px] h-5 px-1.5',
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="mt-4 animate-fade-in">
        {activeContent}
      </div>
    </div>
  );
}
