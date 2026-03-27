import type {
  AuthResponse,
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  SearchListingsQuery,
  ListingResponse,
  OrganizationResponse,
  ReviewResponse,
  ConversationResponse,
  MessageResponse,
  CreateConversationDto,
  SendMessageDto,
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponseDto,
  FlagReviewDto,
  ResourceResponse,
  AIChatDto,
  AIChatResponse,
  AIRecommendationDto,
  AIRecommendationResponse,
  PaginatedResponse,
  SignedUploadResponse,
  FavoriteDto,
} from '@pet-central/types';

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

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message ?? 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

function toQueryString(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, String(v)));
    } else {
      qs.set(key, String(value));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const auth = {
  register: (data: RegisterDto) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginDto) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiFetch<void>('/auth/logout', { method: 'POST' }),

  verifyEmail: (data: VerifyEmailDto) =>
    apiFetch<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  refreshToken: () =>
    apiFetch<AuthResponse>('/auth/refresh', { method: 'POST' }),
};

export const listings = {
  search: async (params: SearchListingsQuery) => {
    const raw = await apiFetch<{ data: ListingResponse[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/listings${toQueryString(params as Record<string, unknown>)}`,
    );
    return {
      items: raw.data,
      total: raw.meta.total,
      page: raw.meta.page,
      limit: raw.meta.limit,
      totalPages: raw.meta.totalPages,
    } satisfies PaginatedResponse<ListingResponse>;
  },

  getById: (id: string) =>
    apiFetch<ListingResponse>(`/listings/${id}`),
};

export const organizations = {
  getById: (id: string) =>
    apiFetch<OrganizationResponse>(`/organizations/${id}`),

  getReviews: (id: string, page = 1, limit = 10) =>
    apiFetch<PaginatedResponse<ReviewResponse>>(
      `/organizations/${id}/reviews?page=${page}&limit=${limit}`,
    ),
};

export const conversations = {
  list: (page = 1, limit = 20) =>
    apiFetch<PaginatedResponse<ConversationResponse>>(
      `/messaging/conversations?page=${page}&limit=${limit}`,
    ),

  getMessages: (conversationId: string, page = 1, limit = 50) =>
    apiFetch<PaginatedResponse<MessageResponse>>(
      `/messaging/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    ),

  create: (data: CreateConversationDto) =>
    apiFetch<ConversationResponse>('/messaging/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendMessage: (conversationId: string, data: SendMessageDto) =>
    apiFetch<MessageResponse>(
      `/messaging/conversations/${conversationId}/messages`,
      { method: 'POST', body: JSON.stringify(data) },
    ),
};

export const favorites = {
  list: (page = 1, limit = 20) =>
    apiFetch<PaginatedResponse<ListingResponse>>(
      `/users/me/favorites?page=${page}&limit=${limit}`,
    ),

  add: (data: FavoriteDto) =>
    apiFetch<void>('/users/me/favorites', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  remove: (listingId: string) =>
    apiFetch<void>(`/users/me/favorites/${listingId}`, {
      method: 'DELETE',
    }),
};

export const reviews = {
  create: (data: CreateReviewDto) =>
    apiFetch<ReviewResponse>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateReviewDto) =>
    apiFetch<ReviewResponse>(`/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  respond: (id: string, data: ReviewResponseDto) =>
    apiFetch<ReviewResponse>(`/reviews/${id}/response`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  flag: (id: string, data: FlagReviewDto) =>
    apiFetch<void>(`/reviews/${id}/flag`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const resources = {
  list: (params?: { type?: string; page?: number; limit?: number }) =>
    apiFetch<PaginatedResponse<ResourceResponse>>(
      `/content/resources${toQueryString((params ?? {}) as Record<string, unknown>)}`,
    ),

  getBySlug: (slug: string) =>
    apiFetch<ResourceResponse>(`/content/resources/${slug}`),
};

export const ai = {
  chat: (data: AIChatDto) =>
    apiFetch<AIChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getRecommendations: (data: AIRecommendationDto) =>
    apiFetch<AIRecommendationResponse>('/ai/recommendations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSession: (sessionId: string) =>
    apiFetch<{ messages: { role: string; content: string }[] }>(
      `/ai/sessions/${sessionId}`,
    ),
};

export const uploads = {
  getSignedUrl: (params: { fileName: string; mimeType: string }) =>
    apiFetch<SignedUploadResponse>(
      `/uploads/signed-url${toQueryString(params as Record<string, unknown>)}`,
    ),
};
