import {
  DisputeStatus,
  ModerationStatus,
  ReviewSubjectType,
  VisibilityScope,
} from './enums';

export interface CreateReviewDto {
  subjectType: ReviewSubjectType;
  subjectId: string;
  interactionId: string;
  ratingOverall: number;
  ratingDimensions?: Record<string, number>;
  reviewText: string;
  visibilityScope?: VisibilityScope;
}

export interface UpdateReviewDto {
  ratingOverall?: number;
  ratingDimensions?: Record<string, number>;
  reviewText?: string;
}

export interface ReviewResponseDto {
  responseText: string;
}

export interface FlagReviewDto {
  reasonCode: string;
  notes?: string;
}

export interface ReviewResponse {
  id: string;
  reviewer: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  subjectType: ReviewSubjectType;
  subjectId: string;
  ratingOverall: number;
  ratingDimensions: Record<string, number>;
  reviewText: string;
  visibilityScope: VisibilityScope;
  moderationStatus: ModerationStatus;
  disputeStatus: DisputeStatus;
  responses: ReviewResponseDto[];
  createdAt: string;
  updatedAt: string;
}
