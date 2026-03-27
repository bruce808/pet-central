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
        <div className="flex items-center gap-1.5 text-sm">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {String(row.actorType ?? '—')}
          </span>
          <span className="font-mono text-xs text-gray-500">
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
        <div className="flex items-center gap-1.5 text-sm">
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            {String(row.targetType ?? '—')}
          </span>
          <span className="font-mono text-xs text-gray-500">
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
          className="flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
        >
          {expanded === String(row.id) ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
              </svg>
              Hide
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
              Expand
            </>
          )}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
        <Button variant="outline" size="sm">
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export
          </span>
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
        <div className="w-40">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Actor Type</label>
          <Select
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
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Action</label>
          <input
            placeholder="Filter by action…"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="w-40">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Target Type</label>
          <input
            placeholder="e.g. USER"
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="w-40">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="w-40">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-card">
        <DataTable
          columns={columns}
          data={items}
          loading={query.isLoading}
          emptyMessage="No audit log entries found"
        />
      </div>

      {expanded && (
        <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-card animate-fade-in">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Entry Details
          </h4>
          <pre className="overflow-x-auto rounded-[10px] bg-gray-50 p-4 text-xs text-gray-700">
            {JSON.stringify(
              items.find((item) => String(item.id) === expanded) ?? {},
              null,
              2,
            )}
          </pre>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
