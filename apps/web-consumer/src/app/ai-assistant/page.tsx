'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, LoadingSpinner } from '@pet-central/ui';
import { ai } from '@/lib/api';
import { ChatBubble } from '@/components/ChatBubble';
import type { AIChatResponse } from '@pet-central/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  sources?: AIChatResponse['sources'];
}

const SUGGESTED_PROMPTS = [
  'Help me choose a breed for my family',
  'What should I know about adopting?',
  'Compare breeders vs shelters',
  'Tips for first-time pet owners',
  'How to prepare my home for a puppy',
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      ai.chat({ message, sessionId }),
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: data.reply,
          sources: data.sources,
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'ai',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    chatMutation.mutate(text.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 sm:px-6">
      {/* Header */}
      <div className="border-b border-gray-200 py-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-1.5 text-sm font-medium text-purple-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          AI Pet Guidance
        </div>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Pet Assistant</h1>
        <p className="mt-1 text-sm text-gray-500">
          Get personalized guidance on finding and caring for your perfect pet.
        </p>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto py-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-3xl">
                🐾
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                How can I help you today?
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Ask me anything about pets, breeds, adoption, or care.
              </p>
            </div>

            {/* Suggested prompts */}
            <div className="mt-8 flex max-w-lg flex-wrap justify-center gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg.content}
                sender={msg.role === 'user' ? 'user' : 'ai'}
                senderName={msg.role === 'ai' ? 'PetCentral AI' : undefined}
                sources={msg.sources}
              />
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-purple-50 px-4 py-3">
                  <LoadingSpinner size="sm" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 py-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about breeds, adoption, pet care..."
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={chatMutation.isPending}
          />
          <Button
            type="submit"
            disabled={!input.trim() || chatMutation.isPending}
            className="!bg-purple-600 hover:!bg-purple-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </Button>
        </form>
        <p className="mt-2 text-center text-xs text-gray-400">
          AI responses are for guidance only. Always verify information with the organization directly.
        </p>
      </div>
    </div>
  );
}
