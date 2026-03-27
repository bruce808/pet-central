import { Injectable } from '@nestjs/common';
import { checkForSpam } from '@pet-central/messaging';
import { assessContentRisk } from '@pet-central/trust';

interface QuickCheckResult {
  pass: boolean;
  flags: string[];
  riskLevel: string;
}

const MIN_CONTENT_LENGTH = 2;
const MAX_CONTENT_LENGTH = 50_000;

const SUSPICIOUS_PATTERNS = [
  /\b(buy now|act fast|limited time|click here|free money)\b/i,
  /(.)\1{10,}/,
  /(https?:\/\/[^\s]+){5,}/,
];

@Injectable()
export class ModerationService {
  async quickCheck(
    content: string,
    contentType: string,
  ): Promise<QuickCheckResult> {
    const flags: string[] = [];

    if (content.length < MIN_CONTENT_LENGTH) {
      flags.push('content_too_short');
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      flags.push('content_too_long');
    }

    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(content)) {
        flags.push('suspicious_pattern');
        break;
      }
    }

    const spamResult = checkForSpam({
      text: content,
      senderAccountAgeDays: 30,
      messagesSentLast24h: 0,
      containsLinks: /https?:\/\//.test(content),
      containsContactInfo: false,
      recipientCount24h: 0,
    });
    if (spamResult.isSpam) {
      flags.push('spam_detected');
    }

    const riskAssessment = assessContentRisk({
      contentType,
      textLength: content.length,
      containsLinks: /https?:\/\//.test(content),
      containsContactInfo: false,
      similarContentCount: 0,
      accountRisk: 'low',
    });
    if (riskAssessment.overallRisk !== 'low') {
      flags.push(`risk_${riskAssessment.overallRisk}`);
    }

    return {
      pass: flags.length === 0,
      flags,
      riskLevel: riskAssessment.overallRisk,
    };
  }
}
