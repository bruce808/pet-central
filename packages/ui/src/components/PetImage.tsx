'use client';

import { useState } from 'react';
import clsx from 'clsx';

export interface PetImageProps {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  onFailed?: (url: string) => void;
  /** Content shown when image fails or src is empty */
  fallback?: React.ReactNode;
}

const DEFAULT_FALLBACK = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-1/3 w-1/3 text-gray-300">
    <path d="M8.35 3c1.1 0 2 1.2 2 2.7s-.9 2.7-2 2.7-2-1.2-2-2.7.9-2.7 2-2.7zm7.3 0c1.1 0 2 1.2 2 2.7s-.9 2.7-2 2.7-2-1.2-2-2.7.9-2.7 2-2.7zm-10.6 5.7c1.1 0 2 1 2 2.3s-.9 2.3-2 2.3-2-1-2-2.3.9-2.3 2-2.3zm13.9 0c1.1 0 2 1 2 2.3s-.9 2.3-2 2.3-2-1-2-2.3.9-2.3 2-2.3zM12 12.5c2.3 0 4.2 1.5 4.2 3.4 0 2.3-1.5 4.6-4.2 4.6s-4.2-2.3-4.2-4.6c0-1.9 1.9-3.4 4.2-3.4z" />
  </svg>
);

/**
 * Renders a pet image with automatic error handling.
 * On load failure the image is replaced by a fallback (paw icon by default).
 * Optionally calls `onFailed(url)` so a parent can filter the URL from a list.
 */
export function PetImage({
  src,
  alt = '',
  className,
  fallbackClassName,
  onFailed,
  fallback = DEFAULT_FALLBACK,
}: PetImageProps) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={clsx(
          'flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100',
          fallbackClassName ?? className,
        )}
      >
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        setErrored(true);
        onFailed?.(src);
      }}
    />
  );
}
