'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Button,
  Badge,
  Select,
  StatusBadge,
  LoadingSpinner,
  EmptyState,
} from '@pet-central/ui';
import { listings as listingsApi } from '@/lib/api';
import type { ListingResponse } from '@pet-central/types';

export default function ListingsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [petTypeFilter, setPetTypeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-listings', statusFilter, petTypeFilter],
    queryFn: () =>
      listingsApi.list({
        status: statusFilter || undefined,
        petType: petTypeFilter || undefined,
      }),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => listingsApi.publish(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-listings'] }),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => listingsApi.pause(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-listings'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => listingsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-listings'] }),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Listings</h2>
          <p className="mt-1 text-sm text-gray-500">{data?.total ?? 0} listings total</p>
        </div>
        <Link href="/listings/new">
          <Button variant="primary" size="md">
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Listing
            </span>
          </Button>
        </Link>
      </div>

      <div className="rounded-[16px] border border-gray-100 bg-white shadow-card overflow-hidden">
        <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-4">
          <Select
            placeholder="All Statuses"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PAUSED', label: 'Paused' },
              { value: 'PENDING_REVIEW', label: 'Pending Review' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Select
            placeholder="All Pet Types"
            options={[
              { value: '', label: 'All Pet Types' },
              { value: 'DOG', label: 'Dogs' },
              { value: 'CAT', label: 'Cats' },
              { value: 'BIRD', label: 'Birds' },
            ]}
            value={petTypeFilter}
            onChange={(e) => setPetTypeFilter(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No listings found"
            description="Create your first listing to get started."
            action={{ label: 'Create Listing', onClick: () => {} }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3.5">Listing</th>
                  <th className="px-3 py-3.5">Pet Type</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-3 py-3.5">Availability</th>
                  <th className="px-3 py-3.5 text-right">Fee</th>
                  <th className="px-3 py-3.5 text-right">Views</th>
                  <th className="px-3 py-3.5 text-right">Inquiries</th>
                  <th className="px-3 py-3.5">Created</th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((listing: ListingResponse) => (
                  <ListingRow
                    key={listing.id}
                    listing={listing}
                    onPublish={() => publishMutation.mutate(listing.id)}
                    onPause={() => pauseMutation.mutate(listing.id)}
                    onRemove={() => {
                      if (confirm('Remove this listing?')) {
                        deleteMutation.mutate(listing.id);
                      }
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ListingRow({
  listing,
  onPublish,
  onPause,
  onRemove,
}: {
  listing: ListingResponse;
  onPublish: () => void;
  onPause: () => void;
  onRemove: () => void;
}) {
  return (
    <tr className="transition-colors hover:bg-gray-50/50">
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[10px] bg-gray-100">
            {listing.media?.[0]?.url ? (
              <img
                src={listing.media[0].url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
            )}
          </div>
          <span className="font-medium text-gray-900">{listing.title}</span>
        </div>
      </td>
      <td className="px-3 py-3.5">
        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          {listing.pet?.petType ?? '—'}
        </span>
      </td>
      <td className="px-3 py-3.5">
        <StatusBadge status={listing.listingStatus} />
      </td>
      <td className="px-3 py-3.5">
        <StatusBadge
          status={listing.availabilityStatus}
          statusMap={{
            AVAILABLE: 'success',
            RESERVED: 'warning',
            ADOPTED: 'info',
            UNAVAILABLE: 'neutral',
          }}
        />
      </td>
      <td className="px-3 py-3.5 text-right text-gray-600">
        {listing.feeAmount != null ? `$${listing.feeAmount}` : '—'}
      </td>
      <td className="px-3 py-3.5 text-right text-gray-600">
        {((listing as unknown as Record<string, unknown>).views as number) ?? 0}
      </td>
      <td className="px-3 py-3.5 text-right text-gray-600">
        {((listing as unknown as Record<string, unknown>).inquiries as number) ?? 0}
      </td>
      <td className="px-3 py-3.5 text-gray-500">
        {listing.publishedAt
          ? new Date(listing.publishedAt).toLocaleDateString()
          : '—'}
      </td>
      <td className="px-6 py-3.5">
        <div className="flex items-center justify-end gap-1">
          <Link href={`/listings/${listing.id}/edit`}>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </Link>
          {listing.listingStatus === 'draft' || listing.listingStatus === 'paused' ? (
            <Button variant="ghost" size="sm" onClick={onPublish}>
              Publish
            </Button>
          ) : listing.listingStatus === 'published' ? (
            <Button variant="ghost" size="sm" onClick={onPause}>
              Pause
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </td>
    </tr>
  );
}
