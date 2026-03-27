import type {
  SearchListingsQuery,
  SearchResponse,
  ListingResponse,
  AIChatDto,
  AIChatResponse,
  AIRecommendationResponse,
  ChannelOriginResponse,
  ResolveOriginDto,
} from '@pet-central/types';
import type { HandoffRequest, HandoffResponse } from '@pet-central/partner-routing';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5100/api/v1';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

function qs(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export const listings = {
  search: (params: SearchListingsQuery) =>
    apiFetch<SearchResponse<ListingResponse>>(
      `/listings/search${qs(params as unknown as Record<string, unknown>)}`,
    ),
  getById: (id: string) =>
    apiFetch<ListingResponse>(`/listings/${id}`),
};

export const ai = {
  chat: (data: AIChatDto) =>
    apiFetch<AIChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getRecommendations: (params: Record<string, unknown>) =>
    apiFetch<AIRecommendationResponse>(
      `/ai/recommendations${qs(params)}`,
    ),
};

export const channel = {
  resolveOrigin: (data: ResolveOriginDto) =>
    apiFetch<ChannelOriginResponse>('/channels/resolve-origin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const handoff = {
  create: (data: HandoffRequest) =>
    apiFetch<HandoffResponse>('/kiosk/handoff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
