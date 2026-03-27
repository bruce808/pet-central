'use client';

import { useState } from 'react';
import type { PetResponse, ReviewResponse } from '@pet-central/types';
import { ReviewCard } from '@/components/ReviewCard';

interface ListingTabsProps {
  pet: PetResponse;
  reviews: ReviewResponse[];
}

const TABS = ['About', 'Health & Care', 'Reviews'] as const;

export function ListingTabs({ pet, reviews }: ListingTabsProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('About');

  return (
    <div>
      {/* Tab headers */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-6">
        {activeTab === 'About' && (
          <div className="space-y-4">
            <p className="leading-relaxed text-gray-600">{pet.description}</p>
            {pet.breedSecondary && (
              <p className="text-sm text-gray-500">
                <span className="font-medium">Secondary breed:</span> {pet.breedSecondary}
              </p>
            )}
            {pet.color && (
              <p className="text-sm text-gray-500">
                <span className="font-medium">Color:</span> {pet.color}
              </p>
            )}
            {Object.keys(pet.attributes).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Additional Details</h4>
                <dl className="mt-2 grid grid-cols-2 gap-2">
                  {Object.entries(pet.attributes).map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-gray-50 p-3">
                      <dt className="text-xs text-gray-500">{key}</dt>
                      <dd className="mt-0.5 text-sm font-medium text-gray-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Health & Care' && (
          <div className="space-y-4">
            {Object.keys(pet.health).length > 0 ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                {Object.entries(pet.health).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-gray-200 p-4">
                    <dt className="text-xs font-medium uppercase text-gray-500">
                      {key.replace(/_/g, ' ')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {typeof value === 'boolean'
                        ? value
                          ? 'Yes'
                          : 'No'
                        : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-gray-500">
                No health information has been provided for this pet yet.
              </p>
            )}
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-gray-500">
                No reviews yet for this organization.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
