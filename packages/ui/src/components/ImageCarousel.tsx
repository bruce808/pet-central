'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import clsx from 'clsx';

export interface ImageCarouselProps {
  images: { src: string; alt: string }[];
  aspectRatio?: string;
  showThumbnails?: boolean;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

export function ImageCarousel({
  images,
  aspectRatio = 'aspect-[4/3]',
  showThumbnails = false,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  className,
}: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (autoPlay && images.length > 1) {
      timerRef.current = setInterval(next, autoPlayInterval);
      return () => clearInterval(timerRef.current);
    }
  }, [autoPlay, autoPlayInterval, images.length, next]);

  if (images.length === 0) {
    return (
      <div className={clsx('flex items-center justify-center bg-gray-100 rounded-card', aspectRatio, className)}>
        <span className="text-4xl text-gray-300">No images</span>
      </div>
    );
  }

  return (
    <div className={clsx('relative group', className)}>
      <div className={clsx('relative overflow-hidden rounded-card', aspectRatio)}>
        {images.map((image, i) => (
          <div
            key={i}
            className={clsx(
              'absolute inset-0 transition-opacity duration-500',
              i === current ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="h-full w-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Previous image"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Next image"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}
      </div>

      {showDots && images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={clsx(
                'rounded-full transition-all duration-200',
                i === current
                  ? 'w-6 h-2 bg-brand-600'
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400',
              )}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {showThumbnails && images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={clsx(
                'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ring-2 transition-all',
                i === current ? 'ring-brand-500 ring-offset-1' : 'ring-transparent hover:ring-gray-300',
              )}
            >
              <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
