import type { Metadata } from 'next';
import '@/globals.css';
import { Providers } from './providers';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminTopBar } from '@/components/AdminTopBar';

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
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Providers>
          <AdminSidebar />
          <div className="md:pl-64">
            <AdminTopBar />
            <main className="p-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
