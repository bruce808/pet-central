'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { DataTable, Badge, Button, Input, Select, LoadingSpinner } from '@pet-central/ui';
import type { Column } from '@pet-central/ui';
import { Pagination } from '@pet-central/ui';
import { CaseStatus, CaseType, CasePriority } from '@pet-central/types';
import { cases } from '@/lib/api';

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  [CaseStatus.NewCase]: 'warning',
  [CaseStatus.Investigating]: 'info',
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

export default function CasesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignedToMe, setAssignedToMe] = useState(false);

  const query = useQuery({
    queryKey: ['admin', 'cases', page, search, statusFilter, typeFilter, priorityFilter, assignedToMe],
    queryFn: () =>
      cases.list({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        priority: priorityFilter || undefined,
        assignedToMe: assignedToMe || undefined,
      }),
  });

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
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge variant="info" size="sm">
          {String(row.type).replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => (
        <Badge variant={priorityVariant[String(row.priority)] ?? 'neutral'} size="sm">
          {String(row.priority)}
        </Badge>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (row) => (
        <span className="text-sm text-gray-700">{String(row.severity)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={statusVariant[String(row.status)] ?? 'neutral'} size="sm">
          {String(row.status).replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.assignedTo ? String(row.assignedTo).slice(0, 8) : '—'}
        </span>
      ),
    },
    {
      key: 'region',
      header: 'Region',
      render: (row) => (
        <span className="text-sm text-gray-600">{String(row.region || '—')}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {row.createdAt
            ? new Date(String(row.createdAt)).toLocaleDateString()
            : '—'}
        </span>
      ),
    },
  ];

  const items = (query.data?.items ?? []) as unknown as Record<string, unknown>[];
  const totalPages = query.data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Cases</h2>
        <Button variant="primary" size="sm">
          + New Case
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <div className="w-64">
          <Input
            placeholder="Search cases…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Select
            placeholder="Status"
            options={Object.values(CaseStatus).map((s) => ({
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
        <div className="w-40">
          <Select
            placeholder="Type"
            options={Object.values(CaseType).map((t) => ({
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
        <div className="w-40">
          <Select
            placeholder="Priority"
            options={Object.values(CasePriority).map((p) => ({
              value: p,
              label: p,
            }))}
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={assignedToMe}
            onChange={(e) => {
              setAssignedToMe(e.target.checked);
              setPage(1);
            }}
            className="rounded border-gray-300"
          />
          Assigned to me
        </label>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={query.isLoading}
        emptyMessage="No cases found"
        onRowClick={(row) => router.push(`/cases/${row.id}`)}
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
