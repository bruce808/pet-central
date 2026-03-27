'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Button,
  Input,
  Select,
  Textarea,
  Badge,
} from '@pet-central/ui';
import { listings as listingsApi, pets as petsApi } from '@/lib/api';

const STEPS = ['Pet Info', 'Photos & Media', 'Listing Details', 'Review & Submit'];

interface PetFormData {
  type: string;
  breed: string;
  name: string;
  description: string;
  sex: string;
  ageMonths: string;
  size: string;
  color: string;
  temperament: string[];
  healthInfo: string;
  adoptionOrSaleType: string;
}

interface ListingFormData {
  title: string;
  summary: string;
  fee: string;
  availability: string;
  location: string;
}

const emptyPet: PetFormData = {
  type: '',
  breed: '',
  name: '',
  description: '',
  sex: '',
  ageMonths: '',
  size: '',
  color: '',
  temperament: [],
  healthInfo: '',
  adoptionOrSaleType: '',
};

const emptyListing: ListingFormData = {
  title: '',
  summary: '',
  fee: '',
  availability: '',
  location: '',
};

const temperamentOptions = [
  'Friendly',
  'Playful',
  'Calm',
  'Energetic',
  'Gentle',
  'Protective',
  'Independent',
  'Affectionate',
  'Good with kids',
  'Good with pets',
];

