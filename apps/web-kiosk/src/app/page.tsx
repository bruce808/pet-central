'use client';

import Link from 'next/link';

const petTypes = [
  {
    label: 'Find a Dog',
    href: '/discover?type=DOG',
    gradient: 'bg-gradient-to-br from-amber-100 to-amber-50',
    hoverGradient: 'hover:from-amber-200 hover:to-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    label: 'Find a Cat',
    href: '/discover?type=CAT',
    gradient: 'bg-gradient-to-br from-blue-100 to-blue-50',
    hoverGradient: 'hover:from-blue-200 hover:to-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Find a Bird',
    href: '/discover?type=BIRD',
    gradient: 'bg-gradient-to-br from-green-100 to-green-50',
    hoverGradient: 'hover:from-green-200 hover:to-green-100',
    iconColor: 'text-green-600',
  },
];

export default function KioskHomePage() {
  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden">
      {/* Decorative blurred orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute right-1/4 top-40 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute bottom-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-purple-200/20 blur-3xl" />
      </div>

      <div className="relative z-10 mb-14 text-center animate-fade-in-up">
        <h1 className="text-balance font-heading text-6xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-brand-600 to-emerald-500 bg-clip-text text-transparent">
            Find Your Perfect Pet
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-xl leading-relaxed text-gray-500">
          Browse adoptable pets near you and meet your new best friend
        </p>
      </div>

      <div className="relative z-10 grid w-full max-w-4xl gap-6 sm:grid-cols-3 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {petTypes.map((pet) => (
          <Link key={pet.label} href={pet.href} className="group">
            <div
              className={`relative flex min-h-[220px] flex-col items-center justify-center overflow-hidden rounded-card ${pet.gradient} ${pet.hoverGradient} shadow-card transition-all duration-card hover:-translate-y-1 hover:shadow-card-hover`}
            >
              <div className={`mb-4 ${pet.iconColor} transition-transform duration-500 group-hover:scale-105`}>
                <PawIcon className="h-20 w-20" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-gray-900">
                {pet.label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="relative z-10 mt-12 flex flex-col items-center gap-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <Link
          href="/ai-guide"
          className="group flex min-h-[64px] items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 px-10 py-4 text-xl font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          <SparklesIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
          Get AI Recommendations
        </Link>
        <Link
          href="/handoff"
          className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-5 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-brand-200 hover:bg-brand-50"
        >
          <PhoneIcon className="h-4 w-4" />
          Scan QR to continue on your phone
        </Link>
      </div>
    </div>
  );
}

function PawIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.35 3c1.1 0 2 1.2 2 2.7s-.9 2.7-2 2.7-2-1.2-2-2.7.9-2.7 2-2.7zm7.3 0c1.1 0 2 1.2 2 2.7s-.9 2.7-2 2.7-2-1.2-2-2.7.9-2.7 2-2.7zm-10.6 5.7c1.1 0 2 1 2 2.3s-.9 2.3-2 2.3-2-1-2-2.3.9-2.3 2-2.3zm13.9 0c1.1 0 2 1 2 2.3s-.9 2.3-2 2.3-2-1-2-2.3.9-2.3 2-2.3zM12 12.5c2.3 0 4.2 1.5 4.2 3.4 0 2.3-1.5 4.6-4.2 4.6s-4.2-2.3-4.2-4.6c0-1.9 1.9-3.4 4.2-3.4z" />
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

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  );
}
