'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { DataTable, StatusBadge, Badge, Select, Pagination, LoadingSpinner } from '@pet-central/ui';
import type { Column } from '@pet-central/ui';
import { scans } from '@/lib/api';

export default function ScanHistoryPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const query = useQuery({
    queryKey: ['scan', 'history', page, statusFilter],
    queryFn: () => scans.list({ page, limit: 25, status: statusFilter || undefined }),
  });

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'website',
      header: 'Website',
      render: (row) => {
        const w = row.website as Record<string, unknown> | undefined;
        return <span className="text-sm font-medium text-gray-900">{w ? String(w.domain) : '—'}</span>;
      },
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={String(row.status ?? 'UNKNOWN')} /> },
    { key: 'scanType', header: 'Type', render: (row) => <Badge variant="neutral">{String(row.scanType ?? '')}</Badge> },
    { key: 'triggerType', header: 'Trigger', render: (row) => <span className="text-xs text-gray-500">{String(row.triggerType ?? '')}</span> },
    {
      key: 'pageCount',
      header: 'Pages',
      render: (row) => <span className="font-semibold">{String(row.pageCount ?? 0)}</span>,
    },
    {
      key: 'listingCount',
      header: 'Animals',
      render: (row) => {
        const n = Number(row.listingCount ?? 0);
        return <span className={`font-semibold ${n > 0 ? 'text-brand-600' : 'text-gray-500'}`}>{n}</span>;
      },
    },
    {
      key: 'startedAt',
      header: 'Started',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {row.startedAt ? new Date(String(row.startedAt)).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (row) => {
        if (!row.startedAt || !row.completedAt) return <span className="text-gray-400">—</span>;
        const ms = new Date(String(row.completedAt)).getTime() - new Date(String(row.startedAt)).getTime();
        return <span className="text-xs text-gray-500">{(ms / 1000).toFixed(1)}s</span>;
      },
    },
  ];

  const items = (query.data?.data ?? []) as unknown as Record<string, unknown>[];
  const totalPages = Math.ceil((query.data?.meta?.total ?? 0) / 25);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Scan History</h2>

      <div className="flex items-center gap-3 rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'RUNNING', label: 'Running' },
            { value: 'FAILED', label: 'Failed' },
            { value: 'PARTIAL', label: 'Partial' },
          ]}
        />
        <span className="text-sm text-gray-500">
          {query.data?.meta?.total ?? 0} total scans
        </span>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-card">
        <DataTable
          columns={columns}
          data={items}
          loading={query.isLoading}
          emptyMessage="No scans found"
          onRowClick={(row) => router.push(`/scan/${row.id}`)}
        />
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
