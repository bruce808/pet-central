'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@pet-central/ui';
import { Badge } from '@pet-central/ui';
import { Button } from '@pet-central/ui';
import { LoadingSpinner } from '@pet-central/ui';
import { dashboard, auditLog } from '@/lib/api';
import Link from 'next/link';

interface StatCard {
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  color: string;
}

function StatsGrid({ stats }: { stats: StatCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label} padding="md">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {stat.label}
          </p>
          <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          {stat.trend && (
            <p
              className={`mt-1 text-xs font-medium ${
                stat.trend.positive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {stat.trend.positive ? '↑' : '↓'} {stat.trend.value}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

function ActivityFeed({ entries }: { entries: Record<string, unknown>[] }) {
  if (entries.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">No recent activity</p>;
  }
  return (
    <div className="divide-y divide-gray-100">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-start gap-3 py-3">
          <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium">{String(entry.actorType || 'System')}:{String(entry.actorId || '').slice(0, 8)}</span>
              {' '}{String(entry.action || 'performed action')} on{' '}
              <span className="font-medium">{String(entry.targetType || 'entity')}</span>
            </p>
            <p className="text-xs text-gray-400">
              {entry.createdAt ? new Date(String(entry.createdAt)).toLocaleString() : 'Just now'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <Card padding="md">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
      <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
        Chart visualization coming soon
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const statsQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => dashboard.getStats(),
  });

  const activityQuery = useQuery({
    queryKey: ['admin', 'audit-log', 'recent'],
    queryFn: () => auditLog.search({ page: 1, limit: 10 } as never),
  });

  const isLoading = statsQuery.isLoading;
  const raw = (statsQuery.data ?? {}) as Record<string, unknown>;

  const stats: StatCard[] = [
    {
      label: 'Total Users',
      value: isLoading ? '—' : Number(raw.totalUsers ?? 0).toLocaleString(),
      trend: { value: '12% this month', positive: true },
      color: 'text-gray-900',
    },
    {
      label: 'Active Organizations',
      value: isLoading ? '—' : Number(raw.activeOrganizations ?? 0).toLocaleString(),
      trend: { value: '5% this month', positive: true },
      color: 'text-gray-900',
    },
    {
      label: 'Published Listings',
      value: isLoading ? '—' : Number(raw.publishedListings ?? 0).toLocaleString(),
      color: 'text-gray-900',
    },
    {
      label: 'Pending Verifications',
      value: isLoading ? '—' : Number(raw.pendingVerifications ?? 0),
      color: 'text-amber-600',
    },
    {
      label: 'Open Cases',
      value: isLoading ? '—' : Number(raw.openCases ?? 0),
      color: 'text-red-600',
    },
    {
      label: 'Moderation Queue',
      value: isLoading ? '—' : Number(raw.moderationQueueSize ?? 0),
      color: 'text-blue-600',
    },
  ];

  const activityItems = (activityQuery.data?.items ?? []) as unknown as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Overview of platform operations</p>
        </div>
        <div className="flex gap-2">
          <Link href="/organizations?tab=verifications">
            <Button variant="outline" size="sm">Review Verifications</Button>
          </Link>
          <Link href="/moderation">
            <Button variant="outline" size="sm">Process Queue</Button>
          </Link>
          <Link href="/cases">
            <Button variant="primary" size="sm">View Cases</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <StatsGrid stats={stats} />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartPlaceholder title="Signups Over Time" />
        <ChartPlaceholder title="Listings by Pet Type" />
        <ChartPlaceholder title="Cases by Status" />
      </div>

      <Card padding="md">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Recent Activity</h3>
          <Link href="/audit-log">
            <Badge variant="neutral">View all</Badge>
          </Link>
        </div>
        {activityQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <ActivityFeed entries={activityItems} />
        )}
      </Card>
    </div>
  );
}