export default function NewListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pet, setPet] = useState<PetFormData>(emptyPet);
  const [listing, setListing] = useState<ListingFormData>(emptyListing);
  const [mediaFiles, setMediaFiles] = useState<
    { file?: File; preview: string; primary: boolean }[]
  >([]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const petRes = await petsApi.create({
        type: pet.type,
        breed: pet.breed,
        name: pet.name,
        description: pet.description,
        sex: pet.sex,
        ageMonths: parseInt(pet.ageMonths) || undefined,
        size: pet.size,
        color: pet.color,
        temperament: pet.temperament,
        healthInfo: pet.healthInfo,
        adoptionOrSaleType: pet.adoptionOrSaleType,
      });
      await listingsApi.create({
        petId: petRes.id,
        title: listing.title,
        summary: listing.summary,
        fee: listing.fee ? parseFloat(listing.fee) : undefined,
        availabilityStatus: listing.availability,
        location: listing.location,
      });
    },
    onSuccess: () => router.push('/listings'),
  });

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const petRes = await petsApi.create({
        type: pet.type || 'DOG',
        name: pet.name || 'Untitled',
        breed: pet.breed,
        description: pet.description,
      });
      await listingsApi.create({
        petId: petRes.id,
        title: listing.title || 'Draft Listing',
        status: 'DRAFT',
      });
    },
    onSuccess: () => router.push('/listings'),
  });

  function updatePet(field: keyof PetFormData, value: string | string[]) {
    setPet((prev) => ({ ...prev, [field]: value }));
  }

  function updateListing(field: keyof ListingFormData, value: string) {
    setListing((prev) => ({ ...prev, [field]: value }));
  }

  function toggleTemperament(tag: string) {
    setPet((prev) => ({
      ...prev,
      temperament: prev.temperament.includes(tag)
        ? prev.temperament.filter((t) => t !== tag)
        : [...prev.temperament, tag],
    }));
  }

  function handleMediaDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/'),
    );
    addMediaFiles(files);
  }

  function addMediaFiles(files: File[]) {
    const newMedia = files.map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      primary: mediaFiles.length === 0 && i === 0,
    }));
    setMediaFiles((prev) => [...prev, ...newMedia]);
  }

  function setPrimaryMedia(index: number) {
    setMediaFiles((prev) =>
      prev.map((m, i) => ({ ...m, primary: i === index })),
    );
  }

  function removeMedia(index: number) {
    setMediaFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((m) => m.primary)) {
        next[0]!.primary = true;
      }
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 ${
                i === step
                  ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm'
                  : i < step
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < step ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                i + 1
              )}
            </button>
            <span
              className={`hidden text-xs font-medium sm:block ${
                i === step ? 'text-brand-700' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 rounded-full transition-colors ${
                  i < step ? 'bg-brand-300' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Pet Info */}
      {step === 0 && (
        <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Pet Information
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Pet Type"
              options={[
                { value: 'DOG', label: 'Dog' },
                { value: 'CAT', label: 'Cat' },
                { value: 'BIRD', label: 'Bird' },
              ]}
              value={pet.type}
              onChange={(e) => updatePet('type', e.target.value)}
            />
            <Input
              label="Breed"
              value={pet.breed}
              onChange={(e) => updatePet('breed', e.target.value)}
              placeholder="e.g. Golden Retriever"
            />
            <Input
              label="Name"
              value={pet.name}
              onChange={(e) => updatePet('name', e.target.value)}
              placeholder="Pet name"
            />
            <Select
              label="Sex"
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
              ]}
              value={pet.sex}
              onChange={(e) => updatePet('sex', e.target.value)}
            />
            <Input
              label="Age (months)"
              type="number"
              value={pet.ageMonths}
              onChange={(e) => updatePet('ageMonths', e.target.value)}
              placeholder="e.g. 12"
            />
            <Select
              label="Size"
              options={[
                { value: 'SMALL', label: 'Small' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'LARGE', label: 'Large' },
                { value: 'EXTRA_LARGE', label: 'Extra Large' },
              ]}
              value={pet.size}
              onChange={(e) => updatePet('size', e.target.value)}
            />
            <Input
              label="Color"
              value={pet.color}
              onChange={(e) => updatePet('color', e.target.value)}
              placeholder="e.g. Golden"
            />
            <Select
              label="Adoption / Sale Type"
              options={[
                { value: 'ADOPTION', label: 'Adoption' },
                { value: 'SALE', label: 'Sale' },
                { value: 'FOSTER', label: 'Foster' },
              ]}
              value={pet.adoptionOrSaleType}
              onChange={(e) => updatePet('adoptionOrSaleType', e.target.value)}
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Description"
              value={pet.description}
              onChange={(e) => updatePet('description', e.target.value)}
              rows={4}
              placeholder="Describe the pet's personality, background, and what makes them special…"
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Health Information"
              value={pet.healthInfo}
              onChange={(e) => updatePet('healthInfo', e.target.value)}
              rows={2}
              placeholder="Vaccinations, spay/neuter status, health conditions…"
            />
          </div>
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Temperament
            </label>
            <div className="flex flex-wrap gap-2">
              {temperamentOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTemperament(tag)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                    pet.temperament.includes(tag)
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Photos & Media */}
      {step === 1 && (
        <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Photos & Media
          </h2>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleMediaDrop}
            className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-all duration-200 hover:border-brand-300 hover:bg-brand-50/30"
            onClick={() => document.getElementById('media-upload')?.click()}
          >
            <svg className="mb-3 h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-600">
              Drag & drop photos here or click to upload
            </p>
            <p className="mt-1 text-xs text-gray-400">
              PNG, JPG, WEBP up to 10MB each
            </p>
            <input
              id="media-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                addMediaFiles(Array.from(e.target.files ?? []))
              }
            />
          </div>

          {mediaFiles.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {mediaFiles.map((media, i) => (
                <div
                  key={i}
                  className={`group relative overflow-hidden rounded-[10px] border-2 transition-all ${
                    media.primary
                      ? 'border-brand-500 shadow-sm'
                      : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <img
                    src={media.preview}
                    alt={`Upload ${i + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                  {media.primary && (
                    <Badge
                      variant="success"
                      size="sm"
                      className="absolute left-1.5 top-1.5"
                    >
                      Primary
                    </Badge>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    {!media.primary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryMedia(i)}
                        className="rounded-[8px] bg-white px-2.5 py-1 text-xs font-medium text-gray-800 shadow-sm"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(i)}
                      className="rounded-[8px] bg-red-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Listing Details */}
      {step === 2 && (
        <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Listing Details
          </h2>
          <div className="space-y-4">
            <Input
              label="Title"
              value={listing.title}
              onChange={(e) => updateListing('title', e.target.value)}
              placeholder="e.g. Adorable Golden Retriever Puppy"
            />
            <Textarea
              label="Summary"
              value={listing.summary}
              onChange={(e) => updateListing('summary', e.target.value)}
              rows={3}
              placeholder="A brief summary for the listing card…"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Fee ($)"
                type="number"
                value={listing.fee}
                onChange={(e) => updateListing('fee', e.target.value)}
                placeholder="0.00"
              />
              <Select
                label="Availability"
                options={[
                  { value: 'AVAILABLE', label: 'Available' },
                  { value: 'RESERVED', label: 'Reserved' },
                  { value: 'COMING_SOON', label: 'Coming Soon' },
                ]}
                value={listing.availability}
                onChange={(e) => updateListing('availability', e.target.value)}
              />
            </div>
            <Input
              label="Location"
              value={listing.location}
              onChange={(e) => updateListing('location', e.target.value)}
              placeholder="City, State"
            />
          </div>
        </div>
      )}

      {/* Step 4: Review & Submit */}
      {step === 3 && (
        <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Review & Submit
          </h2>

          <div className="space-y-6">
            <ReviewSection title="Pet Information">
              <ReviewField label="Type" value={pet.type} />
              <ReviewField label="Breed" value={pet.breed} />
              <ReviewField label="Name" value={pet.name} />
              <ReviewField label="Sex" value={pet.sex} />
              <ReviewField label="Age" value={pet.ageMonths ? `${pet.ageMonths} months` : '—'} />
              <ReviewField label="Size" value={pet.size} />
              <ReviewField label="Color" value={pet.color} />
              <ReviewField
                label="Type"
                value={pet.adoptionOrSaleType}
              />
              {pet.temperament.length > 0 && (
                <div className="col-span-full">
                  <span className="text-xs text-gray-500">Temperament</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {pet.temperament.map((t) => (
                      <span key={t} className="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </ReviewSection>

            <ReviewSection title="Photos">
              <p className="text-sm text-gray-600">
                {mediaFiles.length} photo{mediaFiles.length !== 1 ? 's' : ''}{' '}
                uploaded
              </p>
            </ReviewSection>

            <ReviewSection title="Listing Details">
              <ReviewField label="Title" value={listing.title} />
              <ReviewField label="Fee" value={listing.fee ? `$${listing.fee}` : 'Free'} />
              <ReviewField label="Availability" value={listing.availability} />
              <ReviewField label="Location" value={listing.location} />
            </ReviewSection>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => saveDraftMutation.mutate()}
          loading={saveDraftMutation.isPending}
        >
          Save as Draft
        </Button>
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="rounded-[10px] bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-brand-700 hover:to-brand-800"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="rounded-[10px] bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-brand-700 hover:to-brand-800 disabled:opacity-60"
            >
              {createMutation.isPending ? 'Submitting…' : 'Submit Listing'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
    </div>
  );
}
