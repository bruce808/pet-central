'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Textarea,
  Select,
  LoadingSpinner,
} from '@pet-central/ui';
import { CaseStatus, CasePriority } from '@pet-central/types';
import Link from 'next/link';
import { cases } from '@/lib/api';

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  [CaseStatus.NewCase]: 'warning',
  [CaseStatus.Investigating]: 'info',
  [CaseStatus.Escalated]: 'danger',
  [CaseStatus.Resolved]: 'success',
  [CaseStatus.Closed]: 'neutral',
};

const priorityVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  [CasePriority.Low]: 'neutral',
  [CasePriority.Medium]: 'info',
  [CasePriority.High]: 'warning',
  [CasePriority.Critical]: 'danger',
};

function SlaCard({ dueDate }: { dueDate: unknown }) {
  if (!dueDate) {
    return (
      <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-card">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">SLA</h4>
        <p className="text-sm text-gray-500">Due date not set</p>
      </div>
    );
  }

  const due = new Date(String(dueDate));
  const now = new Date();
  const daysRemaining = Math.ceil((due.getTime() - now.getTime()) / 86400000);
  const isOverdue = daysRemaining < 0;
  const isAtRisk = daysRemaining >= 0 && daysRemaining <= 2;

  const bgClass = isOverdue
    ? 'bg-red-50 border-red-100'
    : isAtRisk
      ? 'bg-amber-50 border-amber-100'
      : 'bg-emerald-50 border-emerald-100';
  const textClass = isOverdue ? 'text-red-700' : isAtRisk ? 'text-amber-700' : 'text-emerald-700';
  const labelClass = isOverdue ? 'text-red-500' : isAtRisk ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className={`rounded-[16px] border p-5 shadow-card ${bgClass}`}>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">SLA</h4>
      <p className={`text-sm font-medium ${textClass}`}>
        Due: {due.toLocaleDateString()}
      </p>
      <p className={`mt-1 text-xs font-medium ${labelClass}`}>
        {isOverdue ? 'Overdue' : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`}
      </p>
    </div>
  );
}

export default function PartnerCaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const query = useQuery({
    queryKey: ['partner', 'cases', id],
    queryFn: () => cases.getById(id),
    enabled: !!id,
  });

  const addNoteMutation = useMutation({
    mutationFn: (data: { content: string; internal: boolean }) =>
      cases.addNote(id, data as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'cases', id] });
      setNoteText('');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => cases.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'cases', id] });
      setSelectedStatus('');
    },
  });

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const c = (query.data ?? {}) as Record<string, unknown>;
  const events = (c.events ?? []) as unknown as Record<string, unknown>[];
  const notes = (c.notes ?? []) as unknown as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/cases" className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Cases
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Case <span className="font-mono">{String(c.id ?? id).slice(0, 8)}</span>
          </h2>
          <Badge variant={statusVariant[String(c.status)] ?? 'neutral'}>
            {String(c.status ?? 'UNKNOWN').replace(/_/g, ' ')}
          </Badge>
          <Badge variant="info">{String(c.type ?? '').replace(/_/g, ' ')}</Badge>
          <Badge variant={priorityVariant[String(c.priority)] ?? 'neutral'}>
            {String(c.priority ?? '')}
          </Badge>
          {c.severity ? (
            <Badge variant="neutral">Sev {String(c.severity)}</Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Timeline */}
          <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
            <h3 className="mb-5 text-base font-semibold text-gray-900">Timeline</h3>
            {events.length === 0 ? (
              <p className="py-4 text-sm text-gray-400">No events recorded</p>
            ) : (
              <div className="relative ml-3">
                <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gray-200" />
                <div className="space-y-6">
                  {events.map((ev, i) => {
                    const evType = String(ev.type ?? '');
                    const dotColor = evType.includes('RESOLVE') || evType.includes('CLOSE')
                      ? 'bg-emerald-500'
                      : evType.includes('ESCALAT')
                        ? 'bg-red-500'
                        : 'bg-brand-500';
                    return (
                      <div key={i} className="relative flex gap-4 pl-6">
                        <div className={`absolute left-[-4.5px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${dotColor}`} />
                        <div className="flex-1 rounded-[12px] border border-gray-100 bg-gray-50/50 p-3.5">
                          <p className="text-sm font-medium text-gray-800">
                            {evType.replace(/_/g, ' ')}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {ev.createdAt
                              ? new Date(String(ev.createdAt)).toLocaleString()
                              : '\u2014'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
            <h3 className="mb-5 text-base font-semibold text-gray-900">Notes</h3>
            {notes.length > 0 && (
              <div className="mb-5 space-y-3">
                {notes.map((note, i) => (
                  <div
                    key={i}
                    className="rounded-[12px] border border-gray-100 bg-white p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-600">
                        {String(note.authorId ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {String(note.authorId ?? 'Unknown').slice(0, 8)}
                      </span>
                      {note.visibility === 'partner_internal' && (
                        <Badge variant="info" size="sm">Internal</Badge>
                      )}
                      <span className="text-xs text-gray-400">
                        {note.createdAt
                          ? new Date(String(note.createdAt)).toLocaleString()
                          : ''}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700">{String(note.content)}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-3">
              <Textarea
                placeholder="Add a partner-internal note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  loading={addNoteMutation.isPending}
                  disabled={!noteText.trim()}
                  onClick={() =>
                    addNoteMutation.mutate({
                      content: noteText.trim(),
                      internal: true,
                    })
                  }
                >
                  Add Note
                </Button>
              </div>
            </div>
          </div>

          {/* Evidence */}
          <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
            <h3 className="mb-5 text-base font-semibold text-gray-900">Evidence &amp; Attachments</h3>
            <div className="flex h-28 items-center justify-center rounded-[12px] border-2 border-dashed border-gray-200 bg-gray-50/50 text-sm text-gray-400">
              <div className="text-center">
                <svg className="mx-auto h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                <p className="mt-1">No attachments uploaded yet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar cards */}
        <div className="space-y-5">
          <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-card">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Status
            </h4>
            <Select
              options={Object.values(CaseStatus).map((s) => ({
                value: s,
                label: s.replace(/_/g, ' '),
              }))}
              value={selectedStatus || String(c.status ?? '')}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
            {selectedStatus && selectedStatus !== String(c.status) && (
              <Button
                size="sm"
                className="mt-3 w-full"
                loading={updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate(selectedStatus)}
              >
                Update Status
              </Button>
            )}
          </div>

          <SlaCard dueDate={c.dueDate} />

          <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-card">
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="rounded-[10px]">Escalate</Button>
              <Button variant="primary" size="sm" className="rounded-[10px] bg-gradient-to-r from-brand-600 to-brand-700">
                Resolve
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
