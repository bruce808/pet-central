'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button } from '@pet-central/ui';
import { auth } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: () => auth.login({ email, password }),
    onSuccess: () => router.push('/'),
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    loginMutation.mutate();
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Brand */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-600 to-brand-700 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-brand-400/20 blur-3xl" />
        <div className="relative z-10">
          <span className="text-2xl font-extrabold tracking-tight text-white">PetCentral</span>
          <span className="ml-2 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white/90">Vendor</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight text-white text-balance">
            Manage your listings with confidence
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-brand-100">
            The trusted marketplace for shelters, breeders, and rescues to connect pets with loving families.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">10k+</p>
            <p className="text-sm text-brand-200">Active Listings</p>
          </div>
          <div className="h-10 w-px bg-brand-400/40" />
          <div className="text-center">
            <p className="text-3xl font-bold text-white">500+</p>
            <p className="text-sm text-brand-200">Verified Vendors</p>
          </div>
          <div className="h-10 w-px bg-brand-400/40" />
          <div className="text-center">
            <p className="text-3xl font-bold text-white">98%</p>
            <p className="text-sm text-brand-200">Satisfaction</p>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-lg font-bold text-white lg:hidden mx-auto">
              PC
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Sign in to manage your organization
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-[10px] bg-red-50 border border-red-100 p-3.5 text-sm text-red-600">
                {error}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full rounded-[10px] bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-brand-700 hover:to-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {loginMutation.isPending ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/register"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Register your organization
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
