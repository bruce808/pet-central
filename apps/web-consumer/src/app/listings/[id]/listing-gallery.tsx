'use client';

import { PetImage } from '@pet-central/ui';
import { useFailedMedia } from '@pet-central/ui';

interface Media {
  id: string;
  url: string;
}

export function ListingGallery({ media, title }: { media: Media[]; title: string }) {
  const urls = media.map((m) => m.url);
  const { valid, markFailed } = useFailedMedia(urls);
  const validMedia = media.filter((m) => valid.includes(m.url));

  if (validMedia.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-purple-50 text-8xl sm:col-span-2">
        🐾
      </div>
    );
  }

  return (
    <>
      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 sm:col-span-2">
        <PetImage
          src={validMedia[0]!.url}
          alt={title}
          className="h-full w-full object-cover"
          fallbackClassName="h-full w-full aspect-[4/3]"
          onFailed={markFailed}
        />
      </div>
      {validMedia.slice(1, 5).map((m) => (
        <div key={m.id} className="aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
          <PetImage
            src={m.url}
            alt=""
            className="h-full w-full object-cover"
            fallbackClassName="h-full w-full"
            onFailed={markFailed}
          />
        </div>
      ))}
    </>
  );
}
