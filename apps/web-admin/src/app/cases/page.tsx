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
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
          {String(row.type).replace(/_/g, ' ')}
        </span>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Cases</h2>
        <Button variant="primary" size="sm">
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Case
          </span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
        <div className="relative w-64">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            placeholder="Search cases…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-[10px] border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
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
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          Assigned to me
        </label>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-card">
        <DataTable
          columns={columns}
          data={items}
          loading={query.isLoading}
          emptyMessage="No cases found"
          onRowClick={(row) => router.push(`/cases/${row.id}`)}
        />
      </div>

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
