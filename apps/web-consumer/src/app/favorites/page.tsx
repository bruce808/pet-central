'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner, Button, EmptyState } from '@pet-central/ui';
import { favorites } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';

export default function FavoritesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favorites.list(1, 50),
  });

  const removeMutation = useMutation({
    mutationFn: (listingId: string) => favorites.remove(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
      <p className="mt-1 text-sm text-gray-500">Pets you&apos;ve saved for later.</p>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="mt-8">
          <EmptyState
            title="No favorites yet"
            description="Browse listings and tap the heart to save pets you love."
            action={{
              label: 'Browse Pets',
              onClick: () => (window.location.href = '/search'),
            }}
          />
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((listing) => (
            <div key={listing.id} className="relative">
              <ListingCard listing={listing} />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  removeMutation.mutate(listing.id);
                }}
                className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 text-red-500 shadow-sm transition-colors hover:bg-red-50"
                title="Remove from favorites"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
