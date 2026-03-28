import type { Metadata } from 'next';
import '@/globals.css';
import { Providers } from './providers';
import { AdminShell } from '@/components/AdminShell';

export const metadata: Metadata = {
  title: 'PetCentral Admin',
  description: 'Internal admin portal for PetCentral trust, moderation, and operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-surface-muted text-gray-900 antialiased">
        <Providers>
          <AdminShell>{children}</AdminShell>
        </Providers>
      </body>
    </html>
  );
}
