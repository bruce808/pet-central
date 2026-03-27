import { ChannelType, OrgType, ReferralType } from './enums';

export interface ResolveOriginDto {
  channelType: ChannelType;
  originPartnerOrgId?: string;
  originDomain?: string;
  originLocationName?: string;
  originLocationAddress?: string;
}

export interface ChannelOriginResponse {
  id: string;
  channelType: ChannelType;
  partnerOrganization: {
    id: string;
    publicName: string;
    organizationType: OrgType;
  } | null;
  originDomain: string | null;
  originLocationName: string | null;
  attributionRules: Record<string, unknown>;
  status: string;
}

export interface CreateReferralDto {
  channelOriginId: string;
  referralType: ReferralType;
  referredPartnerOrgId: string;
  relatedListingId?: string;
  userId?: string;
  organizationId?: string;
}

export interface ReferralResponse {
  id: string;
  channelOrigin: {
    id: string;
    channelType: ChannelType;
  };
  referralType: ReferralType;
  referredPartnerOrg: {
    id: string;
    publicName: string;
  };
  relatedListing: {
    id: string;
    title: string;
  } | null;
  createdAt: string;
}
