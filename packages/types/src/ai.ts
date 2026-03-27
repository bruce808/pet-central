import {
  AIChannelType,
  AIRunStatus,
  AIRunType,
  DiscoveredEntityType,
  DiscoveryMethod,
  HumanOverrideStatus,
  MatchStatus,
} from './enums';
import { UserPreferencesDto } from './users';
import { ListingResponse } from './listings';

export interface AIChatDto {
  message: string;
  sessionId?: string;
  channelType?: AIChannelType;
  channelOriginId?: string;
}

export interface AIChatResponse {
  reply: string;
  sessionId: string;
  sources?: {
    type: string;
    id: string;
    title: string;
    url?: string;
  }[];
}

export interface AIRecommendationDto {
  preferences: UserPreferencesDto;
  channelOriginId?: string;
}

export interface AIRecommendationResponse {
  recommendations: (ListingResponse & { matchScore: number })[];
  explanation: string;
}

export interface AICorrespondenceDraftDto {
  relatedEntityType: string;
  relatedEntityId: string;
  runType: AIRunType;
  context?: Record<string, unknown>;
}

export interface AICorrespondenceRunResponse {
  id: string;
  runType: AIRunType;
  status: AIRunStatus;
  output: string | null;
  confidenceScore: number | null;
  humanOverrideStatus: HumanOverrideStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface AIDiscoveryScanDto {
  entityType: DiscoveredEntityType;
  region?: string;
  category?: string;
  sourceUrl?: string;
}

export interface DiscoveredEntityResponse {
  id: string;
  entityType: DiscoveredEntityType;
  sourceName: string;
  sourceUrl: string;
  extractedProfile: Record<string, unknown>;
  discoveryMethod: DiscoveryMethod;
  matchStatus: MatchStatus;
  createdAt: string;
}

export interface AIInteractionResponse {
  id: string;
  channelType: AIChannelType;
  promptVersion: string;
  modelName: string;
  inputSummary: string;
  outputSummary: string;
  createdAt: string;
}
