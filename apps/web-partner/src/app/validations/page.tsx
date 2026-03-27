'use client';

import { useQuery } from '@tanstack/react-query';
import { DataTable, Badge, LoadingSpinner } from '@pet-central/ui';
import { useRouter } from 'next/navigation';
import { validations } from '@/lib/api';
import type { Column } from '@pet-central/ui';

export default function PartnerValidationsPage() {
  const router = useRouter();
  const query = useQuery({
    queryKey: ['partner', 'validations'],
    queryFn: () => validations.listPending(),
  });

  const data = (query.data?.items ?? []) as unknown as Record<string, unknown>[];

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'publicName',
      header: 'Organization Name',
      render: (row) => (
        <span className="text-sm font-semibold text-gray-900">
          {String(row.publicName ?? row.legalName ?? '\u2014')}
        </span>
      ),
    },
    {
      key: 'organizationType',
      header: 'Org Type',
      render: (row) => (
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          {String(row.organizationType ?? '').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'verificationType',
      header: 'Verification Type',
      render: (row) => (
        <Badge variant="info">
          {String(row.verificationType ?? 'STANDARD').replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted Date',
      render: (row) =>
        row.submittedAt ? (
          <span className="text-sm text-gray-600">
            {new Date(String(row.submittedAt)).toLocaleDateString()}
          </span>
        ) : row.createdAt ? (
          <span className="text-sm text-gray-600">
            {new Date(String(row.createdAt)).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-sm text-gray-300">&mdash;</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge
          variant={
            String(row.status) === 'PENDING'
              ? 'warning'
              : String(row.status) === 'VERIFIED'
                ? 'success'
                : 'neutral'
          }
        >
          {String(row.status ?? '').replace(/_/g, ' ')}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Vendor Validations</h2>
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-card">
          <DataTable
            columns={columns}
            data={data}
            onRowClick={(row) => router.push(`/validations/${String(row.id)}`)}
          />
        </div>
      )}
    </div>
  );
}
