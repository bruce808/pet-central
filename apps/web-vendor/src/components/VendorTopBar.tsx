'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@pet-central/ui';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/listings': 'Listings',
  '/listings/new': 'New Listing',
  '/messages': 'Messages',
  '/reviews': 'Reviews',
  '/organization': 'Organization',
  '/organization/documents': 'Documents',
  '/organization/members': 'Members',
  '/resources': 'Resources',
  '/analytics': 'Analytics',
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.match(/^\/listings\/[^/]+\/edit$/)) return 'Edit Listing';
  return 'Vendor Portal';
}

export function VendorTopBar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <div className="h-6 w-px bg-gray-200" />

        <div className="group relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100"
          >
            <Avatar name="Vendor User" size="sm" />
            <span className="text-sm font-medium text-gray-700">Vendor User</span>
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <div className="invisible absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
            <Link
              href="/organization"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Organization Settings
            </Link>
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
