'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Input,
  Select,
  Modal,
  LoadingSpinner,
  EmptyState,
} from '@pet-central/ui';
import { organization } from '@/lib/api';

export default function MembersPage() {
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  const { data: members, isLoading } = useQuery({
    queryKey: ['vendor-members'],
    queryFn: organization.getMembers,
  });

  const addMutation = useMutation({
    mutationFn: () =>
      organization.addMember({ email: inviteEmail, role: inviteRole }),
    onSuccess: () => {
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
      queryClient.invalidateQueries({ queryKey: ['vendor-members'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => organization.removeMember(memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-members'] }),
  });

  const roleBadgeColors: Record<string, string> = {
    ADMIN: 'bg-purple-50 text-purple-700',
    MEMBER: 'bg-gray-100 text-gray-700',
    OWNER: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
          <p className="mt-1 text-sm text-gray-500">
            {members?.length ?? 0} member{members?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowInvite(true)}>
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
            Invite Member
          </span>
        </Button>
      </div>

      <div className="rounded-[16px] border border-gray-100 bg-white shadow-card overflow-hidden">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : !members || members.length === 0 ? (
          <EmptyState
            title="No team members"
            description="Invite staff members to help manage your organization."
            action={{ label: 'Invite Member', onClick: () => setShowInvite(true) }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-3 py-3.5">Email</th>
                  <th className="px-3 py-3.5">Role</th>
                  <th className="px-3 py-3.5">Joined</th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((member) => (
                  <tr key={member.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-semibold text-white">
                          {member.name?.[0] ?? 'U'}
                        </div>
                        <span className="font-medium text-gray-900">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-gray-500">{member.email}</td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadgeColors[member.role] ?? 'bg-gray-100 text-gray-700'}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-gray-500">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Remove ${member.name}?`)) {
                            removeMutation.mutate(member.id);
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        title="Invite Member"
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-[10px] border border-brand-100 bg-brand-50/30 p-4">
            <p className="text-sm text-brand-700">
              Team members will have access to manage listings, messages, and organization settings based on their role.
            </p>
          </div>
          <Input
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@example.com"
            required
          />
          <Select
            label="Role"
            options={[
              { value: 'MEMBER', label: 'Member' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowInvite(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => addMutation.mutate()}
              loading={addMutation.isPending}
              disabled={!inviteEmail}
            >
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
