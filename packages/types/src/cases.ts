import {
  CasePriority,
  CaseSeverity,
  CaseStatus,
  CaseType,
  VisibilityScope,
} from './enums';

export interface CreateCaseDto {
  caseType: CaseType;
  sourceType: string;
  sourceId: string;
  priority?: CasePriority;
  severity?: CaseSeverity;
  description: string;
  region?: string;
}

export interface UpdateCaseDto {
  priority?: CasePriority;
  severity?: CaseSeverity;
  status?: CaseStatus;
  assignedTeam?: string;
  assignedUserId?: string;
  assignedPartnerOrgId?: string;
}

export interface AddCaseEventDto {
  eventType: string;
  payloadJson?: Record<string, unknown>;
}

export interface AddCaseNoteDto {
  body: string;
  visibility: VisibilityScope;
}

export interface AssignCaseDto {
  assignedToType: string;
  assignedToId: string;
  dueAt?: string;
  slaPolicyId?: string;
}

export interface CaseResponse {
  id: string;
  caseType: CaseType;
  sourceType: string;
  sourceId: string;
  priority: CasePriority;
  severity: CaseSeverity;
  status: CaseStatus;
  region: string | null;
  assignedTeam: string | null;
  assignedUser: {
    id: string;
    displayName: string;
  } | null;
  assignedPartnerOrg: {
    id: string;
    publicName: string;
  } | null;
  events: {
    id: string;
    eventType: string;
    payloadJson: Record<string, unknown> | null;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}
