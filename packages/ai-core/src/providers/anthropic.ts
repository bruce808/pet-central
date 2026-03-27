import Anthropic from '@anthropic-ai/sdk';
import type {
  AIProvider,
  CompletionRequest,
  CompletionResponse,
} from '../types.ts';

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic' as const;
  private client: Anthropic;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel = 'claude-sonnet-4-20250514') {
    this.client = new Anthropic({ apiKey });
    this.defaultModel = defaultModel;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const messages: Anthropic.MessageParam[] = request.messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    const systemPrompt =
      request.systemPrompt ??
      request.messages.find((m) => m.role === 'system')?.content;

    const response = await this.client.messages.create({
      model: request.model ?? this.defaultModel,
      max_tokens: request.maxTokens ?? 4096,
      messages,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      ...(request.temperature != null
        ? { temperature: request.temperature }
        : {}),
    });

    const textBlock = response.content.find((block) => block.type === 'text');

    return {
      content: textBlock?.text ?? '',
      model: response.model,
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      finishReason: response.stop_reason ?? 'unknown',
    };
  }

  async *completeStream(request: CompletionRequest): AsyncIterable<string> {
    const messages: Anthropic.MessageParam[] = request.messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    const systemPrompt =
      request.systemPrompt ??
      request.messages.find((m) => m.role === 'system')?.content;

    const stream = this.client.messages.stream({
      model: request.model ?? this.defaultModel,
      max_tokens: request.maxTokens ?? 4096,
      messages,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      ...(request.temperature != null
        ? { temperature: request.temperature }
        : {}),
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }
}
