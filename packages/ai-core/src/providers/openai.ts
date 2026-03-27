import OpenAI from 'openai';
import type {
  AIProvider,
  CompletionRequest,
  CompletionResponse,
  EmbeddingProvider,
  EmbeddingRequest,
  EmbeddingResponse,
} from '../types.ts';

export class OpenAIProvider implements AIProvider, EmbeddingProvider {
  readonly name = 'openai' as const;
  private client: OpenAI;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel = 'gpt-4o') {
    this.client = new OpenAI({ apiKey });
    this.defaultModel = defaultModel;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const response = await this.client.chat.completions.create({
      model: request.model ?? this.defaultModel,
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });

    const choice = response.choices[0];

    return {
      content: choice?.message.content ?? '',
      model: response.model,
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      finishReason: choice?.finish_reason ?? 'unknown',
    };
  }

  async *completeStream(request: CompletionRequest): AsyncIterable<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const stream = await this.client.chat.completions.create({
      model: request.model ?? this.defaultModel,
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta.content;
      if (delta) {
        yield delta;
      }
    }
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const response = await this.client.embeddings.create({
      model: request.model ?? 'text-embedding-3-small',
      input: request.input,
    });

    return {
      embeddings: response.data.map((d) => d.embedding),
      model: response.model,
      totalTokens: response.usage.total_tokens,
    };
  }
}
