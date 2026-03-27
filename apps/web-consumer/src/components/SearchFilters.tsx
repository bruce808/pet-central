'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Button, Input, Select } from '@pet-central/ui';
import { PetType, PetSex, SizeCategory } from '@pet-central/types';

const PET_TYPE_OPTIONS = Object.values(PetType).map((v) => ({
  value: v,
  label: v.charAt(0).toUpperCase() + v.slice(1),
}));

const SEX_OPTIONS = Object.values(PetSex).map((v) => ({
  value: v,
  label: v.charAt(0).toUpperCase() + v.slice(1),
}));

const SIZE_OPTIONS = Object.values(SizeCategory).map((v) => ({
  value: v,
  label: v.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}));

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'distance', label: 'Distance' },
  { value: 'trust_score', label: 'Trust Score' },
  { value: 'review_score', label: 'Review Score' },
];

const TEMPERAMENT_TAGS = [
  'Friendly',
  'Calm',
  'Energetic',
  'Playful',
  'Loyal',
  'Gentle',
  'Protective',
  'Independent',
];

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [petTypes, setPetTypes] = useState<string[]>(
    searchParams.getAll('petType'),
  );
  const [breed, setBreed] = useState(searchParams.get('breed') ?? '');
  const [location, setLocation] = useState(searchParams.get('location') ?? '');
  const [radius, setRadius] = useState(searchParams.get('radiusKm') ?? '50');
  const [minFee, setMinFee] = useState(searchParams.get('minFee') ?? '');
  const [maxFee, setMaxFee] = useState(searchParams.get('maxFee') ?? '');
  const [sex, setSex] = useState(searchParams.get('sex') ?? '');
  const [sizeCategory, setSizeCategory] = useState(
    searchParams.get('sizeCategory') ?? '',
  );
  const [selectedTemperaments, setSelectedTemperaments] = useState<string[]>(
    searchParams.getAll('temperament'),
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get('sortBy') ?? 'relevance',
  );

  const togglePetType = (type: string) => {
    setPetTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const toggleTemperament = (tag: string) => {
    setSelectedTemperaments((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    petTypes.forEach((t) => params.append('petType', t));
    if (breed) params.set('breed', breed);
    if (location) params.set('location', location);
    if (radius && radius !== '50') params.set('radiusKm', radius);
    if (minFee) params.set('minFee', minFee);
    if (maxFee) params.set('maxFee', maxFee);
    if (sex) params.set('sex', sex);
    if (sizeCategory) params.set('sizeCategory', sizeCategory);
    selectedTemperaments.forEach((t) => params.append('temperament', t));
    if (sortBy && sortBy !== 'relevance') params.set('sortBy', sortBy);
    params.set('page', '1');
    router.push(`/search?${params.toString()}`);
  }, [petTypes, breed, location, radius, minFee, maxFee, sex, sizeCategory, selectedTemperaments, sortBy, router]);

  const clearFilters = () => {
    setPetTypes([]);
    setBreed('');
    setLocation('');
    setRadius('50');
    setMinFee('');
    setMaxFee('');
    setSex('');
    setSizeCategory('');
    setSelectedTemperaments([]);
    setSortBy('relevance');
    router.push('/search');
  };

  return (
    <div className="space-y-6">
      {/* Pet Type */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900">Pet Type</h4>
        <div className="mt-2 space-y-1.5">
          {PET_TYPE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={petTypes.includes(opt.value)}
                onChange={() => togglePetType(opt.value)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Breed */}
      <Input
        label="Breed"
        placeholder="e.g. Golden Retriever"
        value={breed}
        onChange={(e) => setBreed(e.target.value)}
        name="breed"
      />

      {/* Location */}
      <Input
        label="Location"
        placeholder="City or zip code"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        name="location"
      />

      {/* Radius slider */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Radius: {radius} km
        </label>
        <input
          type="range"
          min="5"
          max="500"
          step="5"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          className="mt-1 w-full accent-brand-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>5 km</span>
          <span>500 km</span>
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900">Price Range</h4>
        <div className="mt-2 flex gap-2">
          <Input
            placeholder="Min"
            type="number"
            value={minFee}
            onChange={(e) => setMinFee(e.target.value)}
            name="minFee"
          />
          <Input
            placeholder="Max"
            type="number"
            value={maxFee}
            onChange={(e) => setMaxFee(e.target.value)}
            name="maxFee"
          />
        </div>
      </div>

      {/* Size */}
      <Select
        label="Size"
        options={SIZE_OPTIONS}
        value={sizeCategory}
        onChange={(e) => setSizeCategory(e.target.value)}
        placeholder="Any size"
        name="sizeCategory"
      />

      {/* Sex */}
      <Select
        label="Sex"
        options={SEX_OPTIONS}
        value={sex}
        onChange={(e) => setSex(e.target.value)}
        placeholder="Any sex"
        name="sex"
      />

      {/* Temperament */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900">Temperament</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {TEMPERAMENT_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTemperament(tag.toLowerCase())}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedTemperaments.includes(tag.toLowerCase())
                  ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <Select
        label="Sort By"
        options={SORT_OPTIONS}
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        name="sortBy"
      />

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="primary" size="sm" className="flex-1" onClick={applyFilters}>
          Apply Filters
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={clearFilters}>
          Clear
        </Button>
      </div>
    </div>
  );
}
