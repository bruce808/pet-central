'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Input } from '@pet-central/ui';
import { auth } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function PartnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: () => auth.login({ email, password }),
    onSuccess: () => {
      router.push('/');
    },
    onError: (err: Error) => {
      setError(err.message || 'Login failed. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate();
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - gradient branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 to-brand-700 p-12 lg:flex">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-32 right-12 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-40 w-40 rounded-full bg-brand-300/15 blur-2xl" />

        <div className="relative z-10">
          <span className="text-2xl font-extrabold tracking-tight text-white">PetCentral</span>
          <span className="ml-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white/90">
            Partner
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold tracking-tight text-white text-balance">
            Partner Portal
          </h1>
          <p className="mt-4 text-lg text-brand-100/90 leading-relaxed">
            Trusted partners helping build a safer marketplace for pets and their families.
          </p>
          <div className="mt-8 flex gap-6">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3">
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-xs text-brand-100/80">Cases Resolved</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3">
              <p className="text-2xl font-bold text-white">98%</p>
              <p className="text-xs text-brand-100/80">Satisfaction Rate</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3">
              <p className="text-2xl font-bold text-white">24h</p>
              <p className="text-xs text-brand-100/80">Avg Response</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-brand-200/60">
          &copy; {new Date().getFullYear()} PetCentral. All rights reserved.
        </p>
      </div>

      {/* Right panel - login form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <span className="text-xl font-extrabold text-brand-600">PetCentral</span>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                Partner
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              Access your partner dashboard and manage cases
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-[10px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                {error}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@partner-org.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <Button
              type="submit"
              variant="primary"
              loading={loginMutation.isPending}
              disabled={!email || !password}
              className="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:shadow-card-hover rounded-[10px]"
            >
              Sign In
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Authorized partners only &middot; PetCentral Partner Portal
          </p>
        </div>
      </div>
    </div>
  );
}
