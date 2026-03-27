'use client';

import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '@pet-central/ui';
import { analytics } from '@/lib/api';

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['vendor-analytics'],
    queryFn: analytics.getStats,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Listing Views"
          value={stats?.listingsPerformance?.reduce((sum: number, l: { views: number }) => sum + l.views, 0) ?? 0}
          color="bg-brand-50 text-brand-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Inquiries"
          value={stats?.totalInquiries ?? 0}
          color="bg-blue-50 text-blue-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          }
        />
        <StatCard
          label="Conversion Rate"
          value={`${stats?.conversionRate?.toFixed(1) ?? 0}%`}
          sub="Inquiries / Views"
          color="bg-emerald-50 text-emerald-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
        />
        <StatCard
          label="Avg Response Time"
          value={formatResponseTime(stats?.avgResponseTimeMinutes ?? 0)}
          color="bg-amber-50 text-amber-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Listings Performance */}
      <div className="rounded-[16px] border border-gray-100 bg-white shadow-card overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Listings Performance</h3>
        </div>
        {stats?.listingsPerformance?.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-400">
            No listing data available
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3.5">Listing</th>
                  <th className="px-3 py-3.5 text-right">Views</th>
                  <th className="px-3 py-3.5 text-right">Inquiries</th>
                  <th className="px-3 py-3.5 text-right">Favorites</th>
                  <th className="px-6 py-3.5 text-right">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats?.listingsPerformance?.map((listing: { id: string; title: string; views: number; inquiries: number; favorites: number }) => (
                  <tr key={listing.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-3.5 font-medium text-gray-900">
                      {listing.title}
                    </td>
                    <td className="px-3 py-3.5 text-right text-gray-600">
                      {listing.views.toLocaleString()}
                    </td>
                    <td className="px-3 py-3.5 text-right text-gray-600">
                      {listing.inquiries.toLocaleString()}
                    </td>
                    <td className="px-3 py-3.5 text-right text-gray-600">
                      {listing.favorites.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right text-gray-600">
                      {listing.views > 0
                        ? ((listing.inquiries / listing.views) * 100).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chart Placeholders */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-card">
          <h3 className="mb-4 font-semibold text-gray-900">Views Over Time</h3>
          <div className="flex h-48 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand-50/50 to-blue-50/50">
            <div className="text-center">
              <svg className="mx-auto h-10 w-10 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              <p className="mt-2 text-sm text-gray-400">Chart coming soon</p>
            </div>
          </div>
        </div>

        <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-card">
          <h3 className="mb-4 font-semibold text-gray-900">Inquiries Over Time</h3>
          <div className="flex h-48 items-center justify-center rounded-[10px] bg-gradient-to-br from-emerald-50/50 to-brand-50/50">
            <div className="text-center">
              <svg className="mx-auto h-10 w-10 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
              <p className="mt-2 text-sm text-gray-400">Chart coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={`rounded-xl p-3 ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function formatResponseTime(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
