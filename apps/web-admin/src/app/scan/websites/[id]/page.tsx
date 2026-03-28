'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, LoadingSpinner, StatusBadge, Badge, DataTable } from '@pet-central/ui';
import type { Column } from '@pet-central/ui';
import { scanWebsites, scans } from '@/lib/api';

export default function WebsiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const websiteQuery = useQuery({
    queryKey: ['scan', 'website', id],
    queryFn: () => scanWebsites.getById(id),
  });

  const scansQuery = useQuery({
    queryKey: ['scan', 'website-scans', id],
    queryFn: () => scanWebsites.getScans(id, { limit: 50 }),
  });

  const scanMutation = useMutation({
    mutationFn: () => scans.start({ websiteId: id, sync: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scan'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: () => scanWebsites.update(id, { active: !website?.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scan', 'website', id] }),
  });

  const website = websiteQuery.data as Record<string, unknown> | undefined;
  const scanList = (scansQuery.data?.data ?? []) as Record<string, unknown>[];

  if (websiteQuery.isLoading) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (!website) {
    return <div className="py-12 text-center text-gray-500">Website not found</div>;
  }

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={String(row.status ?? 'UNKNOWN')} />,
    },
    {
      key: 'startedAt',
      header: 'Started',
      render: (row) => (
        <span className="text-sm text-gray-700">
          {row.startedAt ? new Date(String(row.startedAt)).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'scanType',
      header: 'Type',
      render: (row) => <Badge variant="neutral">{String(row.scanType ?? '')}</Badge>,
    },
    {
      key: 'pageCount',
      header: 'Pages',
      render: (row) => <span className="font-semibold">{String(row.pageCount ?? 0)}</span>,
    },
    {
      key: 'listingCount',
      header: 'Animals',
      render: (row) => {
        const count = Number(row.listingCount ?? 0);
        return (
          <span className={`font-semibold ${count > 0 ? 'text-brand-600' : 'text-gray-500'}`}>
            {count}
          </span>
        );
      },
    },
    {
      key: 'completedAt',
      header: 'Duration',
      render: (row) => {
        if (!row.startedAt || !row.completedAt) return <span className="text-gray-400">—</span>;
        const ms = new Date(String(row.completedAt)).getTime() - new Date(String(row.startedAt)).getTime();
        return <span className="text-xs text-gray-500">{(ms / 1000).toFixed(1)}s</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push('/scan/websites')} className="mb-2 text-sm text-brand-600 hover:underline">
            &larr; All Websites
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{String(website.domain)}</h2>
          <p className="text-sm text-gray-500">{String(website.baseUrl)}</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => toggleMutation.mutate()}
          >
            {website.active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
          >
            {scanMutation.isPending ? 'Starting...' : 'Start Scan'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase text-gray-400">Status</p>
          <div className="mt-1"><StatusBadge status={website.active ? 'ACTIVE' : 'INACTIVE'} /></div>
        </div>
        <div className="rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase text-gray-400">Source Type</p>
          <p className="mt-1 text-lg font-semibold text-gray-900 capitalize">{String(website.sourceType ?? '').replace(/_/g, ' ')}</p>
        </div>
        <div className="rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase text-gray-400">Total Scans</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{String(website.scanCount ?? 0)}</p>
        </div>
        <div className="rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase text-gray-400">Organization Hint</p>
          <p className="mt-1 text-sm text-gray-700">{String(website.organizationHint ?? '—')}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-card">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Scan History</h3>
        </div>
        <DataTable
          columns={columns}
          data={scanList}
          loading={scansQuery.isLoading}
          emptyMessage="No scans yet for this website"
          onRowClick={(row) => router.push(`/scan/${row.id}`)}
        />
      </div>
    </div>
  );
}
