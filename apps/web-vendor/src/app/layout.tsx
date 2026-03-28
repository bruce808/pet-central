import type { Metadata } from 'next';
import { type ReactNode } from 'react';
import '@/globals.css';
import { Providers } from './providers';
import { VendorSidebar } from '@/components/VendorSidebar';
import { VendorTopBar } from '@/components/VendorTopBar';
import { VendorShell } from '@/components/VendorShell';

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
          <VendorShell>{children}</VendorShell>
        </Providers>
      </body>
    </html>
  );
}
