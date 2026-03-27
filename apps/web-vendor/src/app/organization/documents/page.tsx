'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Select,
  StatusBadge,
  LoadingSpinner,
  EmptyState,
} from '@pet-central/ui';
import { organization } from '@/lib/api';

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [docType, setDocType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['vendor-documents'],
    queryFn: organization.getDocuments,
  });

  const uploadMutation = useMutation({
    mutationFn: () =>
      organization.uploadDocument({
        type: docType,
        fileName: selectedFile?.name ?? '',
        mimeType: selectedFile?.type ?? '',
      }),
    onSuccess: () => {
      setDocType('');
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['vendor-documents'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Upload Document
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="w-full sm:w-60">
            <Select
              label="Document Type"
              options={[
                { value: 'LICENSE', label: 'License' },
                { value: 'INSURANCE', label: 'Insurance' },
                { value: 'REGISTRATION', label: 'Registration' },
                { value: 'INSPECTION', label: 'Inspection Report' },
                { value: 'TAX', label: 'Tax Document' },
                { value: 'OTHER', label: 'Other' },
              ]}
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              File
            </label>
            <div
              className="flex cursor-pointer items-center gap-3 rounded-[16px] border-2 border-dashed border-gray-300 px-4 py-3 text-sm transition-all duration-200 hover:border-brand-300 hover:bg-brand-50/30"
              onClick={() => document.getElementById('doc-upload')?.click()}
            >
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-gray-500">
                {selectedFile?.name ?? 'Choose file…'}
              </span>
              <input
                id="doc-upload"
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => uploadMutation.mutate()}
            loading={uploadMutation.isPending}
            disabled={!docType || !selectedFile}
          >
            Upload
          </Button>
        </div>
      </div>

      {/* Existing Documents */}
      <div className="rounded-[16px] border border-gray-100 bg-white shadow-card overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Existing Documents</h2>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : !documents || documents.length === 0 ? (
          <EmptyState
            title="No documents uploaded"
            description="Upload verification documents to complete your organization profile."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-3 py-3.5">Uploaded</th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {documents.map((doc) => (
                  <tr key={doc.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gray-100">
                          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-900">{doc.type}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge
                        status={doc.status}
                        statusMap={{
                          PENDING: 'warning',
                          VERIFIED: 'success',
                          REJECTED: 'danger',
                        }}
                      />
                    </td>
                    <td className="px-3 py-3.5 text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
