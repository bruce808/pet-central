'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, Badge, Input, Button, LoadingSpinner, EmptyState } from '@pet-central/ui';
import { messages } from '@/lib/api';
import type { ConversationResponse, MessageResponse } from '@pet-central/types';

export default function MessagesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: convos, isLoading } = useQuery({
    queryKey: ['vendor-conversations'],
    queryFn: () => messages.listConversations(),
  });

  const items = convos?.items ?? [];
  const selected = items.find((c: ConversationResponse) => c.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Left Panel - Conversation List */}
      <div className="w-80 shrink-0 overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-card">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Inbox</h2>
        </div>
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 57px)' }}>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : items.length === 0 ? (
            <p className="p-5 text-center text-sm text-gray-400">No conversations</p>
          ) : (
            items.map((convo: ConversationResponse) => (
              <button
                key={convo.id}
                type="button"
                onClick={() => setSelectedId(convo.id)}
                className={`flex w-full items-start gap-3 border-b border-gray-50 px-5 py-3.5 text-left transition-all duration-150 ${
                  selectedId === convo.id ? 'bg-brand-50' : 'hover:bg-gray-50'
                }`}
              >
                <Avatar
                  name={convo.participants?.[0]?.displayName ?? 'User'}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {convo.participants?.[0]?.displayName ?? 'User'}
                    </p>
                    <time className="shrink-0 text-xs text-gray-400">
                      {new Date(convo.createdAt).toLocaleDateString()}
                    </time>
                  </div>
                  {convo.listing && (
                    <p className="truncate text-xs text-brand-600">
                      {convo.listing.title}
                    </p>
                  )}
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {convo.lastMessage?.bodyText ?? 'No messages'}
                  </p>
                </div>
                {convo.unreadCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {convo.unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Message Thread */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-card">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              title="Select a conversation"
              description="Choose a conversation from the list to view messages."
            />
          </div>
        ) : (
          <MessageThread conversation={selected} />
        )}
      </div>
    </div>
  );
}

function MessageThread({ conversation }: { conversation: ConversationResponse }) {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['vendor-messages', conversation.id],
    queryFn: () => messages.getMessages(conversation.id),
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      messages.sendMessage(conversation.id, { content }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['vendor-messages', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['vendor-conversations'] });
    },
  });

  function handleSend() {
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  }

  const items = messagesData?.items ?? [];

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {conversation.participants?.[0]?.displayName ?? 'User'}
          </p>
          {conversation.listing && (
            <p className="text-xs text-gray-500">
              Re: {conversation.listing.title}
            </p>
          )}
        </div>
        <select className="rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-300">
          <option>Assign to…</option>
        </select>
      </div>

      <div className="flex flex-1 flex-col-reverse gap-3 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          items.map((msg: MessageResponse) => {
            const isOwn = msg.senderUserId !== conversation.participants?.[0]?.userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2.5 ${
                    isOwn
                      ? 'bg-brand-600 text-white rounded-2xl rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{msg.bodyText}</p>
                  <time
                    className={`mt-1 block text-right text-[10px] ${
                      isOwn ? 'text-brand-200' : 'text-gray-400'
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-gray-100 p-4">
        <div className="flex gap-3">
          <Input
            placeholder="Type a message…"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sendMutation.isPending || !newMessage.trim()}
            className="rounded-[10px] bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-brand-700 hover:to-brand-800 disabled:opacity-60"
          >
            {sendMutation.isPending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </>
  );
}
