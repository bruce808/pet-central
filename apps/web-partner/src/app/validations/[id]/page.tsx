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
import Link from 'next/link';
import { validations } from '@/lib/api';

export default function ValidationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');

  const query = useQuery({
    queryKey: ['partner', 'validations', id],
    queryFn: () => validations.getById(id),
    enabled: !!id,
  });

  const decisionMutation = useMutation({
    mutationFn: () =>
      validations.submitDecision(id, {
        decision: decision as 'APPROVED' | 'REJECTED',
        notes,
      } as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'validations'] });
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
  const documents = (org.documents ?? []) as unknown as Record<string, unknown>[];
  const verificationHistory = (org.verificationHistory ?? []) as unknown as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/validations" className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Validations
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {String(org.publicName ?? org.legalName ?? 'Organization')}
          </h2>
          <Badge
            variant={
              String(org.status) === 'VERIFIED'
                ? 'success'
                : String(org.status) === 'PENDING'
                  ? 'warning'
                  : 'neutral'
            }
          >
            {String(org.status ?? '').replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Organization Info */}
          <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
            <h3 className="mb-5 text-base font-semibold text-gray-900">Organization Info</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
              {[
                { label: 'Legal Name', value: org.legalName },
                { label: 'Public Name', value: org.publicName },
                { label: 'Type', value: String(org.organizationType ?? '\u2014').replace(/_/g, ' ') },
                { label: 'Email', value: org.contactEmail },
                { label: 'Phone', value: org.contactPhone },
                { label: 'Website', value: org.websiteUrl },
              ].map((field) => (
                <div key={field.label}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {field.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">
                    {String(field.value ?? '\u2014')}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Documents */}
          <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
            <h3 className="mb-5 text-base font-semibold text-gray-900">Submitted Documents</h3>
            {documents.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-[12px] border-2 border-dashed border-gray-200 bg-gray-50/50 text-sm text-gray-400">
                No documents submitted
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-[12px] border border-gray-100 bg-gray-50/30 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                        <svg className="h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {String(doc.name ?? doc.type ?? `Document ${i + 1}`)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {doc.uploadedAt
                            ? new Date(String(doc.uploadedAt)).toLocaleString()
                            : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">View</Button>
                      <Button variant="outline" size="sm">Download</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verification History */}
          <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
            <h3 className="mb-5 text-base font-semibold text-gray-900">Verification History</h3>
            {verificationHistory.length === 0 ? (
              <p className="py-4 text-sm text-gray-400">No previous verification attempts</p>
            ) : (
              <div className="relative ml-3">
                <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {verificationHistory.map((entry, i) => (
                    <div key={i} className="relative flex gap-4 pl-6">
                      <div className={`absolute left-[-4.5px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${
                        String(entry.decision) === 'APPROVED' ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                      <div className="flex-1 rounded-[12px] border border-gray-100 bg-gray-50/50 p-3.5">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              String(entry.decision) === 'APPROVED' ? 'success' : 'danger'
                            }
                            size="sm"
                          >
                            {String(entry.decision ?? '')}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {entry.createdAt
                              ? new Date(String(entry.createdAt)).toLocaleString()
                              : ''}
                          </span>
                        </div>
                        {entry.notes ? (
                          <p className="mt-2 text-sm leading-relaxed text-gray-600">{String(entry.notes)}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Decision Panel */}
        <div className="space-y-5">
          <div className="rounded-[16px] border border-brand-100 bg-brand-50/30 p-6 shadow-card-lg">
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Decision
            </h4>
            {decisionMutation.isSuccess ? (
              <div className="flex items-center gap-2 rounded-[10px] border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Decision submitted successfully.
              </div>
            ) : (
              <div className="space-y-4">
                <Select
                  label="Verdict"
                  options={[
                    { value: 'APPROVED', label: 'Approve' },
                    { value: 'REJECTED', label: 'Reject' },
                  ]}
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  placeholder="Select decision..."
                />
                <Textarea
                  label="Notes"
                  placeholder="Provide reasoning for your decision..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
                <Button
                  variant="primary"
                  className="w-full rounded-[10px] bg-gradient-to-r from-brand-600 to-brand-700"
                  disabled={!decision}
                  loading={decisionMutation.isPending}
                  onClick={() => decisionMutation.mutate()}
                >
                  Submit Decision
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
