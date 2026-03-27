'use client';

import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { trackActivity, isExpired, resetSession, initSession } from '@/lib/kiosk-session';

const INACTIVITY_CHECK_INTERVAL = 5_000;
const WARNING_BEFORE_RESET_MS = 10_000;
const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000;

const PARTNER_LOGO = process.env.NEXT_PUBLIC_KIOSK_LOGO || '';
const WELCOME_MESSAGE =
  process.env.NEXT_PUBLIC_KIOSK_WELCOME || 'Welcome to PetCentral';
const CHANNEL_ORIGIN_ID = process.env.NEXT_PUBLIC_CHANNEL_ORIGIN_ID || 'kiosk-default';

export function KioskShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showWarning, setShowWarning] = useState(false);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initSession(CHANNEL_ORIGIN_ID);
  }, []);

  const handleActivity = useCallback(() => {
    trackActivity();
    if (showWarning) {
      setShowWarning(false);
      if (warningTimer.current) {
        clearTimeout(warningTimer.current);
        warningTimer.current = null;
      }
    }
  }, [showWarning]);

  useEffect(() => {
    const events = ['touchstart', 'mousedown', 'keydown', 'scroll'] as const;
    events.forEach((evt) => window.addEventListener(evt, handleActivity));
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [handleActivity]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isExpired(INACTIVITY_TIMEOUT_MS) && !showWarning) {
        setShowWarning(true);
        warningTimer.current = setTimeout(() => {
          resetSession();
          initSession(CHANNEL_ORIGIN_ID);
          router.push('/');
          setShowWarning(false);
        }, WARNING_BEFORE_RESET_MS);
      }
    }, INACTIVITY_CHECK_INTERVAL);

    return () => {
      clearInterval(interval);
      if (warningTimer.current) clearTimeout(warningTimer.current);
    };
  }, [showWarning, router]);

  const navItems = [
    { label: 'Home', href: '/', icon: HomeIcon },
    { label: 'Discover', href: '/discover', icon: SearchIcon },
    { label: 'AI Guide', href: '/ai-guide', icon: SparklesIcon },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-30 bg-gradient-to-r from-brand-600 to-brand-700 shadow-lg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -left-10 top-4 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
        </div>
        <div className="relative flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {PARTNER_LOGO ? (
              <img src={PARTNER_LOGO} alt="Partner" className="h-10 w-auto" />
            ) : (
              <span className="font-heading text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                PetCentral
              </span>
            )}
            <span className="hidden text-lg font-medium text-white/80 sm:block">
              {WELCOME_MESSAGE}
            </span>
          </div>
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-[48px] items-center gap-2 rounded-pill px-5 py-2.5 text-lg font-medium transition-all duration-button ${
                    isActive
                      ? 'bg-white text-brand-700 shadow-card font-semibold'
                      : 'bg-white/20 text-white/90 hover:bg-white/30'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 bg-gradient-to-b from-brand-50/30 via-white to-white">
        <div className="p-6">{children}</div>
      </main>

      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 max-w-md animate-scale-in rounded-card border border-gray-100 bg-white p-10 text-center shadow-modal">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <ClockIcon className="h-8 w-8 text-amber-500" />
            </div>
            <p className="font-heading text-3xl font-bold tracking-tight text-gray-900">
              Session ending...
            </p>
            <p className="mt-3 text-lg leading-relaxed text-gray-500">
              Touch the screen to continue browsing
            </p>
            <div className="mt-6 h-2.5 overflow-hidden rounded-pill bg-gray-100">
              <div
                className="h-full rounded-pill bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
                style={{
                  animation: `shrink ${WARNING_BEFORE_RESET_MS}ms linear forwards`,
                }}
              />
            </div>
            <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
          </div>
        </div>
      )}
    </div>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}
