'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Badge, Button, LoadingSpinner } from '@pet-central/ui';
import { analytics } from '@/lib/api';

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

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['vendor-stats'],
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
      {/* Gradient Welcome Header */}
      <div className="bg-gradient-to-b from-brand-50/60 to-transparent -mx-8 -mt-8 px-8 pt-8 pb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s what&apos;s happening with your organization today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Active Listings"
          value={stats?.activeListings ?? 0}
          sub={`${stats?.totalListings ?? 0} total`}
          color="bg-brand-50 text-brand-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
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
          label="Reviews"
          value={stats?.averageRating?.toFixed(1) ?? '—'}
          sub={`${stats?.totalReviews ?? 0} total`}
          color="bg-amber-50 text-amber-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          }
        />
        <StatCard
          label="Response Rate"
          value={`${stats?.responseRate ?? 0}%`}
          color="bg-emerald-50 text-emerald-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Pending Verifications"
          value={stats?.pendingVerifications ?? 0}
          color="bg-purple-50 text-purple-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Inquiries */}
        <div className="lg:col-span-2">
          <div className="rounded-[16px] border border-gray-100 bg-white shadow-card overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="font-semibold text-gray-900">Recent Inquiries</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {stats?.recentInquiries?.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-gray-400">
                  No recent inquiries
                </p>
              )}
              {stats?.recentInquiries?.slice(0, 5).map((inq) => (
                <Link
                  key={inq.id}
                  href="/messages"
                  className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-semibold text-white">
                    {inq.userName?.[0] ?? 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {inq.userName}
                      </p>
                      {inq.unread && (
                        <span className="h-2 w-2 rounded-full bg-brand-500" />
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-500">
                      {inq.listingTitle}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {inq.lastMessage}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-gray-400">
                    {new Date(inq.createdAt).toLocaleDateString()}
                  </time>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Action Items + Quick Actions */}
        <div className="space-y-4">
          <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-card">
            <h3 className="mb-4 font-semibold text-gray-900">Action Items</h3>
            <div className="space-y-2">
              <ActionItem
                href="/organization/documents"
                label="Pending document reviews"
                count={stats?.actionItems?.pendingDocuments ?? 0}
              />
              <ActionItem
                href="/messages"
                label="Unanswered messages"
                count={stats?.actionItems?.unansweredMessages ?? 0}
              />
              <ActionItem
                href="/reviews"
                label="New reviews to respond to"
                count={stats?.actionItems?.newReviews ?? 0}
              />
            </div>
          </div>

          <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-card">
            <h3 className="mb-4 font-semibold text-gray-900">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/listings/new" className="block">
                <Button variant="primary" size="md" className="w-full">
                  Create Listing
                </Button>
              </Link>
              <Link href="/messages" className="block">
                <Button variant="outline" size="md" className="w-full">
                  View Messages
                </Button>
              </Link>
              <Link href="/organization/documents" className="block">
                <Button variant="outline" size="md" className="w-full">
                  Upload Documents
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionItem({
  href,
  label,
  count,
}: {
  href: string;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-[10px] p-2.5 transition-all duration-150 hover:bg-gray-50"
    >
      <span className="text-sm text-gray-600">{label}</span>
      <Badge variant={count > 0 ? 'warning' : 'success'} size="sm">
        {count}
      </Badge>
    </Link>
  );
}
