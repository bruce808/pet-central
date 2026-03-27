export interface RiskSignal {
  signalType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  description: string;
  timestamp: Date;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  signals: RiskSignal[];
  recommendedAction: string;
  requiresReview: boolean;
}

function createSignal(
  signalType: string,
  severity: RiskSignal['severity'],
  value: number,
  description: string,
): RiskSignal {
  return { signalType, severity, value, description, timestamp: new Date() };
}

function deriveOverallRisk(
  signals: RiskSignal[],
): RiskAssessment['overallRisk'] {
  if (signals.some((s) => s.severity === 'critical')) return 'critical';
  if (signals.filter((s) => s.severity === 'high').length >= 2)
    return 'critical';
  if (signals.some((s) => s.severity === 'high')) return 'high';
  if (signals.some((s) => s.severity === 'medium')) return 'medium';
  return 'low';
}

export function assessAccountRisk(params: {
  accountAgeDays: number;
  messageCount24h: number;
  reviewCount24h: number;
  reportCount: number;
  deviceFingerprints: number;
  ipRiskScore: number;
}): RiskAssessment {
  const signals: RiskSignal[] = [];

  if (params.accountAgeDays < 1) {
    signals.push(
      createSignal('new_account', 'high', params.accountAgeDays, 'Account is less than 1 day old'),
    );
  } else if (params.accountAgeDays < 7) {
    signals.push(
      createSignal('young_account', 'medium', params.accountAgeDays, 'Account is less than 7 days old'),
    );
  }

  if (params.messageCount24h > 50) {
    signals.push(
      createSignal('high_message_volume', 'high', params.messageCount24h, 'Unusually high message volume in 24h'),
    );
  } else if (params.messageCount24h > 20) {
    signals.push(
      createSignal('elevated_message_volume', 'medium', params.messageCount24h, 'Elevated message volume in 24h'),
    );
  }

  if (params.reviewCount24h > 10) {
    signals.push(
      createSignal('review_flooding', 'high', params.reviewCount24h, 'Excessive reviews posted in 24h'),
    );
  }

  if (params.reportCount >= 3) {
    signals.push(
      createSignal('multiple_reports', 'critical', params.reportCount, 'Multiple reports filed against account'),
    );
  } else if (params.reportCount >= 1) {
    signals.push(
      createSignal('reported', 'medium', params.reportCount, 'Account has been reported'),
    );
  }

  if (params.deviceFingerprints > 3) {
    signals.push(
      createSignal('multiple_devices', 'high', params.deviceFingerprints, 'Account accessed from many distinct devices'),
    );
  }

  if (params.ipRiskScore > 0.8) {
    signals.push(
      createSignal('high_ip_risk', 'critical', params.ipRiskScore, 'IP address associated with high risk'),
    );
  } else if (params.ipRiskScore > 0.5) {
    signals.push(
      createSignal('moderate_ip_risk', 'medium', params.ipRiskScore, 'IP address associated with moderate risk'),
    );
  }

  const overallRisk = deriveOverallRisk(signals);

  const recommendedActions: Record<RiskAssessment['overallRisk'], string> = {
    low: 'No action required',
    medium: 'Monitor account activity',
    high: 'Restrict account capabilities pending review',
    critical: 'Suspend account and escalate for review',
  };

  return {
    overallRisk,
    signals,
    recommendedAction: recommendedActions[overallRisk],
    requiresReview: overallRisk === 'high' || overallRisk === 'critical',
  };
}

export function assessContentRisk(params: {
  contentType: string;
  textLength: number;
  containsLinks: boolean;
  containsContactInfo: boolean;
  similarContentCount: number;
  accountRisk: string;
}): RiskAssessment {
  const signals: RiskSignal[] = [];

  if (params.textLength < 10) {
    signals.push(
      createSignal('low_effort_content', 'low', params.textLength, 'Content is very short'),
    );
  }

  if (params.containsLinks) {
    signals.push(
      createSignal('contains_links', 'medium', 1, 'Content contains external links'),
    );
  }

  if (params.containsContactInfo) {
    signals.push(
      createSignal('contains_contact_info', 'medium', 1, 'Content contains personal contact information'),
    );
  }

  if (params.similarContentCount > 5) {
    signals.push(
      createSignal('duplicate_content', 'high', params.similarContentCount, 'Content is similar to many existing posts'),
    );
  } else if (params.similarContentCount > 2) {
    signals.push(
      createSignal('near_duplicate_content', 'medium', params.similarContentCount, 'Content is similar to some existing posts'),
    );
  }

  if (params.accountRisk === 'high' || params.accountRisk === 'critical') {
    signals.push(
      createSignal('risky_account_content', 'high', 1, 'Content posted by a high-risk account'),
    );
  }

  const overallRisk = deriveOverallRisk(signals);

  const recommendedActions: Record<RiskAssessment['overallRisk'], string> = {
    low: 'Auto-approve content',
    medium: 'Queue for moderation review',
    high: 'Hold content and notify moderators',
    critical: 'Block content and escalate immediately',
  };

  return {
    overallRisk,
    signals,
    recommendedAction: recommendedActions[overallRisk],
    requiresReview: overallRisk !== 'low',
  };
}
