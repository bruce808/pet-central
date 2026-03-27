import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login — PetCentral Partner Portal',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
