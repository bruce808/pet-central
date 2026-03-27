export type AIProviderName = 'openai' | 'anthropic';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface CompletionResponse {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  finishReason: string;
}

export interface AIProvider {
  name: AIProviderName;
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  completeStream(request: CompletionRequest): AsyncIterable<string>;
}

export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  totalTokens: number;
}

export interface EmbeddingProvider {
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
}

export interface RAGChunk {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  score?: number;
  source: string;
  sourceType: 'resource' | 'listing' | 'organization' | 'policy';
}

export interface RAGContext {
  chunks: RAGChunk[];
  query: string;
}

export interface PromptTemplate {
  id: string;
  version: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  metadata: Record<string, unknown>;
}

export interface AIInteractionLog {
  promptVersion: string;
  modelName: string;
  providerName: AIProviderName;
  inputSummary: string;
  outputSummary: string;
  tokensUsed: number;
  latencyMs: number;
  success: boolean;
  error?: string;
}
