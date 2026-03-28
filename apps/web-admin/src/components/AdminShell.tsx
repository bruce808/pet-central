'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname.startsWith('/auth');

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <>
      <AdminSidebar />
      <div className="md:pl-64">
        <AdminTopBar />
        <main className="p-8">{children}</main>
      </div>
    </>
  );
}
