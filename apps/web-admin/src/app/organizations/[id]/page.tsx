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
        <h2 className="text-2xl font-bold text-gray-900">{String(org.name ?? 'Organization')}</h2>
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
          {String(org.type ?? '').replace(/_/g, ' ')}
        </span>
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
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
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
      </div>

      {/* Tab content */}
      {tab === 'profile' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
            <h3 className="mb-4 font-semibold text-gray-800">Organization Info</h3>
            <dl className="space-y-3 text-sm">
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
          </div>
          <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
            <h3 className="mb-4 font-semibold text-gray-800">Description</h3>
            <p className="text-sm leading-relaxed text-gray-600">
              {String(org.description || 'No description provided.')}
            </p>
          </div>
        </div>
      )}

      {tab === 'trust' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[16px] border border-green-100 bg-gradient-to-br from-green-50/50 to-white p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Trust Score</p>
              <p className="mt-1 text-3xl font-bold text-brand-600">
                {String(trust.score ?? org.trustScore ?? '—')}
              </p>
            </div>
            <div className="rounded-[16px] border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Risk Level</p>
              <p className="mt-1 text-lg font-semibold text-gray-800">
                {String(trust.riskLevel ?? '—')}
              </p>
            </div>
            <div className="rounded-[16px] border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Trust State</p>
              <p className="mt-1 text-lg font-semibold text-gray-800">
                {String(trust.trustState ?? '—')}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
            <h3 className="mb-4 font-semibold text-gray-800">Badges</h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {badges.length === 0 && (
                <p className="text-sm text-gray-400">No badges assigned</p>
              )}
              {badges.map((badge, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-full bg-green-50 py-1 pl-3 pr-2">
                  <span className="text-xs font-medium text-green-700">{String(badge.type ?? badge.badgeType)}</span>
                  <button
                    onClick={() => removeBadgeMutation.mutate(String(badge.id))}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-green-500 transition-colors hover:bg-green-100 hover:text-green-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
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
          </div>

          {/* Verification */}
          <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
            <h3 className="mb-4 font-semibold text-gray-800">Verification</h3>
            <p className="mb-4 text-sm text-gray-600">
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
          </div>
        </div>
      )}

      {tab === 'documents' && (
        <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
          <h3 className="mb-4 font-semibold text-gray-800">Documents</h3>
          {documents.length === 0 ? (
            <p className="py-4 text-sm text-gray-400">No documents uploaded</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-[10px] border border-gray-100 p-4 transition-colors hover:bg-gray-50"
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
        </div>
      )}

      {tab === 'listings' && (
        <div className="overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-card">
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
        </div>
      )}

      {tab === 'members' && (
        <div className="overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-card">
          <DataTable
            columns={[
              { key: 'userId', header: 'User ID', render: (row) => <span className="font-mono text-xs text-gray-600">{String(row.userId ?? '').slice(0, 8)}</span> },
              { key: 'role', header: 'Role', render: (row) => <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{String(row.role)}</span> },
              { key: 'joinedAt', header: 'Joined', render: (row) => <span className="text-xs text-gray-500">{row.joinedAt ? new Date(String(row.joinedAt)).toLocaleDateString() : '—'}</span> },
            ] as Column<Record<string, unknown>>[]}
            data={members}
            emptyMessage="No members"
          />
        </div>
      )}

      {tab === 'cases' && (
        <>
          {casesQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-card">
              <DataTable
                columns={[
                  { key: 'id', header: 'ID', render: (row) => <span className="font-mono text-xs text-gray-600">{String(row.id).slice(0, 8)}</span> },
                  { key: 'type', header: 'Type', render: (row) => <Badge variant="info" size="sm">{String(row.type).replace(/_/g, ' ')}</Badge> },
                  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={String(row.status ?? '')} /> },
                  { key: 'priority', header: 'Priority', render: (row) => <Badge variant="warning" size="sm">{String(row.priority)}</Badge> },
                  { key: 'createdAt', header: 'Created', render: (row) => <span className="text-xs text-gray-500">{row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : '—'}</span> },
                ] as Column<Record<string, unknown>>[]}
                data={orgCases}
                emptyMessage="No related cases"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
