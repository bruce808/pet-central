'use client';

import clsx from 'clsx';

export interface FilterChipProps {
  label: string;
  onRemove?: () => void;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FilterChip({
  label,
  onRemove,
  active = true,
  onClick,
  className,
}: FilterChipProps) {
  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={clsx(
        'inline-flex items-center gap-1 rounded-pill text-sm font-medium transition-all',
        active
          ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200 px-3 py-1'
          : 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200 px-3 py-1 hover:bg-gray-200',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-brand-200 transition-colors"
          aria-label={`Remove ${label} filter`}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
