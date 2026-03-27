import type {
  PaginatedResponse,
  DashboardStatsResponse,
  CaseResponse,
  CreateCaseDto,
  UpdateCaseDto,
  AddCaseEventDto,
  AddCaseNoteDto,
  AssignCaseDto,
  OrganizationResponse,
  BadgeResponse,
  VerificationDecisionDto,
  ModerateContentDto,
  AuditLogQuery,
  AuditLogResponse,
  AICorrespondenceRunResponse,
  DiscoveredEntityResponse,
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

export const dashboard = {
  getStats: () => apiFetch<DashboardStatsResponse>('/admin/dashboard/stats'),
};

export const cases = {
  list: (params: Record<string, unknown> = {}) =>
    apiFetch<PaginatedResponse<CaseResponse>>(`/admin/cases${qs(params)}`),
  getById: (id: string) => apiFetch<CaseResponse>(`/admin/cases/${id}`),
  create: (data: CreateCaseDto) =>
    apiFetch<CaseResponse>('/admin/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  assign: (id: string, data: AssignCaseDto) =>
    apiFetch<CaseResponse>(`/admin/cases/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  addEvent: (id: string, data: AddCaseEventDto) =>
    apiFetch<CaseResponse>(`/admin/cases/${id}/events`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  addNote: (id: string, data: AddCaseNoteDto) =>
    apiFetch<CaseResponse>(`/admin/cases/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateCaseDto) =>
    apiFetch<CaseResponse>(`/admin/cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export const organizations = {
  list: (params: Record<string, unknown> = {}) =>
    apiFetch<PaginatedResponse<OrganizationResponse>>(
      `/admin/organizations${qs(params)}`,
    ),
  getById: (id: string) =>
    apiFetch<OrganizationResponse>(`/admin/organizations/${id}`),
  assignBadge: (id: string, data: { badgeType: string }) =>
    apiFetch<BadgeResponse>(`/admin/organizations/${id}/badges`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeBadge: (id: string, badgeId: string) =>
    apiFetch<void>(`/admin/organizations/${id}/badges/${badgeId}`, {
      method: 'DELETE',
    }),
  makeVerificationDecision: (id: string, data: VerificationDecisionDto) =>
    apiFetch<OrganizationResponse>(
      `/admin/organizations/${id}/verification-decision`,
      { method: 'POST', body: JSON.stringify(data) },
    ),
  getTrustProfile: (id: string) =>
    apiFetch<Record<string, unknown>>(
      `/admin/organizations/${id}/trust-profile`,
    ),
};

export const moderation = {
  getQueue: (params: Record<string, unknown> = {}) =>
    apiFetch<PaginatedResponse<Record<string, unknown>>>(
      `/admin/moderation/queue${qs(params)}`,
    ),
  moderateReview: (id: string, data: ModerateContentDto) =>
    apiFetch<void>(`/admin/moderation/reviews/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  moderateMessage: (id: string, data: ModerateContentDto) =>
    apiFetch<void>(`/admin/moderation/messages/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const users = {
  list: (params: Record<string, unknown> = {}) =>
    apiFetch<PaginatedResponse<Record<string, unknown>>>(
      `/admin/users${qs(params)}`,
    ),
  updateStatus: (id: string, data: { status: string }) =>
    apiFetch<void>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export const auditLog = {
  search: (params: AuditLogQuery) =>
    apiFetch<PaginatedResponse<AuditLogResponse>>(
      `/admin/audit-log${qs(params as unknown as Record<string, unknown>)}`,
    ),
};

export const partners = {
  list: (params: Record<string, unknown> = {}) =>
    apiFetch<PaginatedResponse<Record<string, unknown>>>(
      `/admin/partners${qs(params)}`,
    ),
  create: (data: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>('/admin/partners', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getById: (id: string) =>
    apiFetch<Record<string, unknown>>(`/admin/partners/${id}`),
  update: (id: string, data: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>(`/admin/partners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export const aiCorrespondence = {
  listRuns: (params: Record<string, unknown> = {}) =>
    apiFetch<PaginatedResponse<AICorrespondenceRunResponse>>(
      `/admin/ai/correspondence${qs(params)}`,
    ),
  getRun: (id: string) =>
    apiFetch<AICorrespondenceRunResponse>(`/admin/ai/correspondence/${id}`),
};

export const aiDiscovery = {
  listEntities: (params: Record<string, unknown> = {}) =>
    apiFetch<PaginatedResponse<DiscoveredEntityResponse>>(
      `/admin/ai/discovery${qs(params)}`,
    ),
  updateEntity: (id: string, data: Record<string, unknown>) =>
    apiFetch<DiscoveredEntityResponse>(`/admin/ai/discovery/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export const auth = {
  login: (data: { email: string; password: string; mfaCode?: string }) =>
    apiFetch<{ accessToken: string; user: Record<string, unknown> }>(
      '/admin/auth/login',
      { method: 'POST', body: JSON.stringify(data) },
    ),
  logout: () =>
    apiFetch<void>('/admin/auth/logout', { method: 'POST' }),
};
