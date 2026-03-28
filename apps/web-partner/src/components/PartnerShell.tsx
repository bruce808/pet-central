'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { PartnerSidebar } from './PartnerSidebar';
import { PartnerTopBar } from './PartnerTopBar';

export function PartnerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname.startsWith('/auth');

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <>
      <PartnerSidebar />
      <div className="md:pl-64">
        <PartnerTopBar />
        <main className="p-8">{children}</main>
      </div>
    </>
  );
}
