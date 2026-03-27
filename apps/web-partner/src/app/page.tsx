'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge, Button, LoadingSpinner } from '@pet-central/ui';
import Link from 'next/link';
import { dashboard, cases, validations } from '@/lib/api';

function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  trend?: string;
}) {
  return (
    <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-3 ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        {trend && (
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}

export default function PartnerDashboardPage() {
  const statsQuery = useQuery({
    queryKey: ['partner', 'dashboard', 'stats'],
    queryFn: dashboard.getStats,
  });

  const casesQuery = useQuery({
    queryKey: ['partner', 'cases', 'recent'],
    queryFn: () => cases.listAssigned({ limit: 5, sort: '-createdAt' }),
  });

  const validationsQuery = useQuery({
    queryKey: ['partner', 'validations', 'recent'],
    queryFn: () => validations.listPending({ limit: 5 }),
  });

  const stats = statsQuery.data;
  const recentCases = (casesQuery.data?.items ?? []) as unknown as Record<string, unknown>[];
  const pendingValidations = (validationsQuery.data?.items ?? []) as unknown as Record<string, unknown>[];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-b from-brand-50/60 to-transparent -mx-8 -mt-8 px-8 pt-8 pb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back</h2>
        <p className="mt-1 text-gray-500">Here&apos;s what&apos;s happening with your partner dashboard today.</p>
      </div>

      {/* Stats Grid */}
      {statsQuery.isLoading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            }
            iconBg="bg-brand-50"
            iconColor="text-brand-600"
            label="Assigned Cases"
            value={stats?.assignedCases ?? 0}
          />
          <StatCard
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            label="Pending Validations"
            value={stats?.pendingValidations ?? 0}
          />
          <StatCard
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            label="Completed This Month"
            value={stats?.completedThisMonth ?? 0}
            trend="+12%"
          />
          <StatCard
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            }
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            label="Avg Resolution Time"
            value={stats?.avgResolutionTime ?? '—'}
          />
        </div>
      )}

      {/* Active Cases & Pending Validations */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[16px] border border-gray-100 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-semibold text-gray-900">Active Cases</h3>
            <Link href="/cases">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          <div className="p-4">
            {casesQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : recentCases.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No active cases</p>
            ) : (
              <div className="space-y-2">
                {recentCases.map((c) => (
                  <Link
                    key={String(c.id)}
                    href={`/cases/${String(c.id)}`}
                    className="flex items-center justify-between rounded-[10px] border border-gray-50 p-3.5 hover:bg-brand-50/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {String(c.type ?? 'Case').replace(/_/g, ' ')}
                        </p>
                        <p className="font-mono text-xs text-gray-400">
                          {String(c.id ?? '').slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        String(c.status) === 'OPEN'
                          ? 'warning'
                          : String(c.status) === 'IN_PROGRESS'
                            ? 'info'
                            : 'neutral'
                      }
                    >
                      {String(c.status ?? '').replace(/_/g, ' ')}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[16px] border border-gray-100 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-semibold text-gray-900">Pending Validations</h3>
            <Link href="/validations">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          <div className="p-4">
            {validationsQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : pendingValidations.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No pending validations
              </p>
            ) : (
              <div className="space-y-2">
                {pendingValidations.map((v) => (
                  <Link
                    key={String(v.id)}
                    href={`/validations/${String(v.id)}`}
                    className="flex items-center justify-between rounded-[10px] border border-gray-50 p-3.5 hover:bg-brand-50/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                        <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {String(v.publicName ?? v.legalName ?? 'Organization')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {String(v.organizationType ?? '').replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4 text-base font-semibold text-gray-900">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: '/cases',
              label: 'View Cases',
              desc: 'Review assigned cases',
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              ),
            },
            {
              href: '/validations',
              label: 'Review Validations',
              desc: 'Pending vendor reviews',
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              ),
            },
            {
              href: '/organization',
              label: 'Organization',
              desc: 'Update your profile',
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              ),
            },
            {
              href: '/members',
              label: 'Manage Members',
              desc: 'Invite & manage team',
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
              ),
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center gap-3 rounded-[16px] border border-gray-200 bg-white p-6 text-center hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-card transition-all duration-200 cursor-pointer"
            >
              <div className="rounded-xl bg-gray-50 p-3 text-gray-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-all duration-200">
                {action.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
