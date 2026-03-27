'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  StatusBadge,
  LoadingSpinner,
  EmptyState,
} from '@pet-central/ui';
import { resources as resourcesApi } from '@/lib/api';
import type { ResourceResponse } from '@pet-central/types';

export default function ResourcesPage() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', type: '', content: '', status: 'DRAFT' });

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-resources'],
    queryFn: () => resourcesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      resourcesApi.create({
        title: form.title,
        type: form.type,
        content: form.content,
      }),
    onSuccess: () => {
      setShowNew(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['vendor-resources'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      resourcesApi.update(editId!, {
        title: form.title,
        type: form.type,
        content: form.content,
      }),
    onSuccess: () => {
      setEditId(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['vendor-resources'] });
    },
  });

  function resetForm() {
    setForm({ title: '', type: '', content: '', status: 'DRAFT' });
  }

  function openEdit(resource: ResourceResponse) {
    setForm({
      title: resource.title,
      type: resource.resourceType ?? '',
      content: resource.bodyMarkdown ?? '',
      status: resource.status ?? 'DRAFT',
    });
    setEditId(resource.id);
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{data?.total ?? 0} resources</p>
        <Button variant="primary" size="md" onClick={() => setShowNew(true)}>
          New Resource
        </Button>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No resources yet"
            description="Create educational content for potential adopters."
            action={{ label: 'New Resource', onClick: () => setShowNew(true) }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Published</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((resource: ResourceResponse) => (
                  <tr key={resource.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {resource.title}
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {resource.resourceType ?? '—'}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={resource.status ?? 'DRAFT'} />
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {resource.publishedAt
                        ? new Date(resource.publishedAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(resource)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* New Resource Modal */}
      <Modal
        isOpen={showNew}
        onClose={() => { setShowNew(false); resetForm(); }}
        title="New Resource"
        size="lg"
      >
        <ResourceForm
          form={form}
          setForm={setForm}
          onSubmit={() => createMutation.mutate()}
          onCancel={() => { setShowNew(false); resetForm(); }}
          loading={createMutation.isPending}
          submitLabel="Create"
        />
      </Modal>

      {/* Edit Resource Modal */}
      <Modal
        isOpen={!!editId}
        onClose={() => { setEditId(null); resetForm(); }}
        title="Edit Resource"
        size="lg"
      >
        <ResourceForm
          form={form}
          setForm={setForm}
          onSubmit={() => updateMutation.mutate()}
          onCancel={() => { setEditId(null); resetForm(); }}
          loading={updateMutation.isPending}
          submitLabel="Save"
        />
      </Modal>
    </div>
  );
}

function ResourceForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  loading,
  submitLabel,
}: {
  form: { title: string; type: string; content: string; status: string };
  setForm: (fn: (prev: typeof form) => typeof form) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="space-y-4">
      <Input
        label="Title"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        required
      />
      <Select
        label="Type"
        options={[
          { value: 'ARTICLE', label: 'Article' },
          { value: 'GUIDE', label: 'Guide' },
          { value: 'FAQ', label: 'FAQ' },
          { value: 'VIDEO', label: 'Video' },
        ]}
        value={form.type}
        onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
      />
      <Textarea
        label="Content"
        value={form.content}
        onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
        rows={8}
        placeholder="Write your resource content…"
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSubmit}
          loading={loading}
          disabled={!form.title}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
