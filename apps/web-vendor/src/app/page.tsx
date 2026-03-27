'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, Badge, Button, LoadingSpinner } from '@pet-central/ui';
import { analytics } from '@/lib/api';

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card padding="md">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </Card>
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
      <div>
        <h2 className="text-xl font-bold text-gray-900">
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
        />
        <StatCard
          label="Total Inquiries"
          value={stats?.totalInquiries ?? 0}
        />
        <StatCard
          label="Reviews"
          value={stats?.averageRating?.toFixed(1) ?? '—'}
          sub={`${stats?.totalReviews ?? 0} total`}
        />
        <StatCard
          label="Response Rate"
          value={`${stats?.responseRate ?? 0}%`}
        />
        <StatCard
          label="Pending Verifications"
          value={stats?.pendingVerifications ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Inquiries */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="font-semibold text-gray-900">Recent Inquiries</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {stats?.recentInquiries?.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-gray-400">
                  No recent inquiries
                </p>
              )}
              {stats?.recentInquiries?.slice(0, 5).map((inq) => (
                <Link
                  key={inq.id}
                  href="/messages"
                  className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-gray-50"
                >
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
          </Card>
        </div>

        {/* Action Items */}
        <div className="space-y-4">
          <Card padding="md">
            <h3 className="mb-4 font-semibold text-gray-900">Action Items</h3>
            <div className="space-y-3">
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
          </Card>

          <Card padding="md">
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
          </Card>
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
      className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-gray-50"
    >
      <span className="text-sm text-gray-600">{label}</span>
      <Badge variant={count > 0 ? 'warning' : 'success'} size="sm">
        {count}
      </Badge>
    </Link>
  );
}
