'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Input } from '@pet-central/ui';
import { auth } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: () => auth.login({ email, password, mfaCode: mfaCode || undefined }),
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
      {/* Left panel — gradient branding */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-600 to-brand-700 lg:flex">
        {/* Decorative orbs */}
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-300/10 blur-2xl" />

        <div className="relative z-10 max-w-md px-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">PetCentral</span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              Admin
            </span>
          </div>
          <h2 className="mb-4 text-2xl font-bold text-white/95">Admin Portal</h2>
          <p className="text-base leading-relaxed text-brand-100">
            Trust & Safety operations center for platform moderation, verification management, and AI-powered oversight.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6">
            <div className="rounded-[16px] bg-white/10 px-4 py-5 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="mt-1 text-xs text-brand-200">Monitoring</p>
            </div>
            <div className="rounded-[16px] bg-white/10 px-4 py-5 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">AI</p>
              <p className="mt-1 text-xs text-brand-200">Powered</p>
            </div>
            <div className="rounded-[16px] bg-white/10 px-4 py-5 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">SOC2</p>
              <p className="mt-1 text-xs text-brand-200">Compliant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <span className="text-2xl font-extrabold text-brand-600">PetCentral</span>
            <span className="ml-2 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              Admin
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="mt-1.5 text-sm text-gray-500">Sign in to access the admin portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-[10px] bg-red-50 p-3.5 text-sm text-red-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                {error}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@petcentral.com"
                required
                className="w-full rounded-[10px] border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-[10px] border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">MFA Code</label>
              <input
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="6-digit code (if enabled)"
                className="w-full rounded-[10px] border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <p className="mt-1.5 text-xs text-gray-400">Enter your authenticator code if MFA is enabled</p>
            </div>
            <button
              type="submit"
              disabled={!email || !password || loginMutation.isPending}
              className="relative w-full overflow-hidden rounded-[10px] bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-brand-700 hover:to-brand-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Restricted access — Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
