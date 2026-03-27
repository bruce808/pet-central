'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import {
  Button,
  Input,
  Select,
  Textarea,
  LoadingSpinner,
  StatusBadge,
} from '@pet-central/ui';
import { listings as listingsApi, pets as petsApi } from '@/lib/api';

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: listing, isLoading } = useQuery({
    queryKey: ['vendor-listing', id],
    queryFn: () => listingsApi.getById(id),
  });

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [fee, setFee] = useState('');
  const [availability, setAvailability] = useState('');
  const [location, setLocation] = useState('');
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [petDescription, setPetDescription] = useState('');
  const [petSex, setPetSex] = useState('');
  const [petSize, setPetSize] = useState('');

  useEffect(() => {
    if (listing) {
      setTitle(listing.title ?? '');
      setSummary(listing.summary ?? '');
      setFee(listing.feeAmount != null ? String(listing.feeAmount) : '');
      setAvailability(listing.availabilityStatus ?? '');
      setLocation((listing as unknown as Record<string, unknown>).location as string ?? '');
      setPetName(listing.pet?.name ?? '');
      setPetBreed(listing.pet?.breedPrimary ?? '');
      setPetDescription(listing.pet?.description ?? '');
      setPetSex(listing.pet?.sex ?? '');
      setPetSize(listing.pet?.sizeCategory ?? '');
    }
  }, [listing]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (listing?.pet?.id) {
        await petsApi.update(listing.pet.id, {
          name: petName,
          breed: petBreed,
          description: petDescription,
          sex: petSex,
          size: petSize,
        });
      }
      await listingsApi.update(id, {
        title,
        summary,
        fee: fee ? parseFloat(fee) : undefined,
        availabilityStatus: availability,
        location,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-listing', id] });
      queryClient.invalidateQueries({ queryKey: ['vendor-listings'] });
      router.push('/listings');
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => listingsApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-listings'] });
      router.push('/listings');
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => listingsApi.pause(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-listings'] });
      router.push('/listings');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusBadge status={listing?.listingStatus ?? 'draft'} />
        </div>
        <div className="flex gap-2">
          {(listing?.listingStatus === 'draft' || listing?.listingStatus === 'paused') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => publishMutation.mutate()}
              loading={publishMutation.isPending}
            >
              Publish
            </Button>
          )}
          {listing?.listingStatus === 'published' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => pauseMutation.mutate()}
              loading={pauseMutation.isPending}
            >
              Pause
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">
          Pet Information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Name" value={petName} onChange={(e) => setPetName(e.target.value)} />
          <Input label="Breed" value={petBreed} onChange={(e) => setPetBreed(e.target.value)} />
          <Select
            label="Sex"
            options={[
              { value: 'MALE', label: 'Male' },
              { value: 'FEMALE', label: 'Female' },
            ]}
            value={petSex}
            onChange={(e) => setPetSex(e.target.value)}
          />
          <Select
            label="Size"
            options={[
              { value: 'SMALL', label: 'Small' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'LARGE', label: 'Large' },
              { value: 'EXTRA_LARGE', label: 'Extra Large' },
            ]}
            value={petSize}
            onChange={(e) => setPetSize(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <Textarea
            label="Description"
            value={petDescription}
            onChange={(e) => setPetDescription(e.target.value)}
            rows={4}
          />
        </div>
      </div>

      <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">
          Listing Details
        </h2>
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            label="Summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Fee ($)"
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
            />
            <Select
              label="Availability"
              options={[
                { value: 'AVAILABLE', label: 'Available' },
                { value: 'RESERVED', label: 'Reserved' },
                { value: 'ADOPTED', label: 'Adopted' },
                { value: 'UNAVAILABLE', label: 'Unavailable' },
              ]}
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            />
          </div>
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/listings')}>
          Cancel
        </Button>
        <button
          type="button"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="rounded-[10px] bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-brand-700 hover:to-brand-800 disabled:opacity-60"
        >
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
