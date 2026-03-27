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
        <Badge variant="info" size="sm">
          {String(row.entityType ?? '').replace(/_/g, ' ')}
        </Badge>
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
        <Badge variant="neutral" size="sm">
          {String(row.discoveryMethod ?? '').replace(/_/g, ' ')}
        </Badge>
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
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">AI Discovery</h2>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
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

      <DataTable
        columns={columns}
        data={items}
        loading={query.isLoading}
        emptyMessage="No discovered entities found"
        onRowClick={(row) => setSelectedEntity(row)}
      />

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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">
                  {String(selectedEntity.name ?? selectedEntity.entityName ?? '—')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Type</p>
                <Badge variant="info">
                  {String(selectedEntity.entityType ?? '')}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500">Source</p>
                <p className="font-medium">{String(selectedEntity.source ?? '—')}</p>
              </div>
              <div>
                <p className="text-gray-500">Discovery Method</p>
                <p className="font-medium">
                  {String(selectedEntity.discoveryMethod ?? '—').replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Match Status</p>
                <Badge
                  variant={matchVariant[String(selectedEntity.matchStatus)] ?? 'neutral'}
                >
                  {String(selectedEntity.matchStatus ?? '—').replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500">Routed To</p>
                <p className="font-medium">
                  {String(selectedEntity.routedTo ?? selectedEntity.assignedTeam ?? '—')}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Extracted Profile
              </p>
              <pre className="max-h-64 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-700">
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
