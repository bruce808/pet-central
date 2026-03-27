export interface BadgeEligibility {
  badgeCode: string;
  eligible: boolean;
  reason: string;
  currentProgress?: number;
  threshold?: number;
}

interface BadgeRequirement {
  label: string;
  check: (metrics: OrgMetrics) => BadgeEligibility;
}

interface OrgMetrics {
  verificationStatus: string;
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  accountAgeDays: number;
  complaintCount: number;
}

export const BADGE_REQUIREMENTS: Record<string, BadgeRequirement> = {
  verified: {
    label: 'Verified Organization',
    check: (m) => ({
      badgeCode: 'verified',
      eligible: m.verificationStatus === 'verified',
      reason:
        m.verificationStatus === 'verified'
          ? 'Organization is verified'
          : 'Organization must complete verification',
    }),
  },
  top_rated: {
    label: 'Top Rated',
    check: (m) => ({
      badgeCode: 'top_rated',
      eligible: m.averageRating >= 4.5 && m.totalReviews >= 20,
      reason:
        m.averageRating >= 4.5 && m.totalReviews >= 20
          ? 'Meets top-rated criteria'
          : `Requires 4.5+ rating with 20+ reviews (current: ${m.averageRating} with ${m.totalReviews} reviews)`,
      currentProgress: m.averageRating,
      threshold: 4.5,
    }),
  },
  responsive: {
    label: 'Highly Responsive',
    check: (m) => ({
      badgeCode: 'responsive',
      eligible: m.responseRate >= 0.9,
      reason:
        m.responseRate >= 0.9
          ? 'Maintains 90%+ response rate'
          : `Requires 90%+ response rate (current: ${Math.round(m.responseRate * 100)}%)`,
      currentProgress: m.responseRate,
      threshold: 0.9,
    }),
  },
  established: {
    label: 'Established',
    check: (m) => ({
      badgeCode: 'established',
      eligible: m.accountAgeDays >= 365,
      reason:
        m.accountAgeDays >= 365
          ? 'Account is over 1 year old'
          : `Requires 365+ days (current: ${m.accountAgeDays} days)`,
      currentProgress: m.accountAgeDays,
      threshold: 365,
    }),
  },
  trusted: {
    label: 'Trusted Partner',
    check: (m) => ({
      badgeCode: 'trusted',
      eligible:
        m.verificationStatus === 'verified' &&
        m.averageRating >= 4.0 &&
        m.totalReviews >= 10 &&
        m.responseRate >= 0.8 &&
        m.accountAgeDays >= 180 &&
        m.complaintCount === 0,
      reason:
        m.verificationStatus === 'verified' &&
        m.averageRating >= 4.0 &&
        m.totalReviews >= 10 &&
        m.responseRate >= 0.8 &&
        m.accountAgeDays >= 180 &&
        m.complaintCount === 0
          ? 'Meets all trusted partner criteria'
          : 'Requires: verified, 4.0+ rating, 10+ reviews, 80%+ response rate, 180+ days, 0 complaints',
    }),
  },
  complaint_free: {
    label: 'Complaint Free',
    check: (m) => ({
      badgeCode: 'complaint_free',
      eligible: m.complaintCount === 0 && m.totalReviews >= 5,
      reason:
        m.complaintCount === 0 && m.totalReviews >= 5
          ? 'Zero complaints with sufficient review history'
          : `Requires 0 complaints and 5+ reviews (complaints: ${m.complaintCount}, reviews: ${m.totalReviews})`,
      currentProgress: m.complaintCount,
      threshold: 0,
    }),
  },
};

export function checkBadgeEligibility(
  badgeCode: string,
  orgMetrics: OrgMetrics,
): BadgeEligibility {
  const requirement = BADGE_REQUIREMENTS[badgeCode];

  if (!requirement) {
    return {
      badgeCode,
      eligible: false,
      reason: `Unknown badge code: ${badgeCode}`,
    };
  }

  return requirement.check(orgMetrics);
}
