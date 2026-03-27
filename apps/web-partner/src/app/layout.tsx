import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import { PartnerSidebar } from '@/components/PartnerSidebar';
import { PartnerTopBar } from '@/components/PartnerTopBar';
import '@/globals.css';

export const metadata: Metadata = {
  title: 'PetCentral Partner Portal',
  description: 'Partner portal for PetCentral ecosystem',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-surface-muted text-gray-900 antialiased">
        <Providers>
          <PartnerSidebar />
          <div className="md:pl-64">
            <PartnerTopBar />
            <main className="p-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
