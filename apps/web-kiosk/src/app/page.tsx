'use client';

import Link from 'next/link';

const petTypes = [
  {
    label: 'Find a Dog',
    href: '/discover?type=DOG',
    gradient: 'bg-gradient-to-br from-amber-100 to-amber-50',
    hoverGradient: 'hover:from-amber-200 hover:to-amber-100',
    iconColor: 'text-amber-600',
    Icon: DogIcon,
  },
  {
    label: 'Find a Cat',
    href: '/discover?type=CAT',
    gradient: 'bg-gradient-to-br from-blue-100 to-blue-50',
    hoverGradient: 'hover:from-blue-200 hover:to-blue-100',
    iconColor: 'text-blue-600',
    Icon: CatIcon,
  },
  {
    label: 'Find a Bird',
    href: '/discover?type=BIRD',
    gradient: 'bg-gradient-to-br from-green-100 to-green-50',
    hoverGradient: 'hover:from-green-200 hover:to-green-100',
    iconColor: 'text-green-600',
    Icon: BirdIcon,
  },
];

export default function KioskHomePage() {
  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden">
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
                <pet.Icon className="h-20 w-20" />
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

function DogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="currentColor">
      <path d="M52 14c-2-4-6-6-8-6-1 0-2 .5-2.5 1.5L38 16h-12l-3.5-6.5C22 8.5 21 8 20 8c-2 0-6 2-8 6-2 3.5-2 7-.5 9l3.5 5v8c0 6 4 12 8 15v5c0 2.2 1.8 4 4 4h10c2.2 0 4-1.8 4-4v-5c4-3 8-9 8-15v-8l3.5-5c1.5-2 1.5-5.5-.5-9zM24 32a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm16 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm-4 8h-8a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2z" />
    </svg>
  );
}

function CatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="currentColor">
      <path d="M48 8l-6 14h-2c-1-4-5-8-8-8s-7 4-8 8h-2L16 8c-1-2-4-1-4 1v12c0 2 .5 4 1.5 5.5C11 29 10 32 10 36c0 10 8 18 22 20 14-2 22-10 22-20 0-4-1-7-3.5-9.5C51.5 25 52 23 52 21V9c0-2-3-3-4-1zM25 34a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm14 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm-4 6c-1.5 1.5-5.5 1.5-7 0a1 1 0 0 1 1.5-1.5c.8.8 3.2.8 4 0a1 1 0 0 1 1.5 1.5z" />
    </svg>
  );
}

function BirdIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="currentColor">
      <path d="M50 18c-2-6-8-10-14-10-4 0-8 2-10.5 5L12 20c-2 .5-3 2.5-2 4l6 8-6 4c-1.5 1-1.5 3.5.5 4l16 6c2 5 7 10 14 10 10 0 16-8 16-18 0-8-3-15-7-20zm-6 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
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
