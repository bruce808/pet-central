'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DataTable,
  Badge,
  Button,
  Input,
  Select,
  Pagination,
  Card,
  LoadingSpinner,
} from '@pet-central/ui';
import type { Column } from '@pet-central/ui';
import { AuditActorType } from '@pet-central/types';
import { auditLog } from '@/lib/api';

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [actorType, setActorType] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [targetType, setTargetType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'audit-log', page, actorType, actionFilter, targetType, dateFrom, dateTo],
    queryFn: () =>
      auditLog.search({
        page,
        limit: 25,
        actorType: actorType || undefined,
        action: actionFilter || undefined,
        targetType: targetType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      } as never),
  });

  const items = (query.data?.items ?? []) as unknown as Record<string, unknown>[];
  const totalPages = query.data?.totalPages ?? 1;

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-gray-600">
          {row.createdAt
            ? new Date(String(row.createdAt)).toLocaleString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (row) => (
        <div className="text-sm">
          <Badge variant="neutral" size="sm">
            {String(row.actorType ?? '—')}
          </Badge>
          <span className="ml-1 font-mono text-xs text-gray-500">
            {String(row.actorId ?? '').slice(0, 8)}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <span className="text-sm font-medium text-gray-800">
          {String(row.action ?? '—')}
        </span>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      render: (row) => (
        <div className="text-sm">
          <Badge variant="info" size="sm">
            {String(row.targetType ?? '—')}
          </Badge>
          <span className="ml-1 font-mono text-xs text-gray-500">
            {String(row.targetId ?? '').slice(0, 8)}
          </span>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(expanded === String(row.id) ? null : String(row.id));
          }}
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          {expanded === String(row.id) ? 'Hide' : 'Expand'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Audit Log</h2>
        <Button variant="outline" size="sm">
          Export
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <div className="w-40">
          <Select
            label="Actor Type"
            placeholder="All"
            options={Object.values(AuditActorType).map((t) => ({
              value: t,
              label: t.replace(/_/g, ' '),
            }))}
            value={actorType}
            onChange={(e) => {
              setActorType(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-48">
          <Input
            label="Action"
            placeholder="Filter by action…"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Input
            label="Target Type"
            placeholder="e.g. USER"
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Input
            label="From"
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Input
            label="To"
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={query.isLoading}
        emptyMessage="No audit log entries found"
      />

      {expanded && (
        <Card padding="md">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Entry Details
          </h4>
          <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-xs text-gray-700">
            {JSON.stringify(
              items.find((item) => String(item.id) === expanded) ?? {},
              null,
              2,
            )}
          </pre>
        </Card>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
