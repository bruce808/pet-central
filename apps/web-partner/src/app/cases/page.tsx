'use client';

import { useQuery } from '@tanstack/react-query';
import { DataTable, Badge, LoadingSpinner } from '@pet-central/ui';
import { CaseStatus, CasePriority } from '@pet-central/types';
import { useRouter } from 'next/navigation';
import { cases } from '@/lib/api';
import type { Column } from '@pet-central/ui';

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  [CaseStatus.NewCase]: 'warning',
  [CaseStatus.Triaged]: 'info',
  [CaseStatus.AwaitingDocs]: 'warning',
  [CaseStatus.Assigned]: 'info',
  [CaseStatus.Investigating]: 'info',
  [CaseStatus.PendingPartner]: 'warning',
  [CaseStatus.Escalated]: 'danger',
  [CaseStatus.Resolved]: 'success',
  [CaseStatus.Closed]: 'neutral',
};

const priorityVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  [CasePriority.Low]: 'neutral',
  [CasePriority.Medium]: 'info',
  [CasePriority.High]: 'warning',
  [CasePriority.Critical]: 'danger',
};

export default function PartnerCasesPage() {
  const router = useRouter();
  const query = useQuery({
    queryKey: ['partner', 'cases'],
    queryFn: () => cases.listAssigned(),
  });

  const data = (query.data?.items ?? []) as unknown as Record<string, unknown>[];

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'id',
      header: 'Case ID',
      render: (row) => (
        <span className="rounded-md bg-gray-50 px-2 py-1 font-mono text-xs font-medium text-gray-700">
          {String(row.id ?? '').slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className="text-sm font-medium text-gray-900">
          {String(row.type ?? '').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => (
        <Badge variant={priorityVariant[String(row.priority)] ?? 'neutral'}>
          {String(row.priority ?? '')}
        </Badge>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (row) => row.severity ? (
        <span className="text-sm text-gray-600">Sev {String(row.severity)}</span>
      ) : (
        <span className="text-sm text-gray-300">&mdash;</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={statusVariant[String(row.status)] ?? 'neutral'}>
          {String(row.status ?? '').replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'assignedAt',
      header: 'Assigned Date',
      render: (row) =>
        row.assignedAt ? (
          <span className="text-sm text-gray-600">
            {new Date(String(row.assignedAt)).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-sm text-gray-300">&mdash;</span>
        ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (row) =>
        row.dueDate ? (
          <span className="text-sm text-gray-600">
            {new Date(String(row.dueDate)).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-sm text-gray-300">&mdash;</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Assigned Cases</h2>
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
            onRowClick={(row) => router.push(`/cases/${String(row.id)}`)}
          />
        </div>
      )}
    </div>
  );
}
