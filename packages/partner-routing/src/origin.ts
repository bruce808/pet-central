export type ChannelType = 'first_party_web' | 'partner_embed' | 'kiosk_terminal' | 'referral_link';

export interface ChannelOrigin {
  id: string;
  channelType: ChannelType;
  partnerOrgId?: string;
  domain?: string;
  locationName?: string;
  locationAddress?: string;
  attributionRules?: AttributionRules;
}

export interface AttributionRules {
  routeRecommendations: boolean;
  routeProductSuggestions: boolean;
  shareLeadData: boolean;
  attributionWindowDays: number;
  prioritizePartnerListings: boolean;
}

export const DEFAULT_ATTRIBUTION_RULES: AttributionRules = {
  routeRecommendations: true,
  routeProductSuggestions: true,
  shareLeadData: false,
  attributionWindowDays: 30,
  prioritizePartnerListings: false,
};

export function resolveChannelOrigin(params: {
  referrer?: string;
  queryParams?: Record<string, string>;
  kioskId?: string;
  partnerToken?: string;
}): { channelType: ChannelType; partnerOrgId?: string; domain?: string; locationName?: string } | null {
  if (params.kioskId) {
    return { channelType: 'kiosk_terminal', partnerOrgId: params.kioskId };
  }
  if (params.partnerToken) {
    return { channelType: 'partner_embed', partnerOrgId: params.partnerToken };
  }
  if (params.queryParams?.['ref'] || params.queryParams?.['partner']) {
    return {
      channelType: 'referral_link',
      partnerOrgId: params.queryParams['ref'] || params.queryParams['partner'],
      domain: params.referrer,
    };
  }
  if (params.referrer) {
    return { channelType: 'first_party_web', domain: params.referrer };
  }
  return null;
}
