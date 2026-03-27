import {
  BadgeVisibility,
  MembershipRole,
  OrgStatus,
  OrgType,
  VerificationStatus,
  VerificationType,
} from './enums';

export interface CreateOrganizationDto {
  legalName: string;
  publicName: string;
  organizationType: OrgType;
  description: string;
  websiteUrl?: string;
  phone?: string;
  email: string;
  addressLine1: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  serviceRadiusKm?: number;
}

export type UpdateOrganizationDto = Partial<CreateOrganizationDto>;

export interface AddMemberDto {
  userId: string;
  membershipRole: MembershipRole;
}

export interface UploadDocumentDto {
  documentType: VerificationType;
  storageKey: string;
}

export interface OrganizationResponse {
  id: string;
  legalName: string;
  publicName: string;
  organizationType: OrgType;
  description: string;
  websiteUrl: string | null;
  phone: string | null;
  email: string;
  city: string;
  region: string;
  country: string;
  status: OrgStatus;
  verificationStatus: VerificationStatus;
  badges: BadgeResponse[];
  reviewScore: number | null;
  responseRate: number | null;
  memberSince: string;
}

export interface BadgeResponse {
  code: string;
  label: string;
  description: string;
  visibility: BadgeVisibility;
  assignedAt: string;
  expiresAt?: string;
}

export interface VerificationDecisionDto {
  verificationId: string;
  status: VerificationStatus;
  notesInternal?: string;
}
