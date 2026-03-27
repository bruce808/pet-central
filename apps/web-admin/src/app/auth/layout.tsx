import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login — PetCentral Admin',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">{children}</div>;
}
