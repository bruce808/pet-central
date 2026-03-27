import { Badge } from '@pet-central/ui';

interface TrustBadgeProps {
  label: string;
  verified?: boolean;
  className?: string;
}

export function TrustBadge({ label, verified = true, className }: TrustBadgeProps) {
  return (
    <Badge variant={verified ? 'success' : 'warning'} className={className}>
      <span className="flex items-center gap-1">
        {verified ? (
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-1.065-3.588 3 3 0 00-3.753-1.065 3 3 0 00-5.304 0 3 3 0 00-3.588 1.065 3 3 0 00-1.065 3.753 3 3 0 000 5.304 3 3 0 001.065 3.588 3 3 0 003.753 1.065 3 3 0 005.304 0 3 3 0 003.588-1.065 3 3 0 001.065-3.753zm-4.21-5.36a.75.75 0 00-1.19-.914l-4.085 5.32-1.81-1.72a.75.75 0 00-1.032 1.088l2.429 2.308a.75.75 0 001.11-.087l4.578-5.994z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {label}
      </span>
    </Badge>
  );
}
