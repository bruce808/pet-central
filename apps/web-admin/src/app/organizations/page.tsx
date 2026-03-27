'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  DataTable,
  Badge,
  StatusBadge,
  Input,
  Select,
  Pagination,
  LoadingSpinner,
} from '@pet-central/ui';
import type { Column } from '@pet-central/ui';
import { OrgStatus, OrgType } from '@pet-central/types';
import { organizations } from '@/lib/api';

export default function OrganizationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const query = useQuery({
    queryKey: ['admin', 'organizations', page, search, statusFilter, typeFilter],
    queryFn: () =>
      organizations.list({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      }),
  });

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <span className="font-medium text-gray-900">{String(row.name)}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
          {String(row.type ?? '').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={String(row.status ?? 'UNKNOWN')} />,
    },
    {
      key: 'verificationStatus',
      header: 'Verification',
      render: (row) => (
        <StatusBadge status={String(row.verificationStatus ?? 'PENDING')} />
      ),
    },
    {
      key: 'trustScore',
      header: 'Trust Score',
      render: (row) => {
        const score = Number(row.trustScore ?? 0);
        const color =
          score >= 80
            ? 'text-green-600'
            : score >= 50
              ? 'text-amber-600'
              : 'text-red-600';
        return <span className={`text-sm font-semibold ${color}`}>{score}</span>;
      },
    },
    {
      key: 'reviewCount',
      header: 'Reviews',
      render: (row) => (
        <span className="text-sm text-gray-600">{String(row.reviewCount ?? 0)}</span>
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
      <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>

      <div className="flex flex-wrap items-center gap-3 rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
        <div className="relative w-64">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            placeholder="Search organizations…"
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
            options={Object.values(OrgStatus).map((s) => ({
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
            options={Object.values(OrgType).map((t) => ({
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

      <div className="overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-card">
        <DataTable
          columns={columns}
          data={items}
          loading={query.isLoading}
          emptyMessage="No organizations found"
          onRowClick={(row) => router.push(`/organizations/${row.id}`)}
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
