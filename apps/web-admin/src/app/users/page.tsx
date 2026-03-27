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
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
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
                <Badge key={i} variant="neutral" size="sm">
                  {role}
                </Badge>
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
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Users</h2>

      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <div className="w-80">
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={query.isLoading}
        emptyMessage="No users found"
        onRowClick={(row) => setSelectedUser(row)}
      />

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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">
                  {String(selectedUser.firstName ?? '')} {String(selectedUser.lastName ?? '')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{String(selectedUser.email ?? '—')}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <StatusBadge status={String(selectedUser.status ?? '')} />
              </div>
              <div>
                <p className="text-gray-500">Risk Level</p>
                <p className="font-medium">{String(selectedUser.riskLevel ?? '—')}</p>
              </div>
              <div>
                <p className="text-gray-500">Joined</p>
                <p className="font-medium">
                  {selectedUser.createdAt
                    ? new Date(String(selectedUser.createdAt)).toLocaleDateString()
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Last Active</p>
                <p className="font-medium">
                  {selectedUser.lastActiveAt
                    ? new Date(String(selectedUser.lastActiveAt)).toLocaleDateString()
                    : '—'}
                </p>
              </div>
            </div>
            <hr className="border-gray-100" />
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Actions</p>
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
