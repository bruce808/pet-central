'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@pet-central/ui';
import { Button } from '@pet-central/ui';
import { LoadingSpinner } from '@pet-central/ui';
import { dashboard, auditLog } from '@/lib/api';
import Link from 'next/link';

interface StatCard {
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  iconBg: string;
  iconPath: string;
}

const statIcons: Record<string, { bg: string; path: string }> = {
  'Total Users': {
    bg: 'bg-blue-50 text-blue-600',
    path: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
  },
  'Active Organizations': {
    bg: 'bg-brand-50 text-brand-600',
    path: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
  },
  'Published Listings': {
    bg: 'bg-green-50 text-green-600',
    path: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
  },
  'Pending Verifications': {
    bg: 'bg-amber-50 text-amber-600',
    path: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  'Open Cases': {
    bg: 'bg-red-50 text-red-600',
    path: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
  },
  'Moderation Queue': {
    bg: 'bg-purple-50 text-purple-600',
    path: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z',
  },
};

function StatsGrid({ stats }: { stats: StatCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              {stat.label}
            </p>
            <div className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${stat.iconBg}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4.5 w-4.5 h-[18px] w-[18px]">
                <path strokeLinecap="round" strokeLinejoin="round" d={stat.iconPath} />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          {stat.trend && (
            <p
              className={`mt-1.5 text-xs font-medium ${
                stat.trend.positive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {stat.trend.positive ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="mr-0.5 inline h-3 w-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="mr-0.5 inline h-3 w-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
                </svg>
              )}
              {stat.trend.value}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ActivityFeed({ entries }: { entries: Record<string, unknown>[] }) {
  if (entries.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">No recent activity</p>;
  }
  return (
    <div className="divide-y divide-gray-50">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-start gap-3 py-3.5">
          <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium">{String(entry.actorType || 'System')}:{String(entry.actorId || '').slice(0, 8)}</span>
              {' '}{String(entry.action || 'performed action')} on{' '}
              <span className="font-medium">{String(entry.targetType || 'entity')}</span>
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
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
    <div className="rounded-[16px] border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-5 shadow-card">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
      <div className="flex h-48 items-center justify-center rounded-[10px] bg-gray-50/50 text-sm text-gray-400">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto mb-2 h-8 w-8 text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          Chart visualization coming soon
        </div>
      </div>
    </div>
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
      iconBg: statIcons['Total Users']!.bg,
      iconPath: statIcons['Total Users']!.path,
    },
    {
      label: 'Active Organizations',
      value: isLoading ? '—' : Number(raw.activeOrganizations ?? 0).toLocaleString(),
      trend: { value: '5% this month', positive: true },
      iconBg: statIcons['Active Organizations']!.bg,
      iconPath: statIcons['Active Organizations']!.path,
    },
    {
      label: 'Published Listings',
      value: isLoading ? '—' : Number(raw.publishedListings ?? 0).toLocaleString(),
      iconBg: statIcons['Published Listings']!.bg,
      iconPath: statIcons['Published Listings']!.path,
    },
    {
      label: 'Pending Verifications',
      value: isLoading ? '—' : Number(raw.pendingVerifications ?? 0),
      iconBg: statIcons['Pending Verifications']!.bg,
      iconPath: statIcons['Pending Verifications']!.path,
    },
    {
      label: 'Open Cases',
      value: isLoading ? '—' : Number(raw.openCases ?? 0),
      iconBg: statIcons['Open Cases']!.bg,
      iconPath: statIcons['Open Cases']!.path,
    },
    {
      label: 'Moderation Queue',
      value: isLoading ? '—' : Number(raw.moderationQueueSize ?? 0),
      iconBg: statIcons['Moderation Queue']!.bg,
      iconPath: statIcons['Moderation Queue']!.path,
    },
  ];

  const activityItems = (activityQuery.data?.items ?? []) as unknown as Record<string, unknown>[];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="-mx-8 -mt-8 mb-2 bg-gradient-to-b from-brand-50/60 to-transparent px-8 pb-6 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="mt-1 text-sm text-gray-500">Overview of platform operations</p>
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

      <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
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
      </div>
    </div>
  );
}
