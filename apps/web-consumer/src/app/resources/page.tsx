'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, Badge, LoadingSpinner } from '@pet-central/ui';
import { resources } from '@/lib/api';
import type { ResourceResponse } from '@pet-central/types';

const TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'article', label: 'Articles' },
  { value: 'tip', label: 'Tips' },
  { value: 'guide', label: 'Guides' },
];

const TYPE_VARIANTS: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
  article: 'info',
  tip: 'success',
  guide: 'warning',
  faq: 'neutral',
};

function ResourcesContent() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get('type') ?? '';

  const { data, isLoading } = useQuery({
    queryKey: ['resources', typeFilter],
    queryFn: () =>
      resources.list({ type: typeFilter || undefined, page: 1, limit: 20 }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Resources & Guides</h1>
        <p className="mt-1 text-gray-500">
          Learn everything you need to know about finding and caring for your pet.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex gap-2">
        {TYPE_FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value ? `/resources?type=${filter.value}` : '/resources'}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              typeFilter === filter.value
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-gray-500">No resources found.</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((resource: ResourceResponse) => (
            <Link key={resource.id} href={`/resources/${resource.slug}`}>
              <Card hover className="h-full transition-all hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <Badge variant={TYPE_VARIANTS[resource.resourceType] ?? 'neutral'}>
                    {resource.resourceType}
                  </Badge>
                  {resource.publishedAt && (
                    <span className="text-xs text-gray-400">
                      {new Date(resource.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">{resource.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-gray-500">
                  {resource.bodyMarkdown.slice(0, 200)}...
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  {resource.author && <span>By {resource.author.displayName}</span>}
                  {resource.organization && (
                    <span>&middot; {resource.organization.publicName}</span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <ResourcesContent />
    </Suspense>
  );
}
