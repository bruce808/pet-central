'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button, LoadingSpinner, StatusBadge } from '@pet-central/ui';
import { scans, scanWebsites } from '@/lib/api';

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color ?? 'text-gray-900'}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

export default function ScanDashboardPage() {
  const router = useRouter();

  const websitesQuery = useQuery({
    queryKey: ['scan', 'websites-count'],
    queryFn: () => scanWebsites.list({ limit: 1 }),
  });

  const scansQuery = useQuery({
    queryKey: ['scan', 'recent-scans'],
    queryFn: () => scans.list({ limit: 10 }),
  });

  const allScansQuery = useQuery({
    queryKey: ['scan', 'all-scans-stats'],
    queryFn: async () => {
      let page = 1;
      let totalPages = 0;
      let totalAnimals = 0;
      let totalScans = 0;
      do {
        const d = await scans.list({ limit: 100, page });
        for (const s of d.data) {
          totalPages += Number(s.pageCount ?? 0);
          totalAnimals += Number(s.listingCount ?? 0);
          totalScans++;
        }
        if (d.data.length < 100) break;
        page++;
      } while (true);
      return { totalPages, totalAnimals, totalScans };
    },
  });

  const totalWebsites = websitesQuery.data?.meta?.total ?? 0;
  const stats = allScansQuery.data ?? { totalPages: 0, totalAnimals: 0, totalScans: 0 };
  const recentScans = (scansQuery.data?.data ?? []) as Record<string, unknown>[];

  if (websitesQuery.isLoading) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Website Scanner</h2>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.push('/scan/websites')}>
            Manage Websites
          </Button>
          <Button onClick={() => router.push('/scan/websites?action=add')}>
            Add Website
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Websites" value={totalWebsites} />
        <StatCard label="Total Scans" value={stats.totalScans} />
        <StatCard label="Pages Crawled" value={stats.totalPages.toLocaleString()} />
        <StatCard label="Animals Found" value={stats.totalAnimals.toLocaleString()} color="text-brand-600" />
      </div>

      <div className="rounded-[16px] border border-gray-100 bg-white shadow-card">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Recent Scans</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {recentScans.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-gray-500">No scans yet</div>
          )}
          {recentScans.map((scan) => {
            const website = scan.website as Record<string, unknown> | undefined;
            return (
              <div
                key={String(scan.id)}
                onClick={() => router.push(`/scan/${scan.id}`)}
                className="flex cursor-pointer items-center justify-between px-6 py-3.5 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <StatusBadge status={String(scan.status ?? 'UNKNOWN')} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {website ? String(website.domain ?? '') : 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {scan.startedAt ? new Date(String(scan.startedAt)).toLocaleString() : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-xs text-gray-500">
                  <span><span className="font-semibold text-gray-700">{String(scan.pageCount ?? 0)}</span> pages</span>
                  <span><span className="font-semibold text-gray-700">{String(scan.listingCount ?? 0)}</span> animals</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
