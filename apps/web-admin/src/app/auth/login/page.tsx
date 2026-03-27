'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, Button, Input } from '@pet-central/ui';
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
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">PetCentral Admin</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to the admin portal</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@petcentral.com"
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
            <Input
              label="MFA Code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="6-digit code (if enabled)"
              helperText="Enter your authenticator code if MFA is enabled"
            />
            <Button
              type="submit"
              variant="primary"
              loading={loginMutation.isPending}
              disabled={!email || !password}
              className="w-full"
            >
              Sign In
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-xs text-gray-400">
          Restricted access — Authorized personnel only
        </p>
      </div>
    </div>
  );
}
