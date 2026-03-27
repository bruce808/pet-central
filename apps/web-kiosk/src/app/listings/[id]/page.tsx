'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, LoadingSpinner } from '@pet-central/ui';
import Link from 'next/link';
import { listings } from '@/lib/api';
import { trackViewedListing } from '@/lib/kiosk-session';

export default function KioskListingDetailPage() {
  const { id } = useParams<{ id: string }>();

  const query = useQuery({
    queryKey: ['kiosk', 'listings', id],
    queryFn: () => listings.getById(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (id) trackViewedListing(id);
  }, [id]);

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const listing = (query.data ?? {}) as unknown as Record<string, unknown>;
  const pet = (listing.pet ?? listing) as unknown as Record<string, unknown>;
  const org = listing.organization as Record<string, unknown> | undefined;
  const orgName = String(org?.publicName ?? listing.organizationName ?? 'Organization');
  const media = (listing.media ?? pet.media ?? []) as Array<Record<string, unknown>>;
  const primaryImage = media.length > 0 && media[0] ? String(media[0].url) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Link href="/discover">
          <button className="flex min-h-[48px] items-center gap-2 rounded-pill border border-gray-200 bg-white px-5 py-2.5 text-lg font-medium text-gray-600 shadow-sm transition-all hover:border-brand-200 hover:bg-brand-50">
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Results
          </button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-card shadow-card">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={String(pet.name ?? 'Pet')}
              className="h-full min-h-[400px] w-full object-cover"
            />
          ) : (
            <div className="flex min-h-[400px] items-center justify-center bg-gradient-to-br from-brand-50 to-purple-50">
              <PawIcon className="h-24 w-24 text-brand-200" />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-gray-900">
              {String(pet.name ?? 'Unknown')}
            </h1>
            <p className="mt-2 text-xl leading-relaxed text-gray-500">
              {String(pet.breedPrimary ?? pet.breed ?? '')}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {pet.ageValue ? (
              <span className="rounded-pill bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
                {String(pet.ageValue)} {String(pet.ageUnit ?? 'yrs')}
              </span>
            ) : null}
            {pet.sex ? (
              <span className="rounded-pill bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700">
                {String(pet.sex)}
              </span>
            ) : null}
            {pet.sizeCategory ? (
              <span className="rounded-pill bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700">
                {String(pet.sizeCategory).replace('_', ' ')}
              </span>
            ) : null}
          </div>

          <div className="rounded-card border border-gray-100 bg-white p-6 shadow-card">
            <h3 className="mb-3 font-heading text-lg font-semibold text-gray-900">About</h3>
            <p className="text-base leading-relaxed text-gray-500">
              {String(pet.description ?? listing.description ?? 'No description available.').slice(0, 500)}
            </p>
          </div>

          <div className="rounded-card border border-gray-100 bg-white p-5 shadow-card">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-50">
                <BuildingIcon className="h-6 w-6 text-brand-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{orgName}</p>
                <div className="flex items-center gap-1.5">
                  <ShieldCheckIcon className="h-4 w-4 text-trust-verified" />
                  <span className="text-sm font-medium text-trust-verified">Verified</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link href={`/handoff?listing=${id}`}>
              <button className="flex w-full min-h-[60px] items-center justify-center gap-2 rounded-button bg-gradient-to-r from-brand-600 to-brand-700 text-xl font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl">
                <PhoneIcon className="h-5 w-5" />
                Continue on Your Phone
              </button>
            </Link>
            <Link href="/discover">
              <button className="flex w-full min-h-[60px] items-center justify-center gap-2 rounded-button border-2 border-gray-200 bg-white text-xl font-semibold text-gray-700 transition-all hover:border-brand-300 hover:bg-brand-50/50">
                <ArrowLeftIcon className="h-5 w-5" />
                Back to Results
              </button>
            </Link>
          </div>
        </div>
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

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
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

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
    </svg>
  );
}
