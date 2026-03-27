import clsx from 'clsx';

type SkeletonVariant = 'rectangle' | 'circle' | 'text';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number;
}

export function Skeleton({
  variant = 'rectangle',
  width,
  height,
  className,
  lines = 1,
}: SkeletonProps) {
  const baseStyles = 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer';

  if (variant === 'text' && lines > 1) {
    return (
      <div className={clsx('flex flex-col gap-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx(baseStyles, 'h-4 rounded-md', i === lines - 1 && 'w-3/4')}
            style={{ width: i === lines - 1 ? '75%' : width, animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div
        className={clsx(baseStyles, 'rounded-full', className)}
        style={{ width: width ?? 40, height: height ?? width ?? 40 }}
      />
    );
  }

  return (
    <div
      className={clsx(baseStyles, 'rounded-card', className)}
      style={{ width, height }}
    />
  );
}
