'use client';

import Link from 'next/link';
import { Card, Badge, TrustShield, PetImage } from '@pet-central/ui';

interface ListingCardProps {
  listing: Record<string, any>;
}

function StarRating({ score }: { score: number | null }) {
  if (score === null || score === undefined) return null;
  const numScore = typeof score === 'string' ? parseFloat(score) : score;
  if (isNaN(numScore)) return null;
  const full = Math.round(numScore);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`h-3.5 w-3.5 ${i <= full ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.28-3.957z" />
        </svg>
      ))}
      <span className="ml-0.5 text-xs text-gray-500">{numScore.toFixed(1)}</span>
    </div>
  );
}

function getImageUrl(listing: Record<string, any>): string | null {
  const media = listing.pet?.media ?? listing.media ?? [];
  const primary = media.find((m: any) => m.isPrimary);
  const first = primary ?? media[0];
  if (!first) return null;
  return first.url ?? first.storageKey ?? null;
}

export function ListingCard({ listing }: ListingCardProps) {
  const imageUrl = getImageUrl(listing);
  const org = listing.pet?.organization ?? listing.organization;
  const fee = listing.feeAmount != null ? Number(listing.feeAmount) : null;
  const adoptionType = listing.pet?.adoptionOrSaleType;
  const trustScore = listing.trustRankSnapshot != null ? Number(listing.trustRankSnapshot) : null;

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <Card padding="none" hover className="overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <PetImage
            src={imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            fallbackClassName="h-full w-full"
            fallback={
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-50 to-purple-50 text-5xl text-gray-300">
                🐾
              </div>
            }
          />
          {adoptionType === 'ADOPTION' && (
            <div className="absolute left-3 top-3">
              <Badge variant="info" size="sm">Adopt</Badge>
            </div>
          )}
          <button
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm backdrop-blur-sm transition-all hover:text-red-500 hover:shadow-md"
            aria-label="Save to favorites"
            onClick={(e) => e.preventDefault()}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-brand-600">
              {listing.title}
            </h3>
            {fee !== null && (
              <span className="shrink-0 text-sm font-bold text-brand-700">
                {fee === 0 ? 'Free' : `$${fee.toLocaleString()}`}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-gray-500">
            {listing.pet?.breedPrimary}
            {listing.pet?.ageValue
              ? ` · ${listing.pet.ageValue} ${listing.pet.ageUnit ?? 'yr'}${listing.pet.ageValue > 1 ? 's' : ''}`
              : ''}
          </p>

          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
            </svg>
            {listing.locationCity}{listing.locationRegion ? `, ${listing.locationRegion}` : ''}
          </div>

          <div className="mt-3 flex items-center justify-between">
            {org && (
              <span className="text-xs text-gray-500">{org.publicName}</span>
            )}
            {trustScore !== null && !isNaN(trustScore) && (
              <StarRating score={trustScore} />
            )}
          </div>

          {org && (
            <div className="mt-2">
              <TrustShield
                level="verified"
                label={org.organizationType?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                size="sm"
              />
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
