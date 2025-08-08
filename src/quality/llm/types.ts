export interface LLMResponse {
    content: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    model: string;
    provider: string;
  }
  
  export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }
  
  export interface LLMOptions {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    timeout?: number;
  }
  
  export interface LLMProviderConfig {
    apiKey: string;
    baseUrl?: string;
    defaultModel?: string;
    defaultOptions?: LLMOptions;
  }