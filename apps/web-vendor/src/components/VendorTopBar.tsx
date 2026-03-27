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

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const crumbs: { label: string; href: string }[] = [
    { label: 'Dashboard', href: '/' },
  ];
  if (pathname === '/') return crumbs;

  const segments = pathname.split('/').filter(Boolean);
  let path = '';
  for (const seg of segments) {
    path += `/${seg}`;
    const title = pageTitles[path];
    if (title) {
      crumbs.push({ label: title, href: path });
    } else if (seg !== 'auth') {
      crumbs.push({ label: seg === 'edit' ? 'Edit Listing' : seg, href: path });
    }
  }
  return crumbs;
}

export function VendorTopBar() {
  const pathname = usePathname();

  if (pathname.startsWith('/auth')) return null;

  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-xl px-8 shadow-sm">
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-semibold text-gray-900">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-gray-500 transition-colors hover:text-gray-700">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative rounded-full bg-gray-50 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span className="absolute right-1 top-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        </button>

        <div className="h-6 w-px bg-gray-200" />

        <div className="group relative">
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-full p-1.5 transition-colors hover:bg-gray-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-sm font-semibold text-white">
              V
            </div>
            <span className="hidden text-sm font-medium text-gray-700 sm:block">Vendor User</span>
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <div className="invisible absolute right-0 top-full mt-2 w-56 rounded-[16px] border border-gray-100 bg-white py-2 opacity-0 shadow-card-lg transition-all duration-150 animate-scale-in group-hover:visible group-hover:opacity-100">
            <div className="px-4 py-2 border-b border-gray-100 mb-1">
              <p className="text-sm font-semibold text-gray-900">Vendor User</p>
              <p className="text-xs text-gray-500">vendor@petcentral.com</p>
            </div>
            <Link
              href="/organization"
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Organization Settings
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
