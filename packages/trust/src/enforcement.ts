import type { RiskAssessment } from './risk';

export type EnforcementAction =
  | 'warn'
  | 'limit_capability'
  | 'hide_content'
  | 'require_verification'
  | 'suspend_listing'
  | 'suspend_vendor'
  | 'suspend_user'
  | 'create_case';

export interface EnforcementDecision {
  action: EnforcementAction;
  reason: string;
  duration?: number;
  requiresHumanReview: boolean;
  autoRevert: boolean;
}

export function determineEnforcement(
  riskAssessment: RiskAssessment,
  accountHistory: {
    previousWarnings: number;
    previousSuspensions: number;
    accountAge: number;
  },
): EnforcementDecision {
  const { overallRisk, signals } = riskAssessment;
  const { previousWarnings, previousSuspensions, accountAge } = accountHistory;

  const isRepeatOffender = previousWarnings >= 2 || previousSuspensions >= 1;
  const isNewAccount = accountAge < 7;

  if (overallRisk === 'critical') {
    if (isRepeatOffender) {
      return {
        action: 'suspend_user',
        reason: `Critical risk detected with prior history (${previousWarnings} warnings, ${previousSuspensions} suspensions)`,
        requiresHumanReview: true,
        autoRevert: false,
      };
    }

    return {
      action: 'suspend_listing',
      reason: `Critical risk: ${signals.map((s) => s.description).join('; ')}`,
      duration: 72,
      requiresHumanReview: true,
      autoRevert: false,
    };
  }

  if (overallRisk === 'high') {
    if (isRepeatOffender) {
      return {
        action: 'suspend_vendor',
        reason: `High risk with repeat offenses`,
        duration: 48,
        requiresHumanReview: true,
        autoRevert: false,
      };
    }

    if (isNewAccount) {
      return {
        action: 'require_verification',
        reason: 'High risk detected on a new account',
        requiresHumanReview: true,
        autoRevert: false,
      };
    }

    return {
      action: 'hide_content',
      reason: `High risk: ${signals.map((s) => s.description).join('; ')}`,
      duration: 24,
      requiresHumanReview: true,
      autoRevert: true,
    };
  }

  if (overallRisk === 'medium') {
    if (isRepeatOffender) {
      return {
        action: 'limit_capability',
        reason: 'Medium risk with prior warnings',
        duration: 24,
        requiresHumanReview: false,
        autoRevert: true,
      };
    }

    if (isNewAccount) {
      return {
        action: 'create_case',
        reason: 'Medium risk on a new account requires monitoring',
        requiresHumanReview: false,
        autoRevert: false,
      };
    }

    return {
      action: 'warn',
      reason: `Medium risk detected: ${signals.map((s) => s.description).join('; ')}`,
      requiresHumanReview: false,
      autoRevert: false,
    };
  }

  return {
    action: 'warn',
    reason: 'Low risk — informational warning only',
    requiresHumanReview: false,
    autoRevert: false,
  };
}
