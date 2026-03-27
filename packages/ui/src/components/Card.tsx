import { type ReactNode } from 'react';
import clsx from 'clsx';

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

const variantStyles = {
  default: 'bg-white border border-gray-200/80',
  elevated: 'bg-white shadow-card',
  glass: 'bg-white/70 backdrop-blur-xl border border-white/20 shadow-card',
  flat: 'bg-surface-muted',
  outline: 'bg-transparent border border-gray-200',
};

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: keyof typeof paddingStyles;
  variant?: keyof typeof variantStyles;
  hover?: boolean;
  as?: 'div' | 'article' | 'section';
}

export function Card({
  children,
  className,
  padding = 'md',
  variant = 'default',
  hover = false,
  as: Component = 'div',
}: CardProps) {
  return (
    <Component
      className={clsx(
        'rounded-card',
        variantStyles[variant],
        paddingStyles[padding],
        hover && 'transition-all duration-card hover:shadow-card-hover hover:-translate-y-0.5',
        className,
      )}
    >
      {children}
    </Component>
  );
}
