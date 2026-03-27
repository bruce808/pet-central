'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@pet-central/ui';
import { auth } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    termsAccepted: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!form.termsAccepted) {
      setError('You must accept the terms of service');
      return;
    }

    setLoading(true);
    try {
      await auth.register({
        email: form.email,
        password: form.password,
        displayName: form.displayName,
        captchaToken: 'placeholder',
      });
      router.push('/auth/verify-email?registered=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <span className="text-4xl">🐾</span>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-sm text-gray-500">
            Join PetCentral and find your perfect pet
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Input
            label="Display Name"
            name="displayName"
            placeholder="Your name"
            value={form.displayName}
            onChange={(e) => update('displayName', e.target.value)}
            required
          />

          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Create a strong password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
            required
          />

          {/* CAPTCHA placeholder */}
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">
            CAPTCHA verification will go here
          </div>

          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={form.termsAccepted}
              onChange={(e) => update('termsAccepted', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-600">
              I agree to the{' '}
              <a href="#" className="text-brand-600 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-brand-600 hover:underline">Privacy Policy</a>
            </span>
          </label>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-brand-600 hover:text-brand-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
