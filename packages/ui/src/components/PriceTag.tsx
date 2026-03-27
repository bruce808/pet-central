import clsx from 'clsx';

export interface PriceTagProps {
  amount: number | null;
  currency?: string;
  type?: 'sale' | 'adoption' | 'free';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PriceTag({
  amount,
  currency = 'USD',
  type = 'sale',
  size = 'md',
  className,
}: PriceTagProps) {
  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  if (type === 'free' || amount === 0) {
    return (
      <span className={clsx('font-semibold text-brand-600', sizeStyles[size], className)}>
        Free
      </span>
    );
  }

  if (type === 'adoption') {
    return (
      <span className={clsx('font-semibold text-blue-600', sizeStyles[size], className)}>
        {amount !== null ? (
          <>Adoption Fee: {formatPrice(amount, currency)}</>
        ) : (
          'Contact for details'
        )}
      </span>
    );
  }

  if (amount === null) {
    return (
      <span className={clsx('text-gray-500 italic', sizeStyles[size], className)}>
        Contact for price
      </span>
    );
  }

  return (
    <span className={clsx('font-bold text-gray-900', sizeStyles[size], className)}>
      {formatPrice(amount, currency)}
    </span>
  );
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
