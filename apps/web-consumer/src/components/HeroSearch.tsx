'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const POPULAR_SEARCHES = [
  'Golden Retriever',
  'Labrador',
  'Persian Cat',
  'Cockatiel',
  'German Shepherd',
  'Maine Coon',
];

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        router.push(`/search?query=${encodeURIComponent(query.trim())}`);
      } else {
        router.push('/search');
      }
    },
    [query, router],
  );

  return (
    <div>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-card-lg transition-shadow focus-within:shadow-glow focus-within:border-brand-200">
          <div className="pointer-events-none pl-5">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by breed, type, or location..."
            className="flex-1 px-4 py-4.5 text-base text-gray-900 placeholder-gray-400 focus:outline-none sm:text-lg"
          />
          <button
            type="submit"
            className="m-2 shrink-0 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] sm:px-8"
          >
            Search
          </button>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="text-gray-400">Popular:</span>
        {POPULAR_SEARCHES.map((term) => (
          <Link
            key={term}
            href={`/search?query=${encodeURIComponent(term)}`}
            className="rounded-full border border-gray-200 bg-white/80 px-3.5 py-1.5 text-sm text-gray-600 shadow-sm transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 hover:shadow-md"
          >
            {term}
          </Link>
        ))}
      </div>
    </div>
  );
}
