'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Button,
  Card,
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
        <p className="text-sm text-gray-500">{data?.total ?? 0} listings</p>
        <Link href="/listings/new">
          <Button variant="primary" size="md">
            New Listing
          </Button>
        </Link>
      </div>

      <Card padding="none">
        <div className="flex items-center gap-4 border-b border-gray-100 px-5 py-3">
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
                  <th className="px-5 py-3">Listing</th>
                  <th className="px-3 py-3">Pet Type</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Availability</th>
                  <th className="px-3 py-3 text-right">Fee</th>
                  <th className="px-3 py-3 text-right">Views</th>
                  <th className="px-3 py-3 text-right">Inquiries</th>
                  <th className="px-3 py-3">Created</th>
                  <th className="px-5 py-3" />
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
      </Card>
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
    <tr className="transition-colors hover:bg-gray-50">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
            {listing.media?.[0]?.url ? (
              <img
                src={listing.media[0].url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                No img
              </div>
            )}
          </div>
          <span className="font-medium text-gray-900">{listing.title}</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <Badge variant="neutral" size="sm">
          {listing.pet?.petType ?? '—'}
        </Badge>
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={listing.listingStatus} />
      </td>
      <td className="px-3 py-3">
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
      <td className="px-3 py-3 text-right text-gray-600">
        {listing.feeAmount != null ? `$${listing.feeAmount}` : '—'}
      </td>
      <td className="px-3 py-3 text-right text-gray-600">
        {((listing as unknown as Record<string, unknown>).views as number) ?? 0}
      </td>
      <td className="px-3 py-3 text-right text-gray-600">
        {((listing as unknown as Record<string, unknown>).inquiries as number) ?? 0}
      </td>
      <td className="px-3 py-3 text-gray-500">
        {listing.publishedAt
          ? new Date(listing.publishedAt).toLocaleDateString()
          : '—'}
      </td>
      <td className="px-5 py-3">
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
