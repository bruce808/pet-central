'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner, Pagination } from '@pet-central/ui';
import { listings } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { SearchFilters } from '@/components/SearchFilters';
import type { SearchListingsQuery } from '@pet-central/types';

function SearchContent() {
  const searchParams = useSearchParams();

  const params: SearchListingsQuery = {
    query: searchParams.get('query') ?? undefined,
    petType: (searchParams.get('petType') as SearchListingsQuery['petType']) ?? undefined,
    breed: searchParams.get('breed') ?? undefined,
    location: searchParams.get('location') ?? undefined,
    radiusKm: searchParams.get('radiusKm')
      ? Number(searchParams.get('radiusKm'))
      : undefined,
    sex: (searchParams.get('sex') as SearchListingsQuery['sex']) ?? undefined,
    sizeCategory: (searchParams.get('sizeCategory') as SearchListingsQuery['sizeCategory']) ?? undefined,
    temperament: searchParams.getAll('temperament').length
      ? searchParams.getAll('temperament')
      : undefined,
    minFee: searchParams.get('minFee')
      ? Number(searchParams.get('minFee'))
      : undefined,
    maxFee: searchParams.get('maxFee')
      ? Number(searchParams.get('maxFee'))
      : undefined,
    sortBy: (searchParams.get('sortBy') as SearchListingsQuery['sortBy']) ?? 'relevance',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: 12,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['listings', params],
    queryFn: () => listings.search(params),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Search Pets</h1>
        {params.query && (
          <p className="mt-1 text-sm text-gray-500">
            Results for &ldquo;{params.query}&rdquo;
          </p>
        )}
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Filters</h3>
            <SearchFilters />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
              <p className="text-sm text-red-600">
                Something went wrong loading results. Please try again.
              </p>
            </div>
          )}

          {data && data.items.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
              <div className="text-4xl">🔍</div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No results found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Try adjusting your filters or search for something else.
              </p>
            </div>
          )}

          {data && data.items.length > 0 && (
            <>
              <div className="mb-4 text-sm text-gray-500">
                {data.total.toLocaleString()} result{data.total !== 1 ? 's' : ''}
              </div>

              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {data.totalPages > 1 && (
                <div className="mt-10 flex justify-center">
                  <Pagination
                    currentPage={data.page}
                    totalPages={data.totalPages}
                    onPageChange={(page) => {
                      const current = new URLSearchParams(searchParams.toString());
                      current.set('page', String(page));
                      window.location.search = current.toString();
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
