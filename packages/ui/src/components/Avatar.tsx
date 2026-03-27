import clsx from 'clsx';

const sizeStyles = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

const bgColors = [
  'bg-brand-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
];

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export interface AvatarProps {
  src?: string;
  name: string;
  size?: keyof typeof sizeStyles;
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const bgColor = bgColors[hashName(name) % bgColors.length];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx('rounded-full object-cover', sizeStyles[size])}
      />
    );
  }

  return (
    <div
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-medium text-white',
        sizeStyles[size],
        bgColor,
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
