import type { Metadata } from 'next';
import { type ReactNode } from 'react';
import '@/globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'PetCentral — Find Your Perfect Pet from Trusted Sources',
  description:
    'Discover your perfect pet from verified breeders, trusted shelters, and rescue organizations. AI-powered guidance, real reviews, and safe communication.',
  openGraph: {
    title: 'PetCentral — Find Your Perfect Pet from Trusted Sources',
    description:
      'Connect with verified breeders, trusted shelters, and rescue organizations.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="flex min-h-screen flex-col bg-white text-gray-900 antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
