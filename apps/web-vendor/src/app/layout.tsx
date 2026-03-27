import type { Metadata } from 'next';
import { type ReactNode } from 'react';
import '@/globals.css';
import { Providers } from './providers';
import { VendorSidebar } from '@/components/VendorSidebar';
import { VendorTopBar } from '@/components/VendorTopBar';

export const metadata: Metadata = {
  title: 'PetCentral Vendor Portal',
  description:
    'Manage your organization, listings, and communication on PetCentral.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-surface-muted text-gray-900 antialiased">
        <Providers>
          <div className="flex min-h-screen">
            <VendorSidebar />
            <div className="flex flex-1 flex-col pl-0 lg:pl-64">
              <VendorTopBar />
              <main className="flex-1 p-8">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
