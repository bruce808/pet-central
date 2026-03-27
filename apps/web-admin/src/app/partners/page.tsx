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
  Textarea,
  Select,
  Pagination,
  LoadingSpinner,
} from '@pet-central/ui';
import type { Column } from '@pet-central/ui';
import { PartnerType } from '@pet-central/types';
import { partners } from '@/lib/api';

export default function PartnersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Record<string, unknown> | null>(null);

  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('');
  const [formRegion, setFormRegion] = useState('');

  const query = useQuery({
    queryKey: ['admin', 'partners', page, search],
    queryFn: () => partners.list({ page, limit: 20, search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => partners.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      setShowModal(false);
      setFormName('');
      setFormType('');
      setFormRegion('');
    },
  });

  const items = (query.data?.items ?? []) as unknown as Record<string, unknown>[];
  const totalPages = query.data?.totalPages ?? 1;

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <span className="font-medium text-gray-900">{String(row.name ?? '—')}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge variant="info" size="sm">
          {String(row.type ?? '').replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'region',
      header: 'Region',
      render: (row) => (
        <span className="text-sm text-gray-600">{String(row.region ?? '—')}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={String(row.status ?? 'UNKNOWN')} />,
    },
    {
      key: 'capabilities',
      header: 'Capabilities',
      render: (row) => {
        const caps = Array.isArray(row.capabilities) ? row.capabilities : [];
        return (
          <div className="flex flex-wrap gap-1">
            {caps.length === 0 ? (
              <span className="text-xs text-gray-400">—</span>
            ) : (
              caps.slice(0, 3).map((c: string, i: number) => (
                <Badge key={i} variant="neutral" size="sm">{c}</Badge>
              ))
            )}
            {caps.length > 3 && (
              <Badge variant="neutral" size="sm">+{caps.length - 3}</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'memberCount',
      header: 'Members',
      render: (row) => (
        <span className="text-sm text-gray-600">{String(row.memberCount ?? 0)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Partners</h2>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          + Add Partner
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <div className="w-80">
          <Input
            placeholder="Search partners…"
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
        emptyMessage="No partners found"
        onRowClick={(row) => setSelectedPartner(row)}
      />

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* Add Partner Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Partner"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Organization Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Select
            label="Type"
            options={Object.values(PartnerType).map((t) => ({
              value: t,
              label: t.replace(/_/g, ' '),
            }))}
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
          />
          <Input
            label="Region"
            value={formRegion}
            onChange={(e) => setFormRegion(e.target.value)}
            placeholder="e.g. US-WEST"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={createMutation.isPending}
              disabled={!formName.trim() || !formType}
              onClick={() =>
                createMutation.mutate({
                  name: formName.trim(),
                  type: formType,
                  region: formRegion.trim() || undefined,
                })
              }
            >
              Create Partner
            </Button>
          </div>
        </div>
      </Modal>

      {/* Partner Detail Modal */}
      <Modal
        isOpen={!!selectedPartner}
        onClose={() => setSelectedPartner(null)}
        title="Partner Details"
        size="lg"
      >
        {selectedPartner && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{String(selectedPartner.name)}</p>
              </div>
              <div>
                <p className="text-gray-500">Type</p>
                <Badge variant="info">{String(selectedPartner.type ?? '').replace(/_/g, ' ')}</Badge>
              </div>
              <div>
                <p className="text-gray-500">Region</p>
                <p className="font-medium">{String(selectedPartner.region ?? '—')}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <StatusBadge status={String(selectedPartner.status ?? '')} />
              </div>
              <div>
                <p className="text-gray-500">Members</p>
                <p className="font-medium">{String(selectedPartner.memberCount ?? 0)}</p>
              </div>
            </div>
            <hr className="border-gray-100" />
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Capabilities</p>
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(selectedPartner.capabilities)
                  ? selectedPartner.capabilities
                  : []
                ).map((c: string, i: number) => (
                  <Badge key={i} variant="neutral">{c}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
