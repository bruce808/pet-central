'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Badge,
  StatusBadge,
  Button,
  Input,
  Select,
  DataTable,
  LoadingSpinner,
} from '@pet-central/ui';
import type { Column } from '@pet-central/ui';
import { organizations, cases } from '@/lib/api';

type Tab = 'profile' | 'trust' | 'documents' | 'listings' | 'members' | 'cases';

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('profile');
  const [badgeInput, setBadgeInput] = useState('');

  const query = useQuery({
    queryKey: ['admin', 'organizations', id],
    queryFn: () => organizations.getById(id),
    enabled: !!id,
  });

  const trustQuery = useQuery({
    queryKey: ['admin', 'organizations', id, 'trust'],
    queryFn: () => organizations.getTrustProfile(id),
    enabled: !!id && tab === 'trust',
  });

  const casesQuery = useQuery({
    queryKey: ['admin', 'cases', 'org', id],
    queryFn: () => cases.list({ sourceType: 'ORGANIZATION', sourceId: id }),
    enabled: !!id && tab === 'cases',
  });

  const assignBadgeMutation = useMutation({
    mutationFn: (badgeType: string) => organizations.assignBadge(id, { badgeType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations', id] });
      setBadgeInput('');
    },
  });

  const removeBadgeMutation = useMutation({
    mutationFn: (badgeId: string) => organizations.removeBadge(id, badgeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations', id] });
    },
  });

  const verificationMutation = useMutation({
    mutationFn: (data: { decision: string; reason?: string }) =>
      organizations.makeVerificationDecision(id, data as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations', id] });
    },
  });

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const org = (query.data ?? {}) as Record<string, unknown>;
  const trust = (trustQuery.data ?? {}) as Record<string, unknown>;
  const badges = (org.badges ?? []) as unknown as Record<string, unknown>[];
  const documents = (org.documents ?? []) as unknown as Record<string, unknown>[];
  const listings = (org.listings ?? []) as unknown as Record<string, unknown>[];
  const members = (org.members ?? []) as unknown as Record<string, unknown>[];
  const orgCases = (casesQuery.data?.items ?? []) as unknown as Record<string, unknown>[];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'trust', label: 'Trust' },
    { key: 'documents', label: 'Documents' },
    { key: 'listings', label: 'Listings' },
    { key: 'members', label: 'Members' },
    { key: 'cases', label: 'Cases' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900">{String(org.name ?? 'Organization')}</h2>
        <Badge variant="info">{String(org.type ?? '').replace(/_/g, ' ')}</Badge>
        <StatusBadge status={String(org.status ?? 'UNKNOWN')} />
        <div className="ml-auto">
          <Select
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'SUSPENDED', label: 'Suspended' },
              { value: 'BANNED', label: 'Banned' },
            ]}
            value={String(org.status ?? '')}
            onChange={() => {}}
          />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'profile' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card padding="md">
            <h3 className="mb-3 font-semibold text-gray-800">Organization Info</h3>
            <dl className="space-y-2 text-sm">
              {(['name', 'type', 'status', 'email', 'phone', 'website', 'region', 'address'] as const).map(
                (field) => (
                  <div key={field} className="flex justify-between">
                    <dt className="capitalize text-gray-500">{field}</dt>
                    <dd className="font-medium text-gray-800">
                      {String(org[field] ?? '—')}
                    </dd>
                  </div>
                ),
              )}
            </dl>
          </Card>
          <Card padding="md">
            <h3 className="mb-3 font-semibold text-gray-800">Description</h3>
            <p className="text-sm text-gray-600">
              {String(org.description || 'No description provided.')}
            </p>
          </Card>
        </div>
      )}

      {tab === 'trust' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card padding="md">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Trust Score</p>
              <p className="mt-1 text-3xl font-bold text-brand-600">
                {String(trust.score ?? org.trustScore ?? '—')}
              </p>
            </Card>
            <Card padding="md">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Risk Level</p>
              <p className="mt-1 text-lg font-semibold text-gray-800">
                {String(trust.riskLevel ?? '—')}
              </p>
            </Card>
            <Card padding="md">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Trust State</p>
              <p className="mt-1 text-lg font-semibold text-gray-800">
                {String(trust.trustState ?? '—')}
              </p>
            </Card>
          </div>

          {/* Badges */}
          <Card padding="md">
            <h3 className="mb-3 font-semibold text-gray-800">Badges</h3>
            <div className="mb-3 flex flex-wrap gap-2">
              {badges.length === 0 && (
                <p className="text-sm text-gray-400">No badges assigned</p>
              )}
              {badges.map((badge, i) => (
                <div key={i} className="flex items-center gap-1">
                  <Badge variant="success">{String(badge.type ?? badge.badgeType)}</Badge>
                  <button
                    onClick={() => removeBadgeMutation.mutate(String(badge.id))}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Badge type…"
                  value={badgeInput}
                  onChange={(e) => setBadgeInput(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                disabled={!badgeInput.trim()}
                loading={assignBadgeMutation.isPending}
                onClick={() => assignBadgeMutation.mutate(badgeInput.trim())}
              >
                Add Badge
              </Button>
            </div>
          </Card>

          {/* Verification History */}
          <Card padding="md">
            <h3 className="mb-3 font-semibold text-gray-800">Verification</h3>
            <p className="mb-3 text-sm text-gray-600">
              Current status:{' '}
              <StatusBadge status={String(org.verificationStatus ?? 'PENDING')} />
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="primary"
                loading={verificationMutation.isPending}
                onClick={() => verificationMutation.mutate({ decision: 'APPROVED' })}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={verificationMutation.isPending}
                onClick={() => verificationMutation.mutate({ decision: 'REJECTED', reason: 'Failed review' })}
              >
                Reject
              </Button>
            </div>
          </Card>
        </div>
      )}

      {tab === 'documents' && (
        <Card padding="md">
          <h3 className="mb-4 font-semibold text-gray-800">Documents</h3>
          {documents.length === 0 ? (
            <p className="py-4 text-sm text-gray-400">No documents uploaded</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {String(doc.name ?? doc.type ?? 'Document')}
                    </p>
                    <StatusBadge status={String(doc.status ?? 'PENDING')} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary">Approve</Button>
                    <Button size="sm" variant="danger">Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'listings' && (
        <DataTable
          columns={[
            { key: 'title', header: 'Title' },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <StatusBadge status={String(row.status ?? '')} />,
            },
            {
              key: 'moderationStatus',
              header: 'Moderation',
              render: (row) => <StatusBadge status={String(row.moderationStatus ?? '')} />,
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
          ] as Column<Record<string, unknown>>[]}
          data={listings}
          emptyMessage="No listings found"
        />
      )}

      {tab === 'members' && (
        <DataTable
          columns={[
            { key: 'userId', header: 'User ID', render: (row) => <span className="font-mono text-xs">{String(row.userId ?? '').slice(0, 8)}</span> },
            { key: 'role', header: 'Role', render: (row) => <Badge variant="info" size="sm">{String(row.role)}</Badge> },
            { key: 'joinedAt', header: 'Joined', render: (row) => <span className="text-xs text-gray-500">{row.joinedAt ? new Date(String(row.joinedAt)).toLocaleDateString() : '—'}</span> },
          ] as Column<Record<string, unknown>>[]}
          data={members}
          emptyMessage="No members"
        />
      )}

      {tab === 'cases' && (
        <>
          {casesQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <DataTable
              columns={[
                { key: 'id', header: 'ID', render: (row) => <span className="font-mono text-xs">{String(row.id).slice(0, 8)}</span> },
                { key: 'type', header: 'Type', render: (row) => <Badge variant="info" size="sm">{String(row.type).replace(/_/g, ' ')}</Badge> },
                { key: 'status', header: 'Status', render: (row) => <StatusBadge status={String(row.status ?? '')} /> },
                { key: 'priority', header: 'Priority', render: (row) => <Badge variant="warning" size="sm">{String(row.priority)}</Badge> },
                { key: 'createdAt', header: 'Created', render: (row) => <span className="text-xs text-gray-500">{row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : '—'}</span> },
              ] as Column<Record<string, unknown>>[]}
              data={orgCases}
              emptyMessage="No related cases"
            />
          )}
        </>
      )}
    </div>
  );
}
