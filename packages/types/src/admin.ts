import { AuditActorType } from './enums';
import { PaginationQuery } from './common';

export interface ModerateContentDto {
  action: 'approve' | 'reject' | 'flag' | 'requires_review';
  reason?: string;
}

export interface DashboardStatsResponse {
  totalUsers: number;
  totalOrganizations: number;
  totalListings: number;
  pendingVerifications: number;
  openCases: number;
  moderationQueueSize: number;
  recentSignups: {
    id: string;
    displayName: string;
    email: string;
    createdAt: string;
  }[];
  listingsByType: Record<string, number>;
}

export interface AuditLogQuery extends PaginationQuery {
  actorType?: AuditActorType;
  actorId?: string;
  actionType?: string;
  targetType?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditLogResponse {
  id: string;
  actorType: AuditActorType;
  actorId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
