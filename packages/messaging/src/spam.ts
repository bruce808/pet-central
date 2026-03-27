export interface SpamCheckResult {
  isSpam: boolean;
  score: number;
  reasons: string[];
  requiresReview: boolean;
}

export const SPAM_PATTERNS: readonly RegExp[] = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,       // phone numbers
  /https?:\/\/[^\s]+/i,                         // URLs
  /\b\d+\s*(?:dollars?|\$|USD)\b/i,             // money patterns
  /(?:cash\s*app|venmo|zelle|paypal|wire\s*transfer)/i,
  /(?:send\s+money|pay\s+(?:me|upfront|first))/i,
  /(?:act\s+(?:now|fast)|limited\s+time|urgently?)/i,
  /(?:free\s+(?:puppies?|kittens?|pets?))\b/i,
  /(?:shipping\s+(?:available|worldwide|anywhere))/i,
  /(?:deposit\s+required|reservation\s+fee)/i,
  /(?:whatsapp|telegram|signal)\s*:?\s*\+?\d/i,
] as const;

export function checkForSpam(params: {
  text: string;
  senderAccountAgeDays: number;
  messagesSentLast24h: number;
  containsLinks: boolean;
  containsContactInfo: boolean;
  recipientCount24h: number;
}): SpamCheckResult {
  let score = 0;
  const reasons: string[] = [];

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(params.text)) {
      score += 15;
      reasons.push(`Text matches spam pattern: ${pattern.source}`);
    }
  }

  if (params.senderAccountAgeDays < 3) {
    score += 20;
    reasons.push('Sender account is less than 3 days old');
  } else if (params.senderAccountAgeDays < 7) {
    score += 10;
    reasons.push('Sender account is less than 7 days old');
  }

  if (params.messagesSentLast24h > 30) {
    score += 25;
    reasons.push('High message volume in last 24h');
  } else if (params.messagesSentLast24h > 15) {
    score += 10;
    reasons.push('Elevated message volume in last 24h');
  }

  if (params.containsLinks) {
    score += 10;
    reasons.push('Message contains links');
  }

  if (params.containsContactInfo && params.senderAccountAgeDays < 7) {
    score += 20;
    reasons.push('New account sharing contact info');
  }

  if (params.recipientCount24h > 10) {
    score += 25;
    reasons.push('Messaging many unique recipients in 24h');
  } else if (params.recipientCount24h > 5) {
    score += 10;
    reasons.push('Messaging several unique recipients in 24h');
  }

  score = Math.min(score, 100);

  return {
    isSpam: score >= 60,
    score,
    reasons,
    requiresReview: score >= 40 && score < 60,
  };
}
