'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, LoadingSpinner } from '@pet-central/ui';
import Link from 'next/link';
import { ai } from '@/lib/api';
import { trackActivity, updateSession, getSessionState } from '@/lib/kiosk-session';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: Record<string, unknown>[];
}

const STARTER_QUESTIONS = [
  "What's your living situation?",
  'Do you have other pets?',
  "What's your experience level with pets?",
  'How active is your lifestyle?',
  'Do you have young children?',
];

export default function AIGuidePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your pet matching assistant. I'll help you find the perfect pet. Tell me a bit about yourself, or pick a question below to get started!",
    },
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      ai.chat({
        message,
        conversationId,
        context: { source: 'kiosk' },
      } as never),
    onSuccess: (data) => {
      const response = data as unknown as Record<string, unknown>;
      if (response.conversationId) {
        setConversationId(String(response.conversationId));
        updateSession({ aiConversationId: String(response.conversationId) });
      }
      const recommendations = Array.isArray(response.recommendations)
        ? (response.recommendations as unknown as Record<string, unknown>[])
        : [];
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: String(response.message ?? response.content ?? ''),
          recommendations,
        },
      ]);
    },
  });

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    trackActivity();
    setMessages((prev) => [...prev, { role: 'user', content: text.trim() }]);
    setInput('');
    chatMutation.mutate(text.trim());
  };

  const handleSendResults = () => {
    const session = getSessionState();
    if (session) {
      window.location.href = `/handoff?ai=${session.aiConversationId ?? ''}`;
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-3xl flex-col animate-fade-in-up">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700">
            <SparklesIcon className="h-4 w-4" />
            AI-Powered
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-gray-900">
            Pet Guide
          </h2>
        </div>
        <button
          onClick={handleSendResults}
          className="flex min-h-[48px] items-center gap-2 rounded-pill border border-gray-200 bg-white px-5 py-2.5 text-base font-medium text-gray-600 shadow-sm transition-all hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
        >
          <PhoneIcon className="h-4 w-4" />
          Send to phone
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-card border border-gray-100 bg-white shadow-card-lg">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="mr-3 mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                  <SparklesIcon className="h-4 w-4 text-purple-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-5 py-3 text-lg ${
                  msg.role === 'user'
                    ? 'rounded-2xl rounded-br-sm bg-brand-600 text-white shadow-sm'
                    : 'rounded-2xl rounded-bl-sm bg-purple-50 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.recommendations.map((rec, j) => (
                      <Link
                        key={j}
                        href={`/listings/${String(rec.listingId ?? rec.id ?? '')}`}
                        className="flex items-center gap-3 rounded-xl border border-purple-100 bg-white p-3 shadow-sm transition-all hover:border-purple-200 hover:shadow-card"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                          <PawIcon className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {String(rec.name ?? rec.petName ?? 'Pet')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {String(rec.breed ?? '')} · {String(rec.age ?? '')}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="mr-3 mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                <SparklesIcon className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-purple-50 px-5 py-4">
                <span className="h-2 w-2 animate-pulse-soft rounded-full bg-purple-400" />
                <span className="h-2 w-2 animate-pulse-soft rounded-full bg-purple-300" style={{ animationDelay: '200ms' }} />
                <span className="h-2 w-2 animate-pulse-soft rounded-full bg-purple-200" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}
        </div>

        {messages.length === 1 && (
          <div className="border-t border-gray-100 px-6 py-4">
            <p className="mb-3 text-sm font-medium text-gray-400">Quick questions to get started:</p>
            <div className="flex flex-wrap gap-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="min-h-[48px] rounded-pill border border-gray-200 bg-white px-5 py-3 text-base font-medium text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer..."
              className="min-h-[60px] flex-1 rounded-xl border-2 border-gray-200 px-5 text-lg outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
            <button
              type="submit"
              disabled={!input.trim() || chatMutation.isPending}
              className="flex min-h-[60px] min-w-[100px] items-center justify-center gap-2 rounded-xl bg-purple-600 text-lg font-semibold text-white transition-all hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600"
            >
              <SendIcon className="h-5 w-5" />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function PawIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.35 3c1.1 0 2 1.2 2 2.7s-.9 2.7-2 2.7-2-1.2-2-2.7.9-2.7 2-2.7zm7.3 0c1.1 0 2 1.2 2 2.7s-.9 2.7-2 2.7-2-1.2-2-2.7.9-2.7 2-2.7zm-10.6 5.7c1.1 0 2 1 2 2.3s-.9 2.3-2 2.3-2-1-2-2.3.9-2.3 2-2.3zm13.9 0c1.1 0 2 1 2 2.3s-.9 2.3-2 2.3-2-1-2-2.3.9-2.3 2-2.3zM12 12.5c2.3 0 4.2 1.5 4.2 3.4 0 2.3-1.5 4.6-4.2 4.6s-4.2-2.3-4.2-4.6c0-1.9 1.9-3.4 4.2-3.4z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  );
}
