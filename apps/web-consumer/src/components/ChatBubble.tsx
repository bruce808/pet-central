interface ChatBubbleProps {
  message: string;
  sender: 'user' | 'other' | 'ai' | 'system';
  senderName?: string;
  timestamp?: string;
  sources?: { type: string; id: string; title: string; url?: string }[];
}

export function ChatBubble({
  message,
  sender,
  senderName,
  timestamp,
  sources,
}: ChatBubbleProps) {
  const isUser = sender === 'user';
  const isSystem = sender === 'system';

  if (isSystem) {
    return (
      <div className="my-2 text-center text-xs text-gray-400">{message}</div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {senderName && !isUser && (
          <span className="text-xs font-medium text-gray-500">{senderName}</span>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'rounded-br-md bg-brand-600 text-white'
              : sender === 'ai'
                ? 'rounded-bl-md bg-purple-50 text-gray-800'
                : 'rounded-bl-md bg-gray-100 text-gray-800'
          }`}
        >
          {message}
        </div>

        {/* AI source citations */}
        {sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {sources.map((source) => (
              <a
                key={source.id}
                href={source.url ?? `/${source.type}s/${source.id}`}
                className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs text-purple-600 hover:bg-purple-100"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.556a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.343 8.28" />
                </svg>
                {source.title}
              </a>
            ))}
          </div>
        )}

        {timestamp && (
          <span className="text-[10px] text-gray-400">{timestamp}</span>
        )}
      </div>
    </div>
  );
}
