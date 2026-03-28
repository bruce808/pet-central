'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { VendorSidebar } from './VendorSidebar';
import { VendorTopBar } from './VendorTopBar';

export function VendorShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname.startsWith('/auth');

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <VendorSidebar />
      <div className="flex flex-1 flex-col pl-0 lg:pl-64">
        <VendorTopBar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
