'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner, Button, Avatar } from '@pet-central/ui';
import { conversations } from '@/lib/api';
import { ChatBubble } from '@/components/ChatBubble';
import type { ConversationResponse, MessageResponse } from '@pet-central/types';

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: convos, isLoading: loadingConvos } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversations.list(1, 50),
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', selectedId],
    queryFn: () => conversations.getMessages(selectedId!, 1, 100),
    enabled: !!selectedId,
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      conversations.sendMessage(id, { bodyText: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setNewMessage('');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedId) return;
    sendMutation.mutate({ id: selectedId, text: newMessage });
  };

  const selected = convos?.items.find((c) => c.id === selectedId);

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-7xl">
      {/* Conversation list */}
      <div className="w-80 shrink-0 border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-4">
          <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
        </div>

        {loadingConvos && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        <div className="overflow-y-auto">
          {convos?.items.map((convo) => (
            <ConversationItem
              key={convo.id}
              convo={convo}
              isSelected={selectedId === convo.id}
              onClick={() => setSelectedId(convo.id)}
            />
          ))}
          {convos?.items.length === 0 && (
            <p className="px-4 py-12 text-center text-sm text-gray-500">
              No conversations yet
            </p>
          )}
        </div>
      </div>

      {/* Message thread */}
      <div className="flex flex-1 flex-col bg-gray-50">
        {selectedId && selected ? (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-4">
              <Avatar name={selected.organization?.publicName ?? 'Organization'} size="sm" />
              <div>
                <h2 className="font-semibold text-gray-900">
                  {selected.organization?.publicName ?? 'Unknown'}
                </h2>
                {selected.listing && (
                  <span className="text-xs text-gray-500">
                    Re: {selected.listing.title}
                  </span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loadingMessages && (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              )}

              <div className="space-y-4">
                {messages?.items.map((msg: MessageResponse) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg.bodyText}
                    sender={msg.messageType === 'system' ? 'system' : 'other'}
                    senderName={msg.senderDisplayName}
                    timestamp={new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button
                  onClick={handleSend}
                  loading={sendMutation.isPending}
                  disabled={!newMessage.trim()}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <p className="mt-2 text-sm">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  convo,
  isSelected,
  onClick,
}: {
  convo: ConversationResponse;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
        isSelected ? 'bg-brand-50' : 'hover:bg-gray-50'
      }`}
    >
      <Avatar name={convo.organization?.publicName ?? 'Org'} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-semibold text-gray-900">
            {convo.organization?.publicName ?? 'Unknown'}
          </span>
          {convo.unreadCount > 0 && (
            <span className="ml-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
              {convo.unreadCount}
            </span>
          )}
        </div>
        {convo.lastMessage && (
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {convo.lastMessage.bodyText}
          </p>
        )}
      </div>
    </button>
  );
}
