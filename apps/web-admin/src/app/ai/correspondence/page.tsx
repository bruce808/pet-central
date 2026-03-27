'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DataTable,
  Badge,
  StatusBadge,
  Select,
  Card,
  Pagination,
  LoadingSpinner,
} from '@pet-central/ui';
import type { Column } from '@pet-central/ui';
import { AIRunStatus, AIRunType, HumanOverrideStatus } from '@pet-central/types';
import { aiCorrespondence } from '@/lib/api';

export default function AICorrespondencePage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'ai', 'correspondence', page, statusFilter, typeFilter],
    queryFn: () =>
      aiCorrespondence.listRuns({
        page,
        limit: 20,
        status: statusFilter || undefined,
        runType: typeFilter || undefined,
      }),
  });

  const items = (query.data?.items ?? []) as unknown as Record<string, unknown>[];
  const totalPages = query.data?.totalPages ?? 1;

  const overrideVariant: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
    [HumanOverrideStatus.Approved]: 'success',
    [HumanOverrideStatus.Rejected]: 'danger',
    [HumanOverrideStatus.PendingReview]: 'warning',
    [HumanOverrideStatus.None]: 'neutral',
    [HumanOverrideStatus.Modified]: 'warning',
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (row) => (
        <span className="font-mono text-xs text-gray-600">
          {String(row.id).slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'runType',
      header: 'Run Type',
      render: (row) => (
        <Badge variant="info" size="sm">
          {String(row.runType ?? '').replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'relatedEntity',
      header: 'Related Entity',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.entityType ? `${String(row.entityType)}:${String(row.entityId ?? '').slice(0, 8)}` : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={String(row.status ?? 'UNKNOWN')} />,
    },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (row) => {
        const conf = Number(row.confidence ?? 0);
        const color =
          conf >= 0.8 ? 'text-green-600' : conf >= 0.5 ? 'text-amber-600' : 'text-red-600';
        return (
          <span className={`text-sm font-semibold ${color}`}>
            {conf > 0 ? `${(conf * 100).toFixed(0)}%` : '—'}
          </span>
        );
      },
    },
    {
      key: 'overrideStatus',
      header: 'Override',
      render: (row) => {
        const status = String(row.overrideStatus ?? row.humanOverrideStatus ?? '');
        return status ? (
          <Badge variant={overrideVariant[status] ?? 'neutral'} size="sm">
            {status.replace(/_/g, ' ')}
          </Badge>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—'}
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
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">AI Correspondence</h2>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <div className="w-44">
          <Select
            placeholder="Status"
            options={Object.values(AIRunStatus).map((s) => ({
              value: s,
              label: s.replace(/_/g, ' '),
            }))}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            placeholder="Run Type"
            options={Object.values(AIRunType).map((t) => ({
              value: t,
              label: t.replace(/_/g, ' '),
            }))}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={query.isLoading}
        emptyMessage="No correspondence runs found"
        onRowClick={(row) =>
          setExpandedId(expandedId === String(row.id) ? null : String(row.id))
        }
      />

      {expandedId && (
        <Card padding="md">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Run Details
          </h4>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold text-gray-500">Input</p>
              <pre className="max-h-64 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-700">
                {JSON.stringify(
                  (items.find((i) => String(i.id) === expandedId) as Record<string, unknown>)?.input ?? {},
                  null,
                  2,
                )}
              </pre>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-gray-500">Output</p>
              <pre className="max-h-64 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-700">
                {JSON.stringify(
                  (items.find((i) => String(i.id) === expandedId) as Record<string, unknown>)?.output ?? {},
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
