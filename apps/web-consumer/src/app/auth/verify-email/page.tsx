'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, LoadingSpinner } from '@pet-central/ui';
import { auth } from '@/lib/api';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const justRegistered = searchParams.get('registered') === '1';

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    setStatus('loading');
    auth
      .verifyEmail({ token })
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verification failed');
      });
  }, [token]);

  if (justRegistered && !token) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-3xl">
            ✉️
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Check your email</h1>
          <p className="mt-3 text-gray-500">
            We&apos;ve sent a verification link to your email address.
            Click it to activate your account.
          </p>
          <Link href="/auth/login" className="mt-6 inline-block">
            <Button variant="outline">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        {status === 'loading' && (
          <>
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-500">Verifying your email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">
              ✅
            </div>
            <h1 className="mt-6 text-2xl font-bold text-gray-900">Email Verified!</h1>
            <p className="mt-3 text-gray-500">{message || 'Your account is now active.'}</p>
            <Link href="/auth/login" className="mt-6 inline-block">
              <Button>Sign In</Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
              ❌
            </div>
            <h1 className="mt-6 text-2xl font-bold text-gray-900">Verification Failed</h1>
            <p className="mt-3 text-gray-500">{message || 'The link may be expired or invalid.'}</p>
            <Link href="/auth/login" className="mt-6 inline-block">
              <Button variant="outline">Go to Login</Button>
            </Link>
          </>
        )}

        {status === 'idle' && !justRegistered && (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Email Verification</h1>
            <p className="mt-3 text-gray-500">No verification token provided.</p>
            <Link href="/" className="mt-6 inline-block">
              <Button variant="outline">Go Home</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
