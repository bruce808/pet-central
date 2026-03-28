'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { DataTable, StatusBadge, Badge, Pagination, LoadingSpinner } from '@pet-central/ui';
import type { Column } from '@pet-central/ui';
import { scanPromotion } from '@/lib/api';

export default function PromotionsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['scan', 'promotions', page],
    queryFn: () => scanPromotion.listBatches({ page, limit: 25 }),
  });

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'scanId',
      header: 'Scan',
      render: (row) => {
        const scan = row.scan as Record<string, unknown> | undefined;
        return (
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/scan/${row.scanId}`); }}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            {String(row.scanId ?? '').slice(0, 8)}...
          </button>
        );
      },
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={String(row.status ?? 'UNKNOWN').replace('PROMOTION_', '')} /> },
    {
      key: 'resultCount',
      header: 'Records',
      render: (row) => <span className="font-semibold">{String(row.resultCount ?? 0)}</span>,
    },
    {
      key: 'approvedBy',
      header: 'Approved By',
      render: (row) => <span className="text-sm text-gray-700">{String(row.approvedBy ?? '—')}</span>,
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
      key: 'completedAt',
      header: 'Completed',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {row.completedAt ? new Date(String(row.completedAt)).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (row) => <span className="max-w-xs truncate text-xs text-gray-500">{String(row.notes ?? '—')}</span>,
    },
  ];

  const items = (query.data?.data ?? []) as unknown as Record<string, unknown>[];
  const totalPages = Math.ceil((query.data?.meta?.total ?? 0) / 25);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Promotion Batches</h2>

      <div className="overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-card">
        <DataTable
          columns={columns}
          data={items}
          loading={query.isLoading}
          emptyMessage="No promotions yet"
        />
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
