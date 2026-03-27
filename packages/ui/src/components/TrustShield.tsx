import clsx from 'clsx';

type TrustLevel = 'verified' | 'pending' | 'unverified' | 'premium';

export interface TrustShieldProps {
  level: TrustLevel;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const levelConfig = {
  verified: {
    colors: 'text-trust-verified bg-green-50 ring-green-200',
    defaultLabel: 'Verified',
  },
  pending: {
    colors: 'text-trust-pending bg-amber-50 ring-amber-200',
    defaultLabel: 'Pending',
  },
  unverified: {
    colors: 'text-gray-400 bg-gray-50 ring-gray-200',
    defaultLabel: 'Unverified',
  },
  premium: {
    colors: 'text-brand-700 bg-brand-50 ring-brand-200',
    defaultLabel: 'Premium Verified',
  },
};

const sizeMap = {
  sm: { icon: 'h-3.5 w-3.5', text: 'text-xs', padding: 'px-2 py-0.5 gap-1' },
  md: { icon: 'h-4 w-4', text: 'text-sm', padding: 'px-2.5 py-1 gap-1.5' },
  lg: { icon: 'h-5 w-5', text: 'text-sm', padding: 'px-3 py-1.5 gap-1.5' },
};

function ShieldIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 1a.75.75 0 01.57.27l6 7A.75.75 0 0116 9.5h-2.25v5.25a.75.75 0 01-.75.75h-6a.75.75 0 01-.75-.75V9.5H4a.75.75 0 01-.57-1.23l6-7A.75.75 0 0110 1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckShieldIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

export function TrustShield({
  level,
  label,
  size = 'md',
  showLabel = true,
  className,
}: TrustShieldProps) {
  const config = levelConfig[level];
  const sizeConfig = sizeMap[size];
  const displayLabel = label ?? config.defaultLabel;

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-pill ring-1 ring-inset',
        config.colors,
        sizeConfig.padding,
        sizeConfig.text,
        className,
      )}
    >
      {level === 'verified' || level === 'premium' ? (
        <CheckShieldIcon className={sizeConfig.icon} />
      ) : (
        <ShieldIcon className={sizeConfig.icon} />
      )}
      {showLabel && displayLabel}
    </span>
  );
}
