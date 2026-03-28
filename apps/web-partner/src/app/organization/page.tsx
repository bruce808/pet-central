'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, LoadingSpinner } from '@pet-central/ui';
import { organization } from '@/lib/api';

export default function OrganizationPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    publicName: '',
    partnerType: '',
    region: '',
    contactEmail: '',
    contactPhone: '',
    capabilities: '',
  });

  const query = useQuery({
    queryKey: ['partner', 'organization'],
    queryFn: organization.getProfile,
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      organization.updateProfile({
        publicName: form.publicName,
        region: form.region,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        capabilities: form.capabilities.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'organization'] });
      setEditing(false);
    },
  });

  const org = (query.data ?? {}) as Record<string, unknown>;

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const capabilities = Array.isArray(org.capabilities)
    ? (org.capabilities as string[])
    : String(org.capabilities ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Organization Profile</h2>
        {!editing && (
          <Button
            variant="outline"
            className="rounded-[10px]"
            onClick={() => {
              setForm({
                publicName: String(org.publicName ?? ''),
                partnerType: String(org.organizationType ?? ''),
                region: String(org.region ?? ''),
                contactEmail: String(org.contactEmail ?? ''),
                contactPhone: String(org.contactPhone ?? ''),
                capabilities: Array.isArray(org.capabilities)
                  ? (org.capabilities as string[]).join(', ')
                  : String(org.capabilities ?? ''),
              });
              setEditing(true);
            }}
          >
            Edit Profile
          </Button>
        )}
      </div>

      <div className="rounded-[16px] border border-gray-100 bg-white p-8 shadow-card">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate();
            }}
            className="space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Organization Name"
                value={form.publicName}
                onChange={(e) => setForm({ ...form, publicName: e.target.value })}
              />
              <Input
                label="Partner Type"
                value={form.partnerType}
                disabled
              />
              <Input
                label="Region"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              />
              <Input
                label="Contact Email"
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              />
              <Input
                label="Contact Phone"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              />
            </div>
            <Input
              label="Capabilities"
              value={form.capabilities}
              onChange={(e) => setForm({ ...form, capabilities: e.target.value })}
            />
            <p className="text-xs text-gray-400">Comma-separated list of capabilities</p>
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={updateMutation.isPending}
                className="rounded-[10px] bg-gradient-to-r from-brand-600 to-brand-700"
              >
                Save Changes
              </Button>
              <Button variant="outline" className="rounded-[10px]" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {[
                { label: 'Organization Name', value: org.publicName },
                { label: 'Partner Type', value: String(org.organizationType ?? '\u2014').replace(/_/g, ' ') },
                { label: 'Region', value: org.region },
                { label: 'Contact Email', value: org.contactEmail },
                { label: 'Contact Phone', value: org.contactPhone },
              ].map((field) => (
                <div key={field.label}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {field.label}
                  </dt>
                  <dd className="mt-1.5 text-sm font-medium text-gray-900">
                    {String(field.value ?? '\u2014')}
                  </dd>
                </div>
              ))}
            </dl>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Capabilities
              </dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {capabilities.length > 0 ? (
                  capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700"
                    >
                      {cap}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">&mdash;</span>
                )}
              </dd>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
