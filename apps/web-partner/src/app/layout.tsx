import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import { PartnerShell } from '@/components/PartnerShell';
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
          <PartnerShell>{children}</PartnerShell>
        </Providers>
      </body>
    </html>
  );
}
