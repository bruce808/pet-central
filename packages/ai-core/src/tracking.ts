import type { AIInteractionLog, AIProviderName } from './types.ts';

export function createInteractionLog(params: {
  promptVersion: string;
  modelName: string;
  providerName: AIProviderName;
  inputSummary: string;
  outputSummary: string;
  tokensUsed: number;
  latencyMs: number;
  success: boolean;
  error?: string;
}): AIInteractionLog {
  return { ...params };
}

export function formatForAudit(
  log: AIInteractionLog,
): Record<string, unknown> {
  return {
    event_type: 'ai_interaction',
    prompt_version: log.promptVersion,
    model_name: log.modelName,
    provider_name: log.providerName,
    input_summary: log.inputSummary,
    output_summary: log.outputSummary,
    tokens_used: log.tokensUsed,
    latency_ms: log.latencyMs,
    success: log.success,
    ...(log.error ? { error: log.error } : {}),
    estimated_cost: calculateCost(
      log.modelName,
      Math.round(log.tokensUsed * 0.7),
      Math.round(log.tokensUsed * 0.3),
    ),
    timestamp: new Date().toISOString(),
  };
}

const COST_PER_1K_TOKENS: Record<
  string,
  { prompt: number; completion: number }
> = {
  'gpt-4o': { prompt: 0.0025, completion: 0.01 },
  'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
  'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'claude-sonnet-4-20250514': { prompt: 0.003, completion: 0.015 },
  'claude-3-5-haiku-20241022': { prompt: 0.001, completion: 0.005 },
  'claude-3-opus-20240229': { prompt: 0.015, completion: 0.075 },
  'text-embedding-3-small': { prompt: 0.00002, completion: 0 },
  'text-embedding-3-large': { prompt: 0.00013, completion: 0 },
};

export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing = COST_PER_1K_TOKENS[model];

  if (!pricing) {
    return 0;
  }

  return (
    (promptTokens / 1000) * pricing.prompt +
    (completionTokens / 1000) * pricing.completion
  );
}
