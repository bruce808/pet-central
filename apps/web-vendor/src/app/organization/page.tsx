'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, Textarea, Select, Button, LoadingSpinner } from '@pet-central/ui';
import { organization } from '@/lib/api';

export default function OrganizationPage() {
  const queryClient = useQueryClient();

  const { data: org, isLoading } = useQuery({
    queryKey: ['vendor-org'],
    queryFn: organization.get,
  });

  const [form, setForm] = useState({
    legalName: '',
    publicName: '',
    orgType: '',
    description: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    region: '',
    postalCode: '',
    country: '',
    serviceRadius: '',
  });

  useEffect(() => {
    if (org) {
      setForm({
        legalName: org.legalName ?? '',
        publicName: org.publicName ?? '',
        orgType: org.organizationType ?? '',
        description: org.description ?? '',
        website: (org as unknown as Record<string, unknown>).website as string ?? '',
        phone: org.phone ?? '',
        email: org.email ?? '',
        address: (org as unknown as Record<string, unknown>).address as string ?? '',
        city: org.city ?? '',
        region: org.region ?? '',
        postalCode: (org as unknown as Record<string, unknown>).postalCode as string ?? '',
        country: org.country ?? '',
        serviceRadius: String((org as unknown as Record<string, unknown>).serviceRadius ?? ''),
      });
    }
  }, [org]);

  const updateMutation = useMutation({
    mutationFn: () => {
      const { orgType, ...data } = form;
      return organization.update(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-org'] }),
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">
          Organization Profile
        </h2>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-[16px] bg-gradient-to-br from-brand-100 to-brand-50 text-2xl font-bold text-brand-700">
            {form.publicName?.[0] ?? 'O'}
          </div>
          <div>
            <Button variant="outline" size="sm">
              Upload Logo
            </Button>
            <p className="mt-1 text-xs text-gray-400">
              PNG, JPG up to 2MB. Recommended 200x200px.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Legal Name"
            value={form.legalName}
            onChange={(e) => update('legalName', e.target.value)}
          />
          <Input
            label="Public Name"
            value={form.publicName}
            onChange={(e) => update('publicName', e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Organization Type
            </label>
            <p className="rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
              {form.orgType || '—'}
            </p>
          </div>
          <Input
            label="Website"
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
            placeholder="https://…"
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>

        <div className="mt-4">
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={4}
            placeholder="Tell potential adopters about your organization…"
          />
        </div>
      </div>

      <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">Location</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
            />
          </div>
          <Input
            label="City"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
          />
          <Input
            label="Region / State"
            value={form.region}
            onChange={(e) => update('region', e.target.value)}
          />
          <Input
            label="Postal Code"
            value={form.postalCode}
            onChange={(e) => update('postalCode', e.target.value)}
          />
          <Input
            label="Country"
            value={form.country}
            onChange={(e) => update('country', e.target.value)}
          />
          <Input
            label="Service Radius (km)"
            type="number"
            value={form.serviceRadius}
            onChange={(e) => update('serviceRadius', e.target.value)}
            placeholder="e.g. 50"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="rounded-[10px] bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-brand-700 hover:to-brand-800 disabled:opacity-60"
        >
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
