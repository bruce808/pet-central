const SESSION_KEY = 'kiosk_session';
const ACTIVITY_KEY = 'kiosk_last_activity';
const DEFAULT_TIMEOUT_MS = 3 * 60 * 1000;

export interface KioskSessionState {
  sessionId: string;
  viewedListingIds: string[];
  searchQuery: string;
  channelOriginId: string;
  aiConversationId?: string;
  startedAt: number;
}

function generateSessionId(): string {
  return `kiosk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function initSession(channelOriginId: string): KioskSessionState {
  const state: KioskSessionState = {
    sessionId: generateSessionId(),
    viewedListingIds: [],
    searchQuery: '',
    channelOriginId,
    startedAt: Date.now(),
  };

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    sessionStorage.setItem(ACTIVITY_KEY, String(Date.now()));
  }

  return state;
}

export function resetSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(ACTIVITY_KEY);
  }
}

export function trackActivity(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(ACTIVITY_KEY, String(Date.now()));
  }
}

export function getSessionState(): KioskSessionState | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as KioskSessionState;
  } catch {
    return null;
  }
}

export function isExpired(timeoutMs: number = DEFAULT_TIMEOUT_MS): boolean {
  if (typeof window === 'undefined') return false;
  const lastActivity = sessionStorage.getItem(ACTIVITY_KEY);
  if (!lastActivity) return true;
  return Date.now() - Number(lastActivity) > timeoutMs;
}

export function updateSession(
  updates: Partial<Pick<KioskSessionState, 'viewedListingIds' | 'searchQuery' | 'aiConversationId'>>,
): KioskSessionState | null {
  const state = getSessionState();
  if (!state) return null;

  const updated = { ...state, ...updates };
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function trackViewedListing(listingId: string): void {
  const state = getSessionState();
  if (!state) return;
  if (!state.viewedListingIds.includes(listingId)) {
    state.viewedListingIds.push(listingId);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    }
  }
  trackActivity();
}
