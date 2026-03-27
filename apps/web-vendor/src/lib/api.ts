import type {
  AuthResponse,
  LoginDto,
  OrganizationResponse,
  ListingResponse,
  PetResponse,
  ConversationResponse,
  MessageResponse,
  ReviewResponse,
  ResourceResponse,
  PaginatedResponse,
  SignedUploadResponse,
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

export { ApiError };

export const auth = {
  login: (data: LoginDto) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),

  register: (data: Record<string, unknown>) =>
    apiFetch<AuthResponse>('/auth/vendor/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const organization = {
  get: () => apiFetch<OrganizationResponse>('/vendor/organization'),

  update: (data: Record<string, unknown>) =>
    apiFetch<OrganizationResponse>('/vendor/organization', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  uploadDocument: (data: Record<string, unknown>) =>
    apiFetch<{ id: string; status: string }>('/vendor/organization/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDocuments: () =>
    apiFetch<
      { id: string; type: string; status: string; createdAt: string }[]
    >('/vendor/organization/documents'),

  getMembers: () =>
    apiFetch<
      {
        id: string;
        name: string;
        email: string;
        role: string;
        joinedAt: string;
      }[]
    >('/vendor/organization/members'),

  addMember: (data: Record<string, unknown>) =>
    apiFetch<{ id: string }>('/vendor/organization/members', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeMember: (memberId: string) =>
    apiFetch<void>(`/vendor/organization/members/${memberId}`, {
      method: 'DELETE',
    }),
};

export const listings = {
  list: (params?: {
    status?: string;
    petType?: string;
    page?: number;
    limit?: number;
  }) =>
    apiFetch<PaginatedResponse<ListingResponse>>(
      `/vendor/listings${toQueryString((params ?? {}) as unknown as Record<string, unknown>)}`,
    ),

  getById: (id: string) =>
    apiFetch<ListingResponse>(`/vendor/listings/${id}`),

  create: (data: Record<string, unknown>) =>
    apiFetch<ListingResponse>('/vendor/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    apiFetch<ListingResponse>(`/vendor/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  publish: (id: string) =>
    apiFetch<ListingResponse>(`/vendor/listings/${id}/publish`, {
      method: 'POST',
    }),

  pause: (id: string) =>
    apiFetch<ListingResponse>(`/vendor/listings/${id}/pause`, {
      method: 'POST',
    }),

  delete: (id: string) =>
    apiFetch<void>(`/vendor/listings/${id}`, { method: 'DELETE' }),
};

export const pets = {
  create: (data: Record<string, unknown>) =>
    apiFetch<PetResponse>('/vendor/pets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    apiFetch<PetResponse>(`/vendor/pets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  addMedia: (petId: string, data: Record<string, unknown>) =>
    apiFetch<{ id: string }>(`/vendor/pets/${petId}/media`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeMedia: (petId: string, mediaId: string) =>
    apiFetch<void>(`/vendor/pets/${petId}/media/${mediaId}`, {
      method: 'DELETE',
    }),
};

export const messages = {
  listConversations: (page = 1, limit = 20) =>
    apiFetch<PaginatedResponse<ConversationResponse>>(
      `/vendor/messaging/conversations?page=${page}&limit=${limit}`,
    ),

  getMessages: (conversationId: string, page = 1, limit = 50) =>
    apiFetch<PaginatedResponse<MessageResponse>>(
      `/vendor/messaging/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    ),

  sendMessage: (conversationId: string, data: Record<string, unknown>) =>
    apiFetch<MessageResponse>(
      `/vendor/messaging/conversations/${conversationId}/messages`,
      { method: 'POST', body: JSON.stringify(data) },
    ),
};

export const reviews = {
  listReceived: (page = 1, limit = 20) =>
    apiFetch<PaginatedResponse<ReviewResponse>>(
      `/vendor/reviews?page=${page}&limit=${limit}`,
    ),

  respond: (id: string, data: Record<string, unknown>) =>
    apiFetch<ReviewResponse>(`/vendor/reviews/${id}/response`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitFeedback: (data: {
    userId: string;
    conversationId?: string;
    responsiveness: number;
    seriousness: number;
    courtesy: number;
    notes?: string;
  }) =>
    apiFetch<void>('/vendor/reviews/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const resources = {
  list: (params?: { type?: string; page?: number; limit?: number }) =>
    apiFetch<PaginatedResponse<ResourceResponse>>(
      `/vendor/resources${toQueryString((params ?? {}) as unknown as Record<string, unknown>)}`,
    ),

  create: (data: Record<string, unknown>) =>
    apiFetch<ResourceResponse>('/vendor/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    apiFetch<ResourceResponse>(`/vendor/resources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export const analytics = {
  getStats: () =>
    apiFetch<{
      totalListings: number;
      activeListings: number;
      totalInquiries: number;
      totalReviews: number;
      averageRating: number;
      responseRate: number;
      avgResponseTimeMinutes: number;
      conversionRate: number;
      pendingVerifications: number;
      listingsPerformance: {
        id: string;
        title: string;
        views: number;
        inquiries: number;
        favorites: number;
      }[];
      recentInquiries: {
        id: string;
        userName: string;
        listingTitle: string;
        lastMessage: string;
        unread: boolean;
        createdAt: string;
      }[];
      actionItems: {
        pendingDocuments: number;
        unansweredMessages: number;
        newReviews: number;
      };
    }>('/vendor/analytics/stats'),
};

export const uploads = {
  getSignedUrl: (params: { fileName: string; mimeType: string }) =>
    apiFetch<SignedUploadResponse>(
      `/uploads/signed-url${toQueryString(params as unknown as Record<string, unknown>)}`,
    ),
};
