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

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [noteInternal, setNoteInternal] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900">
          Case {String(c.id ?? id).slice(0, 8)}
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column – 2/3 width */}
        <div className="space-y-6 lg:col-span-2">
          {/* Timeline */}
          <Card padding="md">
            <h3 className="mb-4 font-semibold text-gray-800">Timeline</h3>
            {events.length === 0 ? (
              <p className="py-4 text-sm text-gray-400">No events recorded</p>
            ) : (
              <div className="space-y-4">
                {events.map((ev, i) => (
                  <div key={i} className="relative flex gap-3 pl-5">
                    <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500" />
                    {i < events.length - 1 && (
                      <div className="absolute left-[4.5px] top-4 h-full w-px bg-gray-200" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {String(ev.type ?? 'Event').replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        by {String(ev.actorId ?? 'System').slice(0, 8)} ·{' '}
                        {ev.createdAt
                          ? new Date(String(ev.createdAt)).toLocaleString()
                          : '—'}
                      </p>
                      {ev.payload ? (
                        <pre className="mt-1 rounded bg-gray-50 p-2 text-xs text-gray-600">
                          {typeof ev.payload === 'string'
                            ? ev.payload
                            : JSON.stringify(ev.payload, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Notes */}
          <Card padding="md">
            <h3 className="mb-4 font-semibold text-gray-800">Notes</h3>
            {notes.length > 0 && (
              <div className="mb-4 space-y-3">
                {notes.map((note, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-3 ${
                      note.internal
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">
                        {String(note.authorId ?? 'Unknown').slice(0, 8)}
                      </span>
                      {note.internal ? (
                        <Badge variant="warning" size="sm">Internal</Badge>
                      ) : null}
                      <span className="text-xs text-gray-400">
                        {note.createdAt
                          ? new Date(String(note.createdAt)).toLocaleString()
                          : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{String(note.content)}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
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
                    className="rounded border-gray-300"
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
          </Card>

          {/* Evidence / Attachments */}
          <Card padding="md">
            <h3 className="mb-4 font-semibold text-gray-800">Evidence &amp; Attachments</h3>
            <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
              No attachments uploaded yet
            </div>
          </Card>
        </div>

        {/* Right column – 1/3 width */}
        <div className="space-y-4">
          {/* Status */}
          <Card padding="md">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
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
                className="mt-2 w-full"
                loading={updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate(selectedStatus)}
              >
                Update Status
              </Button>
            )}
          </Card>

          {/* Assignment */}
          <Card padding="md">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Assigned To
            </h4>
            <p className="text-sm text-gray-700">
              {c.assignedTo
                ? String(c.assignedTo).slice(0, 8)
                : 'Unassigned'}
            </p>
            <Button variant="outline" size="sm" className="mt-2 w-full">
              Reassign
            </Button>
          </Card>

          {/* Related Entity */}
          <Card padding="md">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Related Entity
            </h4>
            {c.sourceType ? (
              <div>
                <Badge variant="info" size="sm">
                  {String(c.sourceType)}
                </Badge>
                <p className="mt-1 font-mono text-xs text-gray-600">
                  {String(c.sourceId ?? '').slice(0, 12)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">None linked</p>
            )}
          </Card>

          {/* SLA */}
          <Card padding="md">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              SLA
            </h4>
            <p className="text-sm text-gray-700">
              Due:{' '}
              {c.dueDate
                ? new Date(String(c.dueDate)).toLocaleDateString()
                : 'Not set'}
            </p>
            {c.dueDate ? (
              <p className="mt-1 text-xs text-gray-500">
                {new Date(String(c.dueDate)) > new Date()
                  ? `${Math.ceil((new Date(String(c.dueDate)).getTime() - Date.now()) / 86400000)} days remaining`
                  : 'Overdue'}
              </p>
            ) : null}
          </Card>

          {/* Actions */}
          <Card padding="md">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">Assign</Button>
              <Button variant="outline" size="sm">Escalate</Button>
              <Button variant="primary" size="sm">Resolve</Button>
              <Button variant="ghost" size="sm">Close</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
