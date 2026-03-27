'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Badge,
  Button,
  Textarea,
  Select,
  LoadingSpinner,
} from '@pet-central/ui';
import { CaseStatus, CasePriority } from '@pet-central/types';
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

function getSlaColor(dueDate: string | undefined, now: number): { bg: string; text: string; border: string } {
  if (!dueDate) return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100' };
  const remaining = (new Date(dueDate).getTime() - now) / 86400000;
  if (remaining < 0) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
  if (remaining < 2) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
  return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [noteInternal, setNoteInternal] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [now] = useState(() => Date.now());

  const query = useQuery({
    queryKey: ['admin', 'cases', id],
    queryFn: () => cases.getById(id),
    enabled: !!id,
  });

  const addNoteMutation = useMutation({
    mutationFn: (data: { content: string; internal: boolean }) =>
      cases.addNote(id, data as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cases', id] });
      setNoteText('');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => cases.update(id, { status } as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cases', id] });
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
  const slaColor = getSlaColor(c.dueDate as string | undefined, now);
  const daysRemaining = c.dueDate
    ? Math.ceil((new Date(String(c.dueDate)).getTime() - now) / 86400000)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900">
          Case {String(c.id ?? id).slice(0, 8)}
        </h2>
        <Badge variant={statusVariant[String(c.status)] ?? 'neutral'}>
          {String(c.status ?? 'UNKNOWN').replace(/_/g, ' ')}
        </Badge>
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
          {String(c.type ?? '').replace(/_/g, ' ')}
        </span>
        <Badge variant={priorityVariant[String(c.priority)] ?? 'neutral'}>
          {String(c.priority ?? '')}
        </Badge>
        {c.severity ? (
          <Badge variant="neutral">Sev {String(c.severity)}</Badge>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Timeline */}
          <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
            <h3 className="mb-5 font-semibold text-gray-800">Timeline</h3>
            {events.length === 0 ? (
              <p className="py-4 text-sm text-gray-400">No events recorded</p>
            ) : (
              <div className="relative ml-3">
                {/* Vertical line */}
                <div className="absolute left-0 top-2 h-[calc(100%-16px)] w-px bg-gray-200" />
                <div className="space-y-6">
                  {events.map((ev, i) => (
                    <div key={i} className="relative flex gap-4 pl-6">
                      <div className="absolute -left-[5px] top-1 h-[10px] w-[10px] rounded-full border-2 border-white bg-brand-500 shadow-sm" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {String(ev.type ?? 'Event').replace(/_/g, ' ')}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          by {String(ev.actorId ?? 'System').slice(0, 8)} ·{' '}
                          {ev.createdAt
                            ? new Date(String(ev.createdAt)).toLocaleString()
                            : '—'}
                        </p>
                        {ev.payload ? (
                          <pre className="mt-2 rounded-[10px] bg-gray-50 p-3 text-xs text-gray-600">
                            {typeof ev.payload === 'string'
                              ? ev.payload
                              : JSON.stringify(ev.payload, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
            <h3 className="mb-5 font-semibold text-gray-800">Notes</h3>
            {notes.length > 0 && (
              <div className="mb-5 space-y-3">
                {notes.map((note, i) => (
                  <div
                    key={i}
                    className={`rounded-[10px] border p-4 ${
                      note.internal
                        ? 'border-amber-200 bg-amber-50/50'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">
                        {String(note.authorId ?? 'Unknown').slice(0, 8)}
                      </span>
                      {note.internal ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Internal
                        </span>
                      ) : null}
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
                placeholder="Add a note…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={noteInternal}
                    onChange={(e) => setNoteInternal(e.target.checked)}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  Internal only
                </label>
                <Button
                  size="sm"
                  loading={addNoteMutation.isPending}
                  disabled={!noteText.trim()}
                  onClick={() =>
                    addNoteMutation.mutate({
                      content: noteText.trim(),
                      internal: noteInternal,
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
            <h3 className="mb-4 font-semibold text-gray-800">Evidence &amp; Attachments</h3>
            <div className="flex h-24 items-center justify-center rounded-[10px] border-2 border-dashed border-gray-200 text-sm text-gray-400">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto mb-1 h-6 w-6 text-gray-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                No attachments uploaded yet
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Status */}
          <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-card">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Status
            </h4>
            <div className="flex items-center gap-2">
              <div className="w-full">
                <Select
                  options={Object.values(CaseStatus).map((s) => ({
                    value: s,
                    label: s.replace(/_/g, ' '),
                  }))}
                  value={selectedStatus || String(c.status ?? '')}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                />
              </div>
            </div>
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

          {/* Assignment */}
          <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-card">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Assigned To
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-xs font-semibold text-brand-700">
                {c.assignedTo ? String(c.assignedTo).charAt(0).toUpperCase() : '?'}
              </div>
              <p className="text-sm font-medium text-gray-700">
                {c.assignedTo
                  ? String(c.assignedTo).slice(0, 8)
                  : 'Unassigned'}
              </p>
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              Reassign
            </Button>
          </div>

          {/* Related Entity */}
          <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-card">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Related Entity
            </h4>
            {c.sourceType ? (
              <div>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                  {String(c.sourceType)}
                </span>
                <p className="mt-2 font-mono text-xs text-gray-600">
                  {String(c.sourceId ?? '').slice(0, 12)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">None linked</p>
            )}
          </div>

          {/* SLA */}
          <div className={`rounded-[16px] border ${slaColor.border} ${slaColor.bg} p-5 shadow-card`}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              SLA
            </h4>
            <p className={`text-sm font-medium ${slaColor.text}`}>
              Due:{' '}
              {c.dueDate
                ? new Date(String(c.dueDate)).toLocaleDateString()
                : 'Not set'}
            </p>
            {c.dueDate ? (
              <p className={`mt-1 text-xs ${slaColor.text}`}>
                {daysRemaining !== null && daysRemaining > 0
                  ? `${daysRemaining} days remaining`
                  : 'Overdue'}
              </p>
            ) : null}
          </div>

          {/* Actions */}
          <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-card">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">Assign</Button>
              <Button variant="outline" size="sm">Escalate</Button>
              <Button variant="primary" size="sm">Resolve</Button>
              <Button variant="ghost" size="sm">Close</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
