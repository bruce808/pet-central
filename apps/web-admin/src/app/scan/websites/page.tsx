'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  DataTable,
  Badge,
  StatusBadge,
  Input,
  Select,
  Button,
  Pagination,
  LoadingSpinner,
  Modal,
} from '@pet-central/ui';
import type { Column } from '@pet-central/ui';
import { scanWebsites, scans } from '@/lib/api';

export default function WebsitesListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const [newDomain, setNewDomain] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState('shelter');
  const [newHint, setNewHint] = useState('');

  const query = useQuery({
    queryKey: ['scan', 'websites', page, search, sourceFilter],
    queryFn: () =>
      scanWebsites.list({ page, limit: 20, domain: search || undefined, sourceType: sourceFilter || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      scanWebsites.create({ domain: newDomain, baseUrl: newUrl || `https://${newDomain}`, sourceType: newType, organizationHint: newHint || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scan', 'websites'] });
      setShowAdd(false);
      setNewDomain('');
      setNewUrl('');
      setNewHint('');
    },
  });

  const scanMutation = useMutation({
    mutationFn: (websiteId: string) => scans.start({ websiteId, sync: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scan'] }),
  });

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'domain',
      header: 'Domain',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{String(row.domain)}</p>
          <p className="text-xs text-gray-500">{String(row.baseUrl ?? '')}</p>
        </div>
      ),
    },
    {
      key: 'sourceType',
      header: 'Type',
      render: (row) => (
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
          {String(row.sourceType ?? '').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      key: 'scanCount',
      header: 'Scans',
      render: (row) => (
        <span className="text-sm font-semibold text-gray-700">{String(row.scanCount ?? 0)}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Added',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            scanMutation.mutate(String(row.id));
          }}
        >
          Scan Now
        </Button>
      ),
    },
  ];

  const items = (query.data?.data ?? []) as unknown as Record<string, unknown>[];
  const totalPages = Math.ceil((query.data?.meta?.total ?? 0) / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Websites</h2>
        <Button onClick={() => setShowAdd(true)}>Add Website</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
        <Input
          placeholder="Search domains..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-64"
        />
        <Select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          options={[
            { value: '', label: 'All Types' },
            { value: 'shelter', label: 'Shelter' },
            { value: 'humane_society', label: 'Humane Society' },
            { value: 'rescue', label: 'Rescue' },
            { value: 'breeder', label: 'Breeder' },
            { value: 'nonprofit', label: 'Nonprofit' },
            { value: 'directory', label: 'Directory' },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-card">
        <DataTable
          columns={columns}
          data={items}
          loading={query.isLoading}
          emptyMessage="No websites registered yet"
          onRowClick={(row) => router.push(`/scan/websites/${row.id}`)}
        />
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <Modal isOpen={showAdd} title="Add Website" onClose={() => setShowAdd(false)}>
          <div className="space-y-4">
            <Input
              label="Domain"
              placeholder="www.example.org"
              value={newDomain}
              onChange={(e) => {
                setNewDomain(e.target.value);
                if (!newUrl) setNewUrl(`https://${e.target.value}`);
              }}
            />
            <Input
              label="Base URL"
              placeholder="https://www.example.org"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
            <Select
              label="Source Type"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              options={[
                { value: 'shelter', label: 'Shelter' },
                { value: 'humane_society', label: 'Humane Society' },
                { value: 'rescue', label: 'Rescue' },
                { value: 'breeder', label: 'Breeder' },
                { value: 'nonprofit', label: 'Nonprofit' },
                { value: 'directory', label: 'Directory' },
              ]}
            />
            <Input
              label="Organization Hint (optional)"
              placeholder="Organization name"
              value={newHint}
              onChange={(e) => setNewHint(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!newDomain || createMutation.isPending}
              >
                {createMutation.isPending ? 'Adding...' : 'Add Website'}
              </Button>
            </div>
          </div>
        </Modal>
    </div>
  );
}
