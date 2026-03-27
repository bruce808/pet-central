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
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
          {String(row.type ?? '').replace(/_/g, ' ')}
        </span>
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
                <span key={i} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{c}</span>
              ))
            )}
            {caps.length > 3 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">+{caps.length - 3}</span>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Partners</h2>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Partner
          </span>
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
        <div className="relative w-80">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            placeholder="Search partners…"
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
          emptyMessage="No partners found"
          onRowClick={(row) => setSelectedPartner(row)}
        />
      </div>

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
        <div className="space-y-5">
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
          <div className="flex justify-end gap-2 pt-2">
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
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 rounded-[10px] bg-gray-50 p-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Name</p>
                <p className="mt-1 font-medium text-gray-800">{String(selectedPartner.name)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Type</p>
                <div className="mt-1">
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                    {String(selectedPartner.type ?? '').replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Region</p>
                <p className="mt-1 font-medium text-gray-800">{String(selectedPartner.region ?? '—')}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Status</p>
                <div className="mt-1">
                  <StatusBadge status={String(selectedPartner.status ?? '')} />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Members</p>
                <p className="mt-1 font-medium text-gray-800">{String(selectedPartner.memberCount ?? 0)}</p>
              </div>
            </div>
            <hr className="border-gray-100" />
            <div>
              <p className="mb-3 text-sm font-semibold text-gray-700">Capabilities</p>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(selectedPartner.capabilities)
                  ? selectedPartner.capabilities
                  : []
                ).map((c: string, i: number) => (
                  <span key={i} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">{c}</span>
                ))}
                {(!Array.isArray(selectedPartner.capabilities) || selectedPartner.capabilities.length === 0) && (
                  <p className="text-sm text-gray-400">No capabilities listed</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
