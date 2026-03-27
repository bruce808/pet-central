export interface TrustScoreInputs {
  averageRating: number;
  totalReviews: number;
  verifiedInteractionRatio: number;
  recencyWeight: number;
  complaintCount: number;
  complaintPenalty: number;
  verificationMultiplier: number;
  responseRate: number;
  listingCompleteness: number;
  accountAgeDays: number;
}

const WEIGHT = {
  rating: 0.3,
  verification: 0.2,
  response: 0.15,
  completeness: 0.1,
  recency: 0.1,
  age: 0.05,
  complaint: 0.1,
} as const;

export function calculateTrustScore(inputs: TrustScoreInputs): number {
  const normalizedRating = (inputs.averageRating / 5) * 100;
  const verificationScore =
    inputs.verifiedInteractionRatio * inputs.verificationMultiplier * 100;
  const responseScore = inputs.responseRate * 100;
  const completenessScore = inputs.listingCompleteness * 100;
  const recencyScore = inputs.recencyWeight * 100;
  const ageScore = Math.min(inputs.accountAgeDays / 365, 1) * 100;

  const reviewConfidence = Math.min(inputs.totalReviews / 10, 1);
  const complaintDeduction =
    inputs.complaintCount * inputs.complaintPenalty * 100;

  const raw =
    normalizedRating * WEIGHT.rating * reviewConfidence +
    verificationScore * WEIGHT.verification +
    responseScore * WEIGHT.response +
    completenessScore * WEIGHT.completeness +
    recencyScore * WEIGHT.recency +
    ageScore * WEIGHT.age -
    complaintDeduction * WEIGHT.complaint;

  return Math.max(0, Math.min(100, Math.round(raw * 100) / 100));
}

export function getTrustTier(
  score: number,
): 'excellent' | 'good' | 'fair' | 'low' | 'unrated' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'low';
  return 'unrated';
}
