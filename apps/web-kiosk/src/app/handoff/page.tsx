'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button, Input } from '@pet-central/ui';
import Link from 'next/link';
import { handoff } from '@/lib/api';
import { getSessionState } from '@/lib/kiosk-session';

type HandoffMethod = 'qr' | 'email' | 'sms';

export default function HandoffPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-xl text-gray-400">Loading…</div>}>
      <HandoffContent />
    </Suspense>
  );
}

function HandoffContent() {
  const searchParams = useSearchParams();
  const [method, setMethod] = useState<HandoffMethod>('qr');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  const session = typeof window !== 'undefined' ? getSessionState() : null;
  const listingId = searchParams.get('listing');
  const aiConversationId = searchParams.get('ai');

  const handoffMutation = useMutation({
    mutationFn: (m: HandoffMethod) => {
      const destination = m === 'email' ? email : m === 'sms' ? phone : undefined;
      return handoff.create({
        kioskSessionId: session?.sessionId ?? '',
        method: m,
        destination,
        savedState: {
          searchQuery: session?.searchQuery,
          viewedListingIds: session?.viewedListingIds ?? [],
          aiConversationId: aiConversationId ?? session?.aiConversationId,
          channelOriginId: session?.channelOriginId ?? '',
        },
      });
    },
    onSuccess: (data) => {
      const response = data as unknown as Record<string, unknown>;
      if (response.handoffUrl) {
        setQrUrl(String(response.handoffUrl));
      }
      setSent(true);
    },
  });

  useEffect(() => {
    if (method === 'qr') {
      handoffMutation.mutate('qr');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  useEffect(() => {
    if (!sent) return;
    const timer = setTimeout(() => {
      window.location.href = '/';
    }, 10_000);
    return () => clearTimeout(timer);
  }, [sent]);

  const summary = [
    session?.viewedListingIds?.length
      ? `${session.viewedListingIds.length} viewed listing${session.viewedListingIds.length > 1 ? 's' : ''}`
      : null,
    session?.searchQuery ? 'Search preferences' : null,
    session?.aiConversationId || aiConversationId ? 'AI conversation' : null,
    listingId ? 'Current pet listing' : null,
  ].filter(Boolean);

  if (sent && method !== 'qr') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center animate-fade-in-up">
        <div className="animate-scale-in rounded-full bg-gradient-to-br from-brand-100 to-brand-200 p-6">
          <CheckCircleIcon className="h-16 w-16 text-brand-600" />
        </div>
        <h2 className="mt-6 font-heading text-4xl font-bold tracking-tight text-gray-900">Sent!</h2>
        <p className="mt-3 text-xl leading-relaxed text-gray-500">
          Check your {method === 'email' ? 'email' : 'phone'} to continue
        </p>
        <p className="mt-6 text-base text-gray-400">
          Returning to home screen in 10 seconds…
        </p>
        <Link href="/" className="mt-4">
          <button className="flex min-h-[48px] items-center gap-2 rounded-pill border border-gray-200 bg-white px-6 py-3 text-lg font-medium text-gray-600 shadow-sm transition-all hover:border-brand-200 hover:bg-brand-50">
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Browsing
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-2xl space-y-8 animate-fade-in-up">
      {/* Top gradient decoration */}
      <div className="pointer-events-none absolute -top-20 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-brand-100/40 blur-3xl" />

      <div className="relative text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50 p-5">
          <PhoneIcon className="h-10 w-10 text-brand-600" />
        </div>
        <h2 className="font-heading text-3xl font-bold tracking-tight text-gray-900">
          Continue on Your Phone
        </h2>
        <p className="mt-2 text-base leading-relaxed text-gray-500">
          Take your browsing session with you
        </p>
      </div>

      {summary.length > 0 && (
        <div className="rounded-card border border-gray-100 bg-white p-5 shadow-card">
          <h3 className="mb-3 font-heading text-lg font-semibold text-gray-900">
            What will be saved:
          </h3>
          <ul className="space-y-2">
            {summary.map((item) => (
              <li key={item} className="flex items-center gap-3 text-base text-gray-600">
                <CheckIcon className="h-5 w-5 flex-shrink-0 text-brand-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Method selector */}
      <div className="flex justify-center gap-2">
        {(['qr', 'email', 'sms'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMethod(m); setSent(false); }}
            className={`min-h-[60px] rounded-pill px-8 py-3 text-lg font-medium shadow-sm transition-all duration-card ${
              method === m
                ? 'bg-brand-600 text-white shadow-card'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50'
            }`}
          >
            {m === 'qr' ? 'QR Code' : m === 'email' ? 'Email' : 'SMS'}
          </button>
        ))}
      </div>

      {method === 'qr' && (
        <div className="rounded-card border border-gray-100 bg-white p-8 shadow-card-lg">
          <div className="flex flex-col items-center">
            <div className="flex h-64 w-64 items-center justify-center overflow-hidden rounded-2xl border-2 border-gray-100 bg-white">
              {qrUrl ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrUrl)}`}
                  alt="QR Code"
                  className="h-60 w-60"
                />
              ) : (
                <div className="flex flex-col items-center text-center text-gray-400">
                  <QrIcon className="h-16 w-16 text-gray-300" />
                  <p className="mt-2 text-base">Loading QR code…</p>
                </div>
              )}
            </div>
            <p className="mt-5 text-lg font-medium text-gray-600">
              Scan with your phone camera
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Point your camera at the code above
            </p>
          </div>
        </div>
      )}

      {method === 'email' && (
        <div className="rounded-card border border-gray-100 bg-white p-8 shadow-card-lg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handoffMutation.mutate('email');
            }}
            className="space-y-5"
          >
            <Input
              label="Your Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
            <button
              type="submit"
              disabled={!email || handoffMutation.isPending}
              className="flex w-full min-h-[60px] items-center justify-center gap-2 rounded-button bg-gradient-to-r from-brand-600 to-brand-700 text-xl font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
            >
              {handoffMutation.isPending ? 'Sending…' : 'Send to Email'}
            </button>
          </form>
        </div>
      )}

      {method === 'sms' && (
        <div className="rounded-card border border-gray-100 bg-white p-8 shadow-card-lg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handoffMutation.mutate('sms');
            }}
            className="space-y-5"
          >
            <Input
              label="Your Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              required
            />
            <button
              type="submit"
              disabled={!phone || handoffMutation.isPending}
              className="flex w-full min-h-[60px] items-center justify-center gap-2 rounded-button bg-gradient-to-r from-brand-600 to-brand-700 text-xl font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
            >
              {handoffMutation.isPending ? 'Sending…' : 'Send via SMS'}
            </button>
          </form>
        </div>
      )}

      <div className="text-center">
        <Link href="/">
          <button className="flex mx-auto min-h-[48px] items-center gap-2 rounded-pill border border-gray-200 bg-white px-6 py-3 text-lg font-medium text-gray-600 shadow-sm transition-all hover:border-brand-200 hover:bg-brand-50">
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Browsing
          </button>
        </Link>
      </div>
    </div>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function QrIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
    </svg>
  );
}
