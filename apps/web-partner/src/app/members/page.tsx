'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DataTable,
  Badge,
  Button,
  Input,
  Select,
  LoadingSpinner,
} from '@pet-central/ui';
import { members } from '@/lib/api';
import type { Column } from '@pet-central/ui';

const roleColors: Record<string, string> = {
  PARTNER_ADMIN: 'bg-purple-50 text-purple-700',
  PARTNER_MANAGER: 'bg-blue-50 text-blue-700',
  PARTNER_MEMBER: 'bg-gray-100 text-gray-700',
};

export default function MembersPage() {
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');

  const query = useQuery({
    queryKey: ['partner', 'members'],
    queryFn: () => members.list(),
  });

  const addMutation = useMutation({
    mutationFn: () => members.add({ email: inviteEmail, role: inviteRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'members'] });
      setInviteEmail('');
      setInviteRole('');
      setShowInvite(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => members.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'members'] });
    },
  });

  const data = (query.data?.items ?? []) as unknown as Record<string, unknown>[];

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-semibold text-white">
            {String(row.name ?? row.email ?? '?').charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {String(row.name ?? row.email ?? '\u2014')}
          </span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => (
        <span className="text-sm text-gray-600">{String(row.email ?? '\u2014')}</span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => {
        const role = String(row.role ?? '');
        const colorClass = roleColors[role] ?? 'bg-gray-100 text-gray-700';
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
            {role.replace(/^PARTNER_/, '').replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge
          variant={
            String(row.status) === 'ACTIVE'
              ? 'success'
              : String(row.status) === 'INVITED'
                ? 'warning'
                : 'neutral'
          }
        >
          {String(row.status ?? '').replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button
          onClick={() => removeMutation.mutate(String(row.id))}
          className="rounded-full p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
          aria-label="Remove member"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Members</h2>
        <Button
          onClick={() => setShowInvite(!showInvite)}
          className={showInvite ? '' : 'bg-gradient-to-r from-brand-600 to-brand-700'}
          variant={showInvite ? 'outline' : 'primary'}
        >
          {showInvite ? 'Cancel' : 'Invite Member'}
        </Button>
      </div>

      {showInvite && (
        <div className="rounded-[16px] border border-brand-100 bg-brand-50/30 p-6 shadow-card">
          <h3 className="mb-4 text-base font-semibold text-gray-900">Invite New Member</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addMutation.mutate();
            }}
            className="flex flex-wrap items-end gap-4"
          >
            <div className="min-w-[200px] flex-1">
              <Input
                label="Email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@partner-org.com"
                required
              />
            </div>
            <div className="min-w-[160px]">
              <Select
                label="Role"
                options={[
                  { value: 'PARTNER_ADMIN', label: 'Admin' },
                  { value: 'PARTNER_MANAGER', label: 'Manager' },
                  { value: 'PARTNER_MEMBER', label: 'Member' },
                ]}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                placeholder="Select role..."
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              loading={addMutation.isPending}
              disabled={!inviteEmail || !inviteRole}
              className="rounded-[10px] bg-gradient-to-r from-brand-600 to-brand-700"
            >
              Send Invite
            </Button>
          </form>
        </div>
      )}

      {query.isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-card">
          <DataTable columns={columns} data={data} />
        </div>
      )}
    </div>
  );
}
