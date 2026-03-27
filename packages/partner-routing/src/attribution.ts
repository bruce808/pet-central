export interface AttributionChain {
  originId: string;
  channelType: string;
  partnerOrgId?: string;
  sessionId: string;
  userId?: string;
  entryTimestamp: Date;
  touchpoints: Touchpoint[];
}

export interface Touchpoint {
  action: string;
  entityType: string;
  entityId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export function createAttributionChain(origin: {
  id: string;
  channelType: string;
  partnerOrgId?: string;
}, sessionId: string, userId?: string): AttributionChain {
  return {
    originId: origin.id,
    channelType: origin.channelType,
    partnerOrgId: origin.partnerOrgId,
    sessionId,
    userId,
    entryTimestamp: new Date(),
    touchpoints: [],
  };
}

export function addTouchpoint(chain: AttributionChain, touchpoint: Omit<Touchpoint, 'timestamp'>): AttributionChain {
  return {
    ...chain,
    touchpoints: [...chain.touchpoints, { ...touchpoint, timestamp: new Date() }],
  };
}

export function shouldRouteToPartner(chain: AttributionChain, rules?: { routeRecommendations?: boolean; attributionWindowDays?: number }): boolean {
  if (!chain.partnerOrgId) return false;
  const windowMs = (rules?.attributionWindowDays ?? 30) * 24 * 60 * 60 * 1000;
  const withinWindow = Date.now() - chain.entryTimestamp.getTime() < windowMs;
  return withinWindow && (rules?.routeRecommendations ?? true);
}
