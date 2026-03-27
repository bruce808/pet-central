'use client';

import { useState } from 'react';
import type { ListingResponse, ReviewResponse, OrganizationResponse } from '@pet-central/types';
import { ListingCard } from '@/components/ListingCard';
import { ReviewCard } from '@/components/ReviewCard';

interface OrgTabsProps {
  listings: ListingResponse[];
  reviews: ReviewResponse[];
  org: OrganizationResponse;
}

const TABS = ['Active Listings', 'Reviews', 'About & Policies'] as const;

export function OrgTabs({ listings, reviews, org }: OrgTabsProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Active Listings');

  return (
    <div>
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

      <div className="py-6">
        {activeTab === 'Active Listings' && (
          <div>
            {listings.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-gray-500">
                No active listings at this time.
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
              <p className="py-12 text-center text-sm text-gray-500">
                No reviews yet.
              </p>
            )}
          </div>
        )}

        {activeTab === 'About & Policies' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Description</h3>
              <p className="mt-2 leading-relaxed text-gray-600">{org.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="text-xs font-medium uppercase text-gray-500">Location</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {org.city}, {org.region}, {org.country}
                </p>
              </div>
              {org.websiteUrl && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="text-xs font-medium uppercase text-gray-500">Website</h4>
                  <a
                    href={org.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm text-brand-600 hover:underline"
                  >
                    {org.websiteUrl}
                  </a>
                </div>
              )}
              {org.email && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="text-xs font-medium uppercase text-gray-500">Contact Email</h4>
                  <p className="mt-1 text-sm text-gray-900">{org.email}</p>
                </div>
              )}
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="text-xs font-medium uppercase text-gray-500">Verification</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {org.verificationStatus.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
              </div>
            </div>

            {org.badges.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Trust Badges</h3>
                <div className="mt-3 space-y-2">
                  {org.badges.map((badge) => (
                    <div key={badge.code} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                      <svg className="mt-0.5 h-5 w-5 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-1.065-3.588 3 3 0 00-3.753-1.065 3 3 0 00-5.304 0 3 3 0 00-3.588 1.065 3 3 0 00-1.065 3.753 3 3 0 000 5.304 3 3 0 001.065 3.588 3 3 0 003.753 1.065 3 3 0 005.304 0 3 3 0 003.588-1.065 3 3 0 001.065-3.753z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{badge.label}</p>
                        <p className="text-xs text-gray-500">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
