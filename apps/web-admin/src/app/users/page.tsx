'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DataTable,
  Badge,
  StatusBadge,
  Button,
  Input,
  Modal,
  Card,
  Select,
  Pagination,
  LoadingSpinner,
} from '@pet-central/ui';
import type { Column } from '@pet-central/ui';
import { UserStatus, RiskLevel } from '@pet-central/types';
import { users } from '@/lib/api';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<Record<string, unknown> | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => users.list({ page, limit: 20, search: search || undefined }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      users.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSelectedUser(null);
    },
  });

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-xs font-semibold text-brand-700">
            {String(row.firstName ?? '?').charAt(0)}
            {String(row.lastName ?? '').charAt(0)}
          </div>
          <span className="font-medium text-gray-900">
            {String(row.firstName ?? '')} {String(row.lastName ?? '')}
          </span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => (
        <span className="text-sm text-gray-600">{String(row.email ?? '—')}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={String(row.status ?? 'UNKNOWN')} />,
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (row) => {
        const roles = Array.isArray(row.roles) ? row.roles : [];
        return (
          <div className="flex flex-wrap gap-1">
            {roles.length === 0 ? (
              <span className="text-xs text-gray-400">—</span>
            ) : (
              roles.map((role: string, i: number) => (
                <span key={i} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {role}
                </span>
              ))
            )}
          </div>
        );
      },
    },
    {
      key: 'riskLevel',
      header: 'Risk Level',
      render: (row) => {
        const level = String(row.riskLevel ?? '');
        const variant =
          level === RiskLevel.High || level === RiskLevel.Critical
            ? 'danger'
            : level === RiskLevel.Medium
              ? 'warning'
              : 'success';
        return level ? (
          <Badge variant={variant} size="sm">{level}</Badge>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'lastActiveAt',
      header: 'Last Active',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {row.lastActiveAt
            ? new Date(String(row.lastActiveAt)).toLocaleDateString()
            : '—'}
        </span>
      ),
    },
  ];

  const items = (query.data?.items ?? []) as unknown as Record<string, unknown>[];
  const totalPages = query.data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Users</h2>

      <div className="flex items-center gap-3 rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
        <div className="relative w-80">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-[10px] border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-card">
        <DataTable
          columns={columns}
          data={items}
          loading={query.isLoading}
          emptyMessage="No users found"
          onRowClick={(row) => setSelectedUser(row)}
        />
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-lg font-bold text-brand-700">
                {String(selectedUser.firstName ?? '?').charAt(0)}
                {String(selectedUser.lastName ?? '').charAt(0)}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {String(selectedUser.firstName ?? '')} {String(selectedUser.lastName ?? '')}
                </p>
                <p className="text-sm text-gray-500">{String(selectedUser.email ?? '—')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-[10px] bg-gray-50 p-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Status</p>
                <div className="mt-1">
                  <StatusBadge status={String(selectedUser.status ?? '')} />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Risk Level</p>
                <p className="mt-1 font-medium text-gray-800">{String(selectedUser.riskLevel ?? '—')}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Joined</p>
                <p className="mt-1 font-medium text-gray-800">
                  {selectedUser.createdAt
                    ? new Date(String(selectedUser.createdAt)).toLocaleDateString()
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Last Active</p>
                <p className="mt-1 font-medium text-gray-800">
                  {selectedUser.lastActiveAt
                    ? new Date(String(selectedUser.lastActiveAt)).toLocaleDateString()
                    : '—'}
                </p>
              </div>
            </div>
            <hr className="border-gray-100" />
            <div>
              <p className="mb-3 text-sm font-semibold text-gray-700">Actions</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  loading={statusMutation.isPending}
                  onClick={() =>
                    statusMutation.mutate({
                      id: String(selectedUser.id),
                      status: UserStatus.Suspended,
                    })
                  }
                >
                  Suspend
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={statusMutation.isPending}
                  onClick={() =>
                    statusMutation.mutate({
                      id: String(selectedUser.id),
                      status: UserStatus.Banned,
                    })
                  }
                >
                  Ban
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  loading={statusMutation.isPending}
                  onClick={() =>
                    statusMutation.mutate({
                      id: String(selectedUser.id),
                      status: UserStatus.Active,
                    })
                  }
                >
                  Activate
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
