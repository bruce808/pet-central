export interface SafetyWarning {
  warningType: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestedAction: string;
}

interface SafetyPattern {
  pattern: RegExp;
  warningType: string;
  severity: SafetyWarning['severity'];
  message: string;
  suggestedAction: string;
}

export const SAFETY_PATTERNS: SafetyPattern[] = [
  {
    pattern: /(?:pay|send|deposit|transfer)\s+(?:upfront|first|before|in advance)/i,
    warningType: 'advance_payment',
    severity: 'critical',
    message: 'This message may be requesting advance payment, a common scam tactic.',
    suggestedAction: 'Never send money before meeting the pet in person. Report if suspicious.',
  },
  {
    pattern: /(?:wire\s*transfer|western\s*union|money\s*gram|gift\s*card)/i,
    warningType: 'suspicious_payment_method',
    severity: 'critical',
    message: 'This message references untraceable payment methods often used in scams.',
    suggestedAction: 'Only use secure payment methods. Never pay via wire transfer or gift cards.',
  },
  {
    pattern: /(?:ssn|social\s*security|bank\s*account|routing\s*number|credit\s*card\s*number)/i,
    warningType: 'personal_info_request',
    severity: 'critical',
    message: 'This message appears to request sensitive personal or financial information.',
    suggestedAction: 'Never share financial details or personal identifiers through messages.',
  },
  {
    pattern: /\b(?:my\s+(?:phone|cell|number)\s+is|call\s+me\s+at|text\s+me\s+at)\s*:?\s*[\d(+]/i,
    warningType: 'phone_sharing',
    severity: 'info',
    message: 'A phone number is being shared. Be cautious sharing personal contact info.',
    suggestedAction: 'Use the platform messaging system until you are confident about the other party.',
  },
  {
    pattern: /(?:meet\s+(?:me|at|in)\s+(?:my|the)\s+(?:home|house|apartment|place))/i,
    warningType: 'private_meeting_location',
    severity: 'warning',
    message: 'A private meeting location was suggested. Meet in public for safety.',
    suggestedAction: 'Always meet in a well-lit public place. Bring someone with you if possible.',
  },
  {
    pattern: /(?:come\s+alone|don't\s+bring\s+anyone|just\s+you)/i,
    warningType: 'isolation_request',
    severity: 'critical',
    message: 'This message suggests meeting alone, which could be unsafe.',
    suggestedAction: 'Always bring a friend or family member. Never meet alone for the first time.',
  },
  {
    pattern: /(?:ship(?:ping)?\s+(?:the|your|a)\s+(?:pet|animal|puppy|kitten|dog|cat))/i,
    warningType: 'pet_shipping',
    severity: 'warning',
    message: 'Pet shipping is mentioned. Many scams involve promises to ship pets.',
    suggestedAction: 'Be very cautious of offers to ship pets. Always try to meet pets in person first.',
  },
  {
    pattern: /(?:too\s+good\s+to\s+be\s+true|act\s+(?:now|fast|quickly)|limited\s+time|only\s+one\s+left)/i,
    warningType: 'urgency_pressure',
    severity: 'warning',
    message: 'This message uses urgency or pressure tactics.',
    suggestedAction: 'Take your time making decisions. Legitimate sellers will not pressure you.',
  },
  {
    pattern: /https?:\/\/(?!(?:www\.)?pet-central\.)[^\s]+/i,
    warningType: 'external_link',
    severity: 'info',
    message: 'This message contains an external link. Be careful clicking unknown links.',
    suggestedAction: 'Avoid clicking unfamiliar links. They may lead to phishing sites.',
  },
];

export function checkMessageSafety(text: string): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];

  for (const { pattern, warningType, severity, message, suggestedAction } of SAFETY_PATTERNS) {
    if (pattern.test(text)) {
      warnings.push({ warningType, severity, message, suggestedAction });
    }
  }

  return warnings;
}
