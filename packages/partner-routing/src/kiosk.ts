export interface KioskConfig {
  kioskId: string;
  partnerOrgId: string;
  locationName: string;
  locationAddress: string;
  inactivityTimeoutMs: number;
  enableAIGuide: boolean;
  enableHandoff: boolean;
  allowedPetTypes?: string[];
  brandingOverrides?: {
    logoUrl?: string;
    primaryColor?: string;
    welcomeMessage?: string;
  };
}

export const DEFAULT_KIOSK_CONFIG: Omit<KioskConfig, 'kioskId' | 'partnerOrgId' | 'locationName' | 'locationAddress'> = {
  inactivityTimeoutMs: 3 * 60 * 1000,
  enableAIGuide: true,
  enableHandoff: true,
};

export interface HandoffRequest {
  kioskSessionId: string;
  method: 'qr' | 'email' | 'sms';
  destination?: string;
  savedState: {
    searchQuery?: string;
    viewedListingIds: string[];
    aiConversationId?: string;
    channelOriginId: string;
  };
}

export interface HandoffResponse {
  handoffUrl: string;
  expiresAt: Date;
  method: string;
}

export function generateHandoffUrl(baseUrl: string, handoffToken: string): string {
  return `${baseUrl}/handoff?token=${encodeURIComponent(handoffToken)}`;
}

export function isSessionExpired(lastActivityAt: Date, timeoutMs: number): boolean {
  return Date.now() - lastActivityAt.getTime() > timeoutMs;
}
