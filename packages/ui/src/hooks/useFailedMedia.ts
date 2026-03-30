'use client';

import { useState, useCallback, useMemo } from 'react';

/**
 * Tracks URLs that failed to load, providing a filtered list and a callback
 * to mark individual URLs as broken. Works for images, videos, iframes, etc.
 */
export function useFailedMedia<T extends string = string>(urls: T[]) {
  const [failed, setFailed] = useState<Set<string>>(new Set());

  const markFailed = useCallback((url: string) => {
    setFailed((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }, []);

  const valid = useMemo(
    () => urls.filter((u) => !failed.has(u)),
    [urls, failed],
  );

  return { valid, failed, markFailed } as const;
}

export type UseFailedMediaReturn = ReturnType<typeof useFailedMedia>;
