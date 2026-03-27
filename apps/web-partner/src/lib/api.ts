import type {
  PaginatedResponse,
  CaseResponse,
  AddCaseNoteDto,
  AddCaseEventDto,
  OrganizationResponse,
  VerificationDecisionDto,
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

export const auth = {
  login: (data: { email: string; password: string }) =>
    apiFetch<{ accessToken: string; user: Record<string, unknown> }>(
      '/partner/auth/login',
      { method: 'POST', body: JSON.stringify(data) },
    ),
  logout: () =>
    apiFetch<void>('/partner/auth/logout', { method: 'POST' }),
};

export const dashboard = {
  getStats: () =>
    apiFetch<{
      assignedCases: number;
      pendingValidations: number;
      completedThisMonth: number;
      avgResolutionTime: string;
    }>('/partner/dashboard/stats'),
};

export const cases = {
  listAssigned: (params: Record<string, unknown> = {}) =>
    apiFetch<PaginatedResponse<CaseResponse>>(
      `/partner/cases${qs(params)}`,
    ),
  getById: (id: string) =>
    apiFetch<CaseResponse>(`/partner/cases/${id}`),
  addNote: (id: string, data: AddCaseNoteDto) =>
    apiFetch<CaseResponse>(`/partner/cases/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  addEvent: (id: string, data: AddCaseEventDto) =>
    apiFetch<CaseResponse>(`/partner/cases/${id}/events`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStatus: (id: string, status: string) =>
    apiFetch<CaseResponse>(`/partner/cases/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

export const validations = {
  listPending: (params: Record<string, unknown> = {}) =>
    apiFetch<PaginatedResponse<OrganizationResponse>>(
      `/partner/validations${qs(params)}`,
    ),
  getById: (id: string) =>
    apiFetch<OrganizationResponse>(`/partner/validations/${id}`),
  submitDecision: (id: string, data: VerificationDecisionDto) =>
    apiFetch<OrganizationResponse>(
      `/partner/validations/${id}/decision`,
      { method: 'POST', body: JSON.stringify(data) },
    ),
};

export const organization = {
  getProfile: () =>
    apiFetch<OrganizationResponse>('/partner/organization'),
  updateProfile: (data: Record<string, unknown>) =>
    apiFetch<OrganizationResponse>('/partner/organization', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export const members = {
  list: (params: Record<string, unknown> = {}) =>
    apiFetch<PaginatedResponse<Record<string, unknown>>>(
      `/partner/members${qs(params)}`,
    ),
  add: (data: { email: string; role: string }) =>
    apiFetch<Record<string, unknown>>('/partner/members', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    apiFetch<void>(`/partner/members/${id}`, { method: 'DELETE' }),
};
