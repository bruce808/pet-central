import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import { KioskShell } from '@/components/KioskShell';
import '@/globals.css';

export const metadata: Metadata = {
  title: 'PetCentral Kiosk',
  description: 'Browse adoptable pets near you',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="flex min-h-screen flex-col bg-white text-gray-900 antialiased">
        <Providers>
          <KioskShell>{children}</KioskShell>
        </Providers>
      </body>
    </html>
  );
}
