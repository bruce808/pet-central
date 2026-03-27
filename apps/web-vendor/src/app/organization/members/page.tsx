'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Button,
  Input,
  Select,
  Badge,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {members?.length ?? 0} member{members?.length !== 1 ? 's' : ''}
        </p>
        <Button variant="primary" size="md" onClick={() => setShowInvite(true)}>
          Invite Member
        </Button>
      </div>

      <Card padding="none">
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
                  <th className="px-5 py-3">Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {member.name}
                    </td>
                    <td className="px-3 py-3 text-gray-500">{member.email}</td>
                    <td className="px-3 py-3">
                      <Badge
                        variant={member.role === 'ADMIN' ? 'info' : 'neutral'}
                        size="sm"
                      >
                        {member.role}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
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
      </Card>

      <Modal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        title="Invite Member"
        size="sm"
      >
        <div className="space-y-4">
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
