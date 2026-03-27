'use client';

import { Button } from '@pet-central/ui';
import { favorites } from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';

interface ListingActionsProps {
  listingId: string;
  organizationId: string;
}

export function ListingActions({ listingId, organizationId }: ListingActionsProps) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (saved) {
        await favorites.remove(listingId);
        setSaved(false);
      } else {
        await favorites.add({ listingId });
        setSaved(true);
      }
    } catch {
      // Auth required — redirect
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Link href={`/messages?org=${organizationId}&listing=${listingId}`} className="block">
        <Button className="w-full" size="lg">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          Send Inquiry
        </Button>
      </Link>
      <Button
        variant="outline"
        className="w-full"
        size="lg"
        onClick={handleSave}
        loading={saving}
      >
        <svg
          className={`h-4 w-4 ${saved ? 'fill-red-500 text-red-500' : ''}`}
          fill={saved ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        {saved ? 'Saved' : 'Save to Favorites'}
      </Button>
    </div>
  );
}
