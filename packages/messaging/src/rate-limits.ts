export interface RateLimitConfig {
  maxMessagesPerMinute: number;
  maxMessagesPerHour: number;
  maxConversationsPerDay: number;
  maxAttachmentsPerMessage: number;
  newAccountCooldownMinutes: number;
  burstThreshold: number;
}

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  maxMessagesPerMinute: 5,
  maxMessagesPerHour: 30,
  maxConversationsPerDay: 15,
  maxAttachmentsPerMessage: 5,
  newAccountCooldownMinutes: 60,
  burstThreshold: 3,
};

export const TRUSTED_USER_RATE_LIMITS: RateLimitConfig = {
  maxMessagesPerMinute: 15,
  maxMessagesPerHour: 100,
  maxConversationsPerDay: 50,
  maxAttachmentsPerMessage: 10,
  newAccountCooldownMinutes: 0,
  burstThreshold: 8,
};

export function checkRateLimit(
  params: {
    messagesLastMinute: number;
    messagesLastHour: number;
    conversationsToday: number;
    accountAgeDays: number;
    trustLevel: string;
  },
  config?: RateLimitConfig,
): { allowed: boolean; reason?: string; retryAfterMs?: number } {
  const limits =
    config ??
    (params.trustLevel === 'trusted' ? TRUSTED_USER_RATE_LIMITS : DEFAULT_RATE_LIMITS);

  if (
    params.accountAgeDays < 1 &&
    limits.newAccountCooldownMinutes > 0
  ) {
    return {
      allowed: false,
      reason: `New accounts must wait ${limits.newAccountCooldownMinutes} minutes before messaging`,
      retryAfterMs: limits.newAccountCooldownMinutes * 60 * 1000,
    };
  }

  if (params.messagesLastMinute >= limits.maxMessagesPerMinute) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${limits.maxMessagesPerMinute} messages per minute`,
      retryAfterMs: 60_000,
    };
  }

  if (params.messagesLastMinute >= limits.burstThreshold) {
    return {
      allowed: false,
      reason: `Burst limit reached: slow down before sending more messages`,
      retryAfterMs: 15_000,
    };
  }

  if (params.messagesLastHour >= limits.maxMessagesPerHour) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${limits.maxMessagesPerHour} messages per hour`,
      retryAfterMs: 3_600_000,
    };
  }

  if (params.conversationsToday >= limits.maxConversationsPerDay) {
    return {
      allowed: false,
      reason: `Daily conversation limit reached: ${limits.maxConversationsPerDay} conversations per day`,
      retryAfterMs: 86_400_000,
    };
  }

  return { allowed: true };
}
