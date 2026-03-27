'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DataTable,
  Badge,
  StatusBadge,
  Button,
  Select,
  Card,
  Modal,
  Pagination,
  LoadingSpinner,
} from '@pet-central/ui';
import type { Column } from '@pet-central/ui';
import { DiscoveredEntityType, DiscoveryMethod, MatchStatus } from '@pet-central/types';
import { aiDiscovery } from '@/lib/api';

const matchVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  [MatchStatus.Confirmed]: 'success',
  [MatchStatus.Rejected]: 'danger',
  [MatchStatus.NewMatch]: 'warning',
  [MatchStatus.Duplicate]: 'neutral',
};

export default function AIDiscoveryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<Record<string, unknown> | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'ai', 'discovery', page, statusFilter, typeFilter],
    queryFn: () =>
      aiDiscovery.listEntities({
        page,
        limit: 20,
        matchStatus: statusFilter || undefined,
        entityType: typeFilter || undefined,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      aiDiscovery.updateEntity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai', 'discovery'] });
      setSelectedEntity(null);
    },
  });

  const items = (query.data?.items ?? []) as unknown as Record<string, unknown>[];
  const totalPages = query.data?.totalPages ?? 1;

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Entity Name',
      render: (row) => (
        <span className="font-medium text-gray-900">
          {String(row.name ?? row.entityName ?? '—')}
        </span>
      ),
    },
    {
      key: 'entityType',
      header: 'Type',
      render: (row) => (
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
          {String(row.entityType ?? '').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (row) => (
        <span className="text-sm text-gray-600">{String(row.source ?? '—')}</span>
      ),
    },
    {
      key: 'discoveryMethod',
      header: 'Discovery Method',
      render: (row) => (
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {String(row.discoveryMethod ?? '').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'matchStatus',
      header: 'Match Status',
      render: (row) => {
        const status = String(row.matchStatus ?? '');
        return (
          <Badge variant={matchVariant[status] ?? 'neutral'} size="sm">
            {status.replace(/_/g, ' ') || '—'}
          </Badge>
        );
      },
    },
    {
      key: 'routedTo',
      header: 'Routed To',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {String(row.routedTo ?? row.assignedTeam ?? '—')}
        </span>
      ),
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
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">AI Discovery</h2>

      <div className="flex flex-wrap items-center gap-3 rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
        <div className="w-44">
          <Select
            placeholder="Match Status"
            options={Object.values(MatchStatus).map((s) => ({
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
            placeholder="Entity Type"
            options={Object.values(DiscoveredEntityType).map((t) => ({
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
          emptyMessage="No discovered entities found"
          onRowClick={(row) => setSelectedEntity(row)}
        />
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <Modal
        isOpen={!!selectedEntity}
        onClose={() => setSelectedEntity(null)}
        title="Discovered Entity"
        size="lg"
      >
        {selectedEntity && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 rounded-[10px] bg-gray-50 p-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Name</p>
                <p className="mt-1 font-medium text-gray-800">
                  {String(selectedEntity.name ?? selectedEntity.entityName ?? '—')}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Type</p>
                <div className="mt-1">
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                    {String(selectedEntity.entityType ?? '')}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Source</p>
                <p className="mt-1 font-medium text-gray-800">{String(selectedEntity.source ?? '—')}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Discovery Method</p>
                <p className="mt-1 font-medium text-gray-800">
                  {String(selectedEntity.discoveryMethod ?? '—').replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Match Status</p>
                <div className="mt-1">
                  <Badge
                    variant={matchVariant[String(selectedEntity.matchStatus)] ?? 'neutral'}
                  >
                    {String(selectedEntity.matchStatus ?? '—').replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Routed To</p>
                <p className="mt-1 font-medium text-gray-800">
                  {String(selectedEntity.routedTo ?? selectedEntity.assignedTeam ?? '—')}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Extracted Profile
              </p>
              <pre className="max-h-64 overflow-auto rounded-[10px] bg-gray-50 p-4 text-xs text-gray-700">
                {JSON.stringify(selectedEntity.extractedProfile ?? selectedEntity.profile ?? selectedEntity, null, 2)}
              </pre>
            </div>

            <hr className="border-gray-100" />

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="primary"
                loading={updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({
                    id: String(selectedEntity.id),
                    data: { matchStatus: MatchStatus.Confirmed },
                  })
                }
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({
                    id: String(selectedEntity.id),
                    data: { matchStatus: MatchStatus.Rejected },
                  })
                }
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({
                    id: String(selectedEntity.id),
                    data: { matchStatus: MatchStatus.Duplicate },
                  })
                }
              >
                Mark Duplicate
              </Button>
              <div className="ml-auto w-48">
                <Select
                  placeholder="Route to team…"
                  options={[
                    { value: 'trust', label: 'Trust Team' },
                    { value: 'operations', label: 'Operations' },
                    { value: 'partnerships', label: 'Partnerships' },
                    { value: 'compliance', label: 'Compliance' },
                  ]}
                  onChange={(e) =>
                    updateMutation.mutate({
                      id: String(selectedEntity.id),
                      data: { routedTo: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
