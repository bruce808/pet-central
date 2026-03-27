'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Badge,
  Button,
  DataTable,
  Modal,
  Textarea,
  Pagination,
  LoadingSpinner,
} from '@pet-central/ui';
import type { Column } from '@pet-central/ui';
import { ModerationStatus } from '@pet-central/types';
import { moderation } from '@/lib/api';

type QueueTab = 'all' | 'listings' | 'reviews' | 'messages' | 'resources';

export default function ModerationPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<QueueTab>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewItem, setReviewItem] = useState<Record<string, unknown> | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const query = useQuery({
    queryKey: ['admin', 'moderation', tab, page],
    queryFn: () =>
      moderation.getQueue({
        page,
        limit: 20,
        type: tab === 'all' ? undefined : tab,
        status: ModerationStatus.RequiresReview,
      }),
  });

  const moderateMutation = useMutation({
    mutationFn: ({
      id,
      decision,
      reason,
    }: {
      id: string;
      decision: string;
      reason?: string;
      type?: string;
    }) => {
      const payload = { decision, reason } as never;
      return moderation.moderateReview(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] });
      setReviewItem(null);
      setRejectReason('');
      setSelected(new Set());
    },
  });

  const items = (query.data?.items ?? []) as unknown as Record<string, unknown>[];
  const totalPages = query.data?.totalPages ?? 1;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((item) => String(item.id))));
    }
  };

  const tabs: { key: QueueTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'listings', label: 'Listings' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'messages', label: 'Messages' },
    { key: 'resources', label: 'Resources' },
  ];

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'select',
      header: '',
      render: (row) => (
        <input
          type="checkbox"
          checked={selected.has(String(row.id))}
          onChange={() => toggleSelect(String(row.id))}
          className="rounded border-gray-300"
        />
      ),
    },
    {
      key: 'content',
      header: 'Content Preview',
      render: (row) => (
        <span className="line-clamp-2 max-w-md text-sm text-gray-700">
          {String(row.content ?? row.title ?? row.body ?? '—').slice(0, 120)}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge variant="info" size="sm">
          {String(row.contentType ?? row.type ?? '').replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'author',
      header: 'Author',
      render: (row) => (
        <span className="font-mono text-xs text-gray-600">
          {String(row.authorId ?? row.userId ?? '').slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'riskScore',
      header: 'Risk Score',
      render: (row) => {
        const score = Number(row.riskScore ?? 0);
        const color =
          score >= 80 ? 'text-red-600' : score >= 50 ? 'text-amber-600' : 'text-green-600';
        return <span className={`text-sm font-semibold ${color}`}>{score}</span>;
      },
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {row.createdAt
            ? new Date(String(row.createdAt)).toLocaleString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="primary"
            onClick={() =>
              moderateMutation.mutate({
                id: String(row.id),
                decision: 'APPROVED',
              })
            }
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setReviewItem(row)}
          >
            Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              moderateMutation.mutate({
                id: String(row.id),
                decision: 'FLAGGED',
              })
            }
          >
            Flag
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Moderation Queue</h2>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{selected.size} selected</span>
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                selected.forEach((id) =>
                  moderateMutation.mutate({ id, decision: 'APPROVED' }),
                )
              }
            >
              Approve Selected
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() =>
                selected.forEach((id) =>
                  moderateMutation.mutate({
                    id,
                    decision: 'REJECTED',
                    reason: 'Bulk rejected',
                  }),
                )
              }
            >
              Reject Selected
            </Button>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setPage(1);
            }}
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

      <div className="mb-2">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={selected.size === items.length && items.length > 0}
            onChange={toggleAll}
            className="rounded border-gray-300"
          />
          Select all on page
        </label>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={query.isLoading}
        emptyMessage="Queue is empty — all caught up!"
        onRowClick={(row) => setReviewItem(row)}
      />

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={!!reviewItem}
        onClose={() => {
          setReviewItem(null);
          setRejectReason('');
        }}
        title="Review Content"
        size="lg"
      >
        {reviewItem && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Content
              </p>
              <p className="text-sm text-gray-700">
                {String(
                  reviewItem.content ??
                    reviewItem.title ??
                    reviewItem.body ??
                    'No content',
                )}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Type</p>
                <p className="font-medium">
                  {String(reviewItem.contentType ?? reviewItem.type ?? '—')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Author</p>
                <p className="font-mono text-xs">
                  {String(reviewItem.authorId ?? reviewItem.userId ?? '—')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Risk Score</p>
                <p className="font-medium">{String(reviewItem.riskScore ?? '—')}</p>
              </div>
            </div>
            <Textarea
              label="Rejection reason"
              placeholder="Provide a reason for rejection…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="primary"
                loading={moderateMutation.isPending}
                onClick={() =>
                  moderateMutation.mutate({
                    id: String(reviewItem.id),
                    decision: 'APPROVED',
                  })
                }
              >
                Approve
              </Button>
              <Button
                variant="danger"
                loading={moderateMutation.isPending}
                disabled={!rejectReason.trim()}
                onClick={() =>
                  moderateMutation.mutate({
                    id: String(reviewItem.id),
                    decision: 'REJECTED',
                    reason: rejectReason.trim(),
                  })
                }
              >
                Reject
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  moderateMutation.mutate({
                    id: String(reviewItem.id),
                    decision: 'REQUIRE_REVIEW',
                  })
                }
              >
                Require Further Review
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
