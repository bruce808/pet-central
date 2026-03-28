'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button, LoadingSpinner, Badge, StatusBadge } from '@pet-central/ui';
import { scanPages } from '@/lib/api';

export default function PageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'markdown' | 'extractions' | 'animals'>('markdown');

  const pageQuery = useQuery({
    queryKey: ['scan', 'page-detail', id],
    queryFn: () => scanPages.getById(id),
  });

  const markdownQuery = useQuery({
    queryKey: ['scan', 'page-markdown', id],
    queryFn: () => scanPages.getMarkdown(id),
    enabled: viewMode === 'markdown',
  });

  const page = pageQuery.data as Record<string, unknown> | undefined;
  const extractions = (page?.extractions ?? []) as Record<string, unknown>[];
  const animalsFromSource = (page?.animalListingsFromSource ?? []) as Record<string, unknown>[];
  const animalsFromDetail = (page?.animalListingsFromDetail ?? []) as Record<string, unknown>[];
  const allAnimals = [...animalsFromSource, ...animalsFromDetail];
  const markdown = markdownQuery.data as { markdownContent: string } | undefined;

  if (pageQuery.isLoading) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (!page) {
    return <div className="py-12 text-center text-gray-500">Page not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => router.back()} className="mb-2 text-sm text-brand-600 hover:underline">
          &larr; Back to Scan
        </button>
        <h2 className="text-xl font-bold text-gray-900 break-all">
          {String(page.title ?? '(no title)')}
        </h2>
        <a
          href={String(page.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-600 hover:underline break-all"
        >
          {String(page.url)} &rarr;
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-card">
          <p className="text-[10px] font-medium uppercase text-gray-400">Type</p>
          <Badge variant="neutral">{String(page.pageType ?? '')}</Badge>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-card">
          <p className="text-[10px] font-medium uppercase text-gray-400">HTTP</p>
          <p className="text-lg font-bold">{String(page.httpStatus ?? '—')}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-card">
          <p className="text-[10px] font-medium uppercase text-gray-400">Depth</p>
          <p className="text-lg font-bold">{String(page.depth ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-card">
          <p className="text-[10px] font-medium uppercase text-gray-400">Content</p>
          <p className="text-xs text-gray-700 truncate">{String(page.contentType ?? '—')}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-card">
          <p className="text-[10px] font-medium uppercase text-gray-400">Listing Page</p>
          <p className={`text-lg font-bold ${page.isListingPage ? 'text-green-600' : 'text-gray-400'}`}>
            {page.isListingPage ? 'Yes' : 'No'}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-card">
          <p className="text-[10px] font-medium uppercase text-gray-400">Detail Page</p>
          <p className={`text-lg font-bold ${page.isDetailPage ? 'text-green-600' : 'text-gray-400'}`}>
            {page.isDetailPage ? 'Yes' : 'No'}
          </p>
        </div>
      </div>

      {String(page.metaDescription ?? '') && (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase text-gray-400 mb-1">Meta Description</p>
          <p className="text-sm text-gray-700">{String(page.metaDescription)}</p>
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white shadow-card">
        <div className="flex items-center gap-1 border-b border-gray-100 px-4 py-3">
          {(['markdown', 'extractions', 'animals'] as const).map((m) => {
            const labels = {
              markdown: 'Page Content',
              extractions: `Extractions (${extractions.length})`,
              animals: `Animals (${allAnimals.length})`,
            };
            return (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === m
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {labels[m]}
              </button>
            );
          })}
          <div className="flex-1" />
          <a
            href={String(page.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Open Original
          </a>
        </div>

        {viewMode === 'markdown' && (
          <div className="p-6">
            {markdownQuery.isLoading ? (
              <div className="flex h-32 items-center justify-center"><LoadingSpinner /></div>
            ) : markdown?.markdownContent ? (
              <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-brand-600 prose-img:rounded-lg">
                <pre className="whitespace-pre-wrap rounded-xl bg-gray-50 p-6 text-sm leading-relaxed text-gray-800 font-sans border border-gray-100">
                  {markdown.markdownContent}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No markdown content available for this page.</p>
            )}
          </div>
        )}

        {viewMode === 'extractions' && (
          <div className="divide-y divide-gray-50">
            {extractions.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-500 italic">No extractions for this page.</p>
            ) : (
              extractions.map((ext, i) => (
                <div key={i} className="px-6 py-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="info">{String(ext.extractionType ?? '')}</Badge>
                    <span className="text-xs text-gray-500">{String(ext.extractorName ?? '')} v{String(ext.extractorVersion ?? '')}</span>
                    {ext.confidence != null && (
                      <span className="text-xs font-semibold text-gray-600">
                        {(Number(ext.confidence) * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>
                  <pre className="rounded-lg bg-gray-50 p-4 text-xs text-gray-700 overflow-x-auto border border-gray-100">
                    {JSON.stringify(ext.jsonPayload, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}

        {viewMode === 'animals' && (
          <div className="divide-y divide-gray-50">
            {allAnimals.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-500 italic">No animal listings linked to this page.</p>
            ) : (
              allAnimals.map((animal) => (
                <div key={String(animal.id)} className="flex items-center gap-4 px-6 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700 font-bold text-sm">
                    {String(animal.name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{String(animal.name ?? '(unnamed)')}</p>
                    <p className="text-xs text-gray-500">
                      {String(animal.animalType ?? '').replace('SCAN_', '')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {String(page.discoveredFromUrl ?? '') && (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase text-gray-400 mb-1">Discovered From</p>
          <a
            href={String(page.discoveredFromUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-600 hover:underline break-all"
          >
            {String(page.discoveredFromUrl)}
          </a>
        </div>
      )}
    </div>
  );
}
