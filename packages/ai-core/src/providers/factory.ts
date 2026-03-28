import type { AIProvider, AIProviderName } from '../types.ts';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';

export function createAIProvider(
  name: AIProviderName,
  apiKey: string,
  model?: string,
): AIProvider {
  switch (name) {
    case 'openai':
      return new OpenAIProvider(apiKey, model);
    case 'anthropic':
      return new AnthropicProvider(apiKey, model);
    default:
      throw new Error(`Unknown AI provider: ${name satisfies never}`);
  }
}

export function getDefaultProvider(): AIProvider {
  const providerName = (process.env['AI_DEFAULT_PROVIDER'] ??
    'openai') as AIProviderName;
  return getProvider(providerName);
}

export function getProvider(name: AIProviderName): AIProvider {
  const envKeyMap: Record<AIProviderName, string> = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
  };

  const envKey = envKeyMap[name];
  const apiKey = process.env[envKey];

  if (!apiKey) {
    throw new Error(
      `Missing API key: set the ${envKey} environment variable`,
    );
  }

  return createAIProvider(name, apiKey);
}
