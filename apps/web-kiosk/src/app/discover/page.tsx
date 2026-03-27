'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, LoadingSpinner } from '@pet-central/ui';
import Link from 'next/link';
import { listings } from '@/lib/api';
import { trackActivity, updateSession } from '@/lib/kiosk-session';

const PET_TYPES = [
  {
    value: 'DOG',
    label: 'Dogs',
    gradient: 'from-amber-100 to-amber-50',
    iconColor: 'text-amber-600',
    Icon: DogIcon,
  },
  {
    value: 'CAT',
    label: 'Cats',
    gradient: 'from-blue-100 to-blue-50',
    iconColor: 'text-blue-600',
    Icon: CatIcon,
  },
  {
    value: 'BIRD',
    label: 'Birds',
    gradient: 'from-green-100 to-green-50',
    iconColor: 'text-green-600',
    Icon: BirdIcon,
  },
  {
    value: 'RABBIT',
    label: 'Rabbits',
    gradient: 'from-pink-100 to-pink-50',
    iconColor: 'text-pink-600',
    Icon: RabbitIcon,
  },
  {
    value: 'REPTILE',
    label: 'Reptiles',
    gradient: 'from-emerald-100 to-emerald-50',
    iconColor: 'text-emerald-600',
    Icon: ReptileIcon,
  },
];

const SIZES = [
  { value: 'SMALL', label: 'Small' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LARGE', label: 'Large' },
];

const TEMPERAMENTS = [
  { value: 'calm', label: 'Calm & Gentle' },
  { value: 'playful', label: 'Playful & Energetic' },
  { value: 'independent', label: 'Independent' },
  { value: 'social', label: 'Social & Friendly' },
];

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><LoadingSpinner /></div>}>
      <DiscoverContent />
    </Suspense>
  );
}

function DiscoverContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || '';

  const [step, setStep] = useState(initialType ? 2 : 1);
  const [petType, setPetType] = useState(initialType);
  const [size, setSize] = useState('');
  const [temperament, setTemperament] = useState('');

  const showResults = step === 3;

  const query = useQuery({
    queryKey: ['kiosk', 'discover', petType, size, temperament],
    queryFn: () => {
      const params: Record<string, unknown> = { petType };
      if (size) params.size = size;
      if (temperament) params.temperament = temperament;
      return listings.search(params as never);
    },
    enabled: showResults && !!petType,
  });

  const results = (query.data?.items ?? []) as unknown as Record<string, unknown>[];

  const handleSelectType = useCallback((type: string) => {
    setPetType(type);
    setStep(2);
    trackActivity();
  }, []);

  const handleSearch = useCallback(() => {
    setStep(3);
    updateSession({ searchQuery: `${petType} ${size} ${temperament}`.trim() });
    trackActivity();
  }, [petType, size, temperament]);

  const handleStartOver = useCallback(() => {
    setPetType('');
    setSize('');
    setTemperament('');
    setStep(1);
    trackActivity();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between animate-fade-in">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-gray-900">
          Discover Pets
        </h2>
        <button
          onClick={handleStartOver}
          className="flex min-h-[48px] items-center gap-2 rounded-pill border border-gray-200 bg-white px-5 py-2.5 text-lg font-medium text-gray-600 shadow-sm transition-all hover:border-brand-200 hover:bg-brand-50"
        >
          <RefreshIcon className="h-5 w-5" />
          Start Over
        </button>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2.5 flex-1 rounded-pill transition-all duration-500 ${
              s <= step ? 'bg-brand-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="animate-fade-in-up">
          <h3 className="mb-6 text-xl font-semibold text-gray-700">
            What kind of pet are you looking for?
          </h3>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
            {PET_TYPES.map((pt) => (
              <button
                key={pt.value}
                onClick={() => handleSelectType(pt.value)}
                className={`group flex min-h-[140px] flex-col items-center justify-center overflow-hidden rounded-card shadow-card transition-all duration-card hover:-translate-y-0.5 hover:shadow-card-hover ${
                  petType === pt.value
                    ? 'ring-2 ring-brand-500 ring-offset-2'
                    : ''
                } bg-gradient-to-br ${pt.gradient}`}
              >
                <div className={`${pt.iconColor} transition-transform duration-500 group-hover:scale-105`}>
                  <pt.Icon className="h-14 w-14" />
                </div>
                <span className="mt-3 text-lg font-semibold text-gray-900">
                  {pt.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8 animate-fade-in-up">
          <div>
            <h3 className="mb-4 text-xl font-semibold text-gray-700">
              Any size preference?
            </h3>
            <div className="flex flex-wrap gap-3">
              {SIZES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => { setSize(size === s.value ? '' : s.value); trackActivity(); }}
                  className={`min-h-[60px] rounded-pill border-2 px-8 py-3 text-lg font-medium shadow-sm transition-all duration-card hover:-translate-y-0.5 hover:shadow-card ${
                    size === s.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-card'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xl font-semibold text-gray-700">
              What temperament do you prefer?
            </h3>
            <div className="flex flex-wrap gap-3">
              {TEMPERAMENTS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setTemperament(temperament === t.value ? '' : t.value); trackActivity(); }}
                  className={`min-h-[60px] rounded-pill border-2 px-8 py-3 text-lg font-medium shadow-sm transition-all duration-card hover:-translate-y-0.5 hover:shadow-card ${
                    temperament === t.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-card'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="flex min-h-[60px] items-center gap-2 rounded-button bg-gradient-to-r from-brand-600 to-brand-700 px-10 py-4 text-xl font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            <SearchIcon className="h-5 w-5" />
            Show Results
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-in-up">
          <h3 className="mb-6 text-xl font-semibold text-gray-700">
            Pets matching your preferences
          </h3>

          {query.isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="mb-5 rounded-2xl bg-brand-50 p-4">
                <PawIcon className="h-12 w-12 text-brand-400" />
              </div>
              <p className="text-2xl font-semibold text-gray-700">
                No pets found matching your criteria
              </p>
              <p className="mt-2 text-base text-gray-500">
                Try adjusting your filters or exploring a different pet type
              </p>
              <button
                onClick={handleStartOver}
                className="mt-6 flex min-h-[48px] items-center gap-2 rounded-pill border border-gray-200 bg-white px-6 py-3 text-lg font-medium text-gray-600 shadow-sm transition-all hover:border-brand-200 hover:bg-brand-50"
              >
                <RefreshIcon className="h-5 w-5" />
                Try Different Preferences
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((listing) => {
                const pet = (listing.pet ?? listing) as unknown as Record<string, unknown>;
                return (
                  <Link key={String(listing.id)} href={`/listings/${String(listing.id)}`} className="group">
                    <div className="overflow-hidden rounded-card border border-gray-100 shadow-card transition-all duration-card hover:-translate-y-0.5 hover:shadow-card-hover">
                      <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-brand-50 to-purple-50">
                        {pet.photoUrl ? (
                          <img
                            src={String(pet.photoUrl)}
                            alt={String(pet.name ?? 'Pet')}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <PawIcon className="h-16 w-16 text-brand-200" />
                          </div>
                        )}
                      </div>
                      <div className="bg-white p-5">
                        <div className="flex items-start justify-between">
                          <h4 className="text-xl font-bold tracking-tight text-gray-900">
                            {String(pet.name ?? 'Unknown')}
                          </h4>
                          {listing.isVerified ? (
                            <span className="flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                              <ShieldCheckIcon className="h-3 w-3" /> Verified
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-base leading-relaxed text-gray-500">
                          {String(pet.breed ?? '')} · {String(pet.age ?? '')} · {String(pet.sex ?? '')}
                        </p>
                        {listing.organizationName ? (
                          <p className="mt-2 flex items-center gap-1 text-sm text-gray-400">
                            <MapPinIcon className="h-3.5 w-3.5" />
                            {String(listing.organizationName)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
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

function RabbitIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="currentColor">
      <path d="M32 28c-8 0-16 6-16 16 0 8 6 14 16 14s16-6 16-14c0-10-8-16-16-16zm-4 18a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-1 4h-6a1 1 0 0 1 0-2h6a1 1 0 0 1 0 2zM24 6c-1.5 0-3 1-3.5 2.5l-4 16c-.5 2 1 3.5 3 3.5 1.5 0 3-1 3.5-2.5l4-16c.5-2-1-3.5-3-3.5zm16 0c1.5 0 3 1 3.5 2.5l4 16c.5 2-1 3.5-3 3.5-1.5 0-3-1-3.5-2.5l-4-16c-.5-2 1-3.5 3-3.5z" />
    </svg>
  );
}

function ReptileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="currentColor">
      <path d="M56 24c-2-2-5-3-8-3-2 0-4 .5-5.5 1.5C40 20 36 18 32 18s-8 2-10.5 4.5C20 21.5 18 21 16 21c-3 0-6 1-8 3-3 3-3 7-1 10l4 6c2 3 5 5 9 6v6c0 2.2 1.8 4 4 4h16c2.2 0 4-1.8 4-4v-6c4-1 7-3 9-6l4-6c2-3 2-7-1-10zM24 34a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm16 0a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm-4 6H28a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2z" />
    </svg>
  );
}

function PawIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.35 3c1.1 0 2 1.2 2 2.7s-.9 2.7-2 2.7-2-1.2-2-2.7.9-2.7 2-2.7zm7.3 0c1.1 0 2 1.2 2 2.7s-.9 2.7-2 2.7-2-1.2-2-2.7.9-2.7 2-2.7zm-10.6 5.7c1.1 0 2 1 2 2.3s-.9 2.3-2 2.3-2-1-2-2.3.9-2.3 2-2.3zm13.9 0c1.1 0 2 1 2 2.3s-.9 2.3-2 2.3-2-1-2-2.3.9-2.3 2-2.3zM12 12.5c2.3 0 4.2 1.5 4.2 3.4 0 2.3-1.5 4.6-4.2 4.6s-4.2-2.3-4.2-4.6c0-1.9 1.9-3.4 4.2-3.4z" />
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

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}
