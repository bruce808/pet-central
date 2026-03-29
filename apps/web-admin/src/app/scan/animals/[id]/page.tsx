'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner, Badge, StatusBadge } from '@pet-central/ui';
import { scanAnimals } from '@/lib/api';

function InfoRow({ label, value }: { label: string; value: string | null | undefined | boolean }) {
  if (value === null || value === undefined) return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  if (!display || display === '—') return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium uppercase text-gray-400 w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800">{display}</span>
    </div>
  );
}

function BoolBadge({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  const yes = value === true;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
      yes ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
    }`}>
      {yes ? '✓' : '✗'} {label}
    </span>
  );
}

export default function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [photoIdx, setPhotoIdx] = useState(0);

  const query = useQuery({
    queryKey: ['scan', 'animal', id],
    queryFn: () => scanAnimals.getById(id),
  });

  const animal = query.data as Record<string, unknown> | undefined;

  if (query.isLoading) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }
  if (!animal) {
    return <div className="py-12 text-center text-gray-500">Animal not found</div>;
  }

  const photos = (animal.photoUrlsJson ?? animal.photoUrls ?? []) as string[];
  const scan = animal.scan as Record<string, unknown> | undefined;
  const website = scan?.website as Record<string, unknown> | undefined;
  const sourcePage = animal.sourcePage as Record<string, unknown> | undefined;
  const detailPage = animal.detailPage as Record<string, unknown> | undefined;
  const animalType = String(animal.animalType ?? '').replace('SCAN_', '') || 'Unknown';
  const attrs = (animal.attributeJson ?? {}) as Record<string, unknown>;
  const adoptionRequirements = (attrs.adoptionRequirements ?? []) as Array<{ type: string; description: string; value?: string }>;
  const videoUrls = (attrs.videoUrls ?? []) as string[];

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => router.back()} className="mb-2 text-sm text-brand-600 hover:underline">
          &larr; Back
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">{String(animal.name ?? '(unnamed)')}</h2>
          <Badge variant="info">{animalType}</Badge>
          {String(animal.adoptionStatus ?? '') && <StatusBadge status={String(animal.adoptionStatus).toUpperCase()} />}
        </div>
        <p className="text-sm text-gray-500">
          From {website ? String(website.domain) : 'unknown site'}
          {String(animal.listingUrl ?? '') !== '' && (
            <> &middot; <a href={String(animal.listingUrl)} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">View original listing</a></>
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Photos */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-100 bg-white shadow-card overflow-hidden">
            {photos.length > 0 ? (
              <div className="p-3 space-y-3">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    key={photoIdx}
                    src={photos[photoIdx]}
                    alt={String(animal.name ?? 'Animal photo')}
                    className="absolute inset-0 h-full w-full object-cover z-10"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                    onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm pointer-events-none z-0">
                    No image
                  </div>
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white text-lg hover:bg-black/70 transition-colors"
                        aria-label="Previous photo"
                      >
                        &#8249;
                      </button>
                      <button
                        onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white text-lg hover:bg-black/70 transition-colors"
                        aria-label="Next photo"
                      >
                        &#8250;
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/50 px-2.5 py-0.5 text-xs text-white">
                        {photoIdx + 1} / {photos.length}
                      </div>
                    </>
                  )}
                </div>
                {photos.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {photos.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIdx(i)}
                        className={`h-14 w-14 rounded-lg overflow-hidden shrink-0 border-2 transition-colors bg-gray-100 ${
                          i === photoIdx ? 'border-brand-500' : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center bg-gray-50 text-gray-400 text-sm">
                No photos
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Details</h3>
            <InfoRow label="Name" value={String(animal.name ?? '')} />
            <InfoRow label="Animal Type" value={animalType} />
            <InfoRow label="Breed" value={animal.breed as string} />
            <InfoRow label="Secondary Breed" value={animal.secondaryBreed as string} />
            <InfoRow label="Sex" value={animal.sex as string} />
            <InfoRow label="Age" value={animal.ageText as string} />
            <InfoRow label="Age Category" value={animal.ageCategory as string} />
            <InfoRow label="Size" value={animal.size as string} />
            <InfoRow label="Color" value={animal.color as string} />
            <InfoRow label="Coat" value={animal.coat as string} />
            <InfoRow label="Adoption Status" value={animal.adoptionStatus as string} />
            <InfoRow label="Adoption Fee" value={attrs.adoptionFee as string} />
            <InfoRow label="Weight" value={attrs.weight as string} />
            <InfoRow label="Location" value={[animal.locationCity, animal.locationState].filter(Boolean).join(', ') || undefined} />
            <InfoRow label="Organization" value={animal.organizationName as string} />
            <InfoRow label="External ID" value={animal.listingExternalId as string} />
            <InfoRow label="Confidence" value={animal.confidence != null ? `${(Number(animal.confidence) * 100).toFixed(0)}%` : undefined} />
          </div>

          {/* Compatibility & Health */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Compatibility & Health</h3>
            <div className="flex flex-wrap gap-2">
              <BoolBadge label="Good with Children" value={animal.goodWithChildren} />
              <BoolBadge label="Good with Dogs" value={animal.goodWithDogs} />
              <BoolBadge label="Good with Cats" value={animal.goodWithCats} />
              <BoolBadge label="Good with Seniors" value={attrs.goodWithSeniors} />
              <BoolBadge label="House Trained" value={animal.houseTrained} />
              <BoolBadge label="Spayed/Neutered" value={animal.spayedNeutered} />
              <BoolBadge label="Vaccinated" value={animal.vaccinated} />
              <BoolBadge label="Microchipped" value={attrs.microchipped} />
              <BoolBadge label="Declawed" value={animal.declawed} />
            </div>
            {(attrs.crateTrained !== undefined || attrs.pottyTrained !== undefined || attrs.leashTrained !== undefined ||
              attrs.goodInCar !== undefined || attrs.freeRoam !== undefined || attrs.knowsBasicCommands !== undefined ||
              attrs.litterBoxTrained !== undefined) && (
              <>
                <h3 className="text-sm font-semibold text-gray-900 mt-4 mb-2">Training & Behavior</h3>
                <div className="flex flex-wrap gap-2">
                  <BoolBadge label="Crate Trained" value={attrs.crateTrained} />
                  <BoolBadge label="Potty Trained" value={attrs.pottyTrained} />
                  <BoolBadge label="Leash Trained" value={attrs.leashTrained} />
                  <BoolBadge label="Good in Car" value={attrs.goodInCar} />
                  <BoolBadge label="Free Roam" value={attrs.freeRoam} />
                  <BoolBadge label="Knows Commands" value={attrs.knowsBasicCommands} />
                  <BoolBadge label="Litter Box Trained" value={attrs.litterBoxTrained} />
                </div>
              </>
            )}
            {attrs.energyLevel ? (
              <p className="mt-3 text-sm"><span className="font-medium text-gray-500">Energy Level:</span> <span className="capitalize text-gray-800">{String(attrs.energyLevel)}</span></p>
            ) : null}
            {attrs.separationAnxiety === true && (
              <p className="mt-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-2">Has separation anxiety</p>
            )}
            {attrs.fenceRequired === true && (
              <p className="mt-2 text-sm text-blue-700 bg-blue-50 rounded-lg p-2">Fenced yard required</p>
            )}
            {String(animal.specialNeeds ?? '') && (
              <p className="mt-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                Special Needs: {String(animal.specialNeeds)}
              </p>
            )}
          </div>

          {/* Description */}
          {String(animal.description ?? '') && (
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {String(animal.description)}
              </p>
            </div>
          )}

          {/* Adoption Requirements */}
          {adoptionRequirements.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Adoption Requirements</h3>
              <ul className="space-y-2">
                {adoptionRequirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 shrink-0 text-amber-500">●</span>
                    <span className="text-gray-700">{req.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Videos */}
          {videoUrls.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Videos ({videoUrls.length})</h3>
              <div className="space-y-3">
                {videoUrls.map((url, i) => {
                  const ytMatch = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]+)/);
                  if (ytMatch) {
                    return (
                      <div key={i} className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} className="h-full w-full" allowFullScreen title={`Video ${i + 1}`} />
                      </div>
                    );
                  }
                  return (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-600 hover:underline">
                      Video {i + 1}: {url.split('/').pop()?.slice(0, 40)}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Source Pages */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Source</h3>
            {sourcePage && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-400">Listing page:</span>
                <button
                  onClick={() => router.push(`/scan/pages/${sourcePage.id}`)}
                  className="text-sm text-brand-600 hover:underline"
                >
                  {String(sourcePage.title ?? sourcePage.url)}
                </button>
              </div>
            )}
            {detailPage && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-400">Detail page:</span>
                <button
                  onClick={() => router.push(`/scan/pages/${detailPage.id}`)}
                  className="text-sm text-brand-600 hover:underline"
                >
                  {String(detailPage.title ?? detailPage.url)}
                </button>
              </div>
            )}
            {String(animal.listingUrl ?? '') !== '' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Original URL:</span>
                <a
                  href={String(animal.listingUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 hover:underline break-all"
                >
                  {String(animal.listingUrl)}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
