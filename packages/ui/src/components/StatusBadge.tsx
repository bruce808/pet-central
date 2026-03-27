import { Badge, type BadgeProps } from './Badge';

const DEFAULT_STATUS_MAP: Record<string, BadgeProps['variant']> = {
  ACTIVE: 'success',
  APPROVED: 'success',
  PUBLISHED: 'success',
  PENDING: 'warning',
  PENDING_REVIEW: 'warning',
  SUSPENDED: 'danger',
  REJECTED: 'danger',
  BANNED: 'danger',
  DRAFT: 'neutral',
};

export interface StatusBadgeProps {
  status: string;
  statusMap?: Record<string, BadgeProps['variant']>;
}

export function StatusBadge({ status, statusMap }: StatusBadgeProps) {
  const map = { ...DEFAULT_STATUS_MAP, ...statusMap };
  const variant = map[status] ?? 'neutral';

  return (
    <Badge variant={variant}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
