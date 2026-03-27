'use client';

import clsx from 'clsx';

export interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const sizeMap = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function StarRating({
  rating,
  maxRating = 5,
  size = 'sm',
  showValue = false,
  showCount = false,
  count,
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  return (
    <div className={clsx('inline-flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }).map((_, i) => {
          const value = i + 1;
          const filled = rating >= value;
          const halfFilled = !filled && rating >= value - 0.5;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(value)}
              className={clsx(
                'relative transition-colors',
                interactive && 'cursor-pointer hover:scale-110 transition-transform',
                !interactive && 'cursor-default',
              )}
            >
              <svg
                className={clsx(
                  sizeMap[size],
                  filled
                    ? 'text-amber-400'
                    : halfFilled
                      ? 'text-amber-400'
                      : 'text-gray-200',
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                {halfFilled ? (
                  <>
                    <defs>
                      <linearGradient id={`half-star-${i}`}>
                        <stop offset="50%" stopColor="currentColor" />
                        <stop offset="50%" stopColor="#e5e7eb" />
                      </linearGradient>
                    </defs>
                    <path
                      fill={`url(#half-star-${i})`}
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.28-3.957z"
                    />
                  </>
                ) : (
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.28-3.957z" />
                )}
              </svg>
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className={clsx('font-semibold text-gray-900', textSizeMap[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      {showCount && count !== undefined && (
        <span className={clsx('text-gray-400', textSizeMap[size])}>
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}
