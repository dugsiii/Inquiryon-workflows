import { LLMMessage, LLMOptions, LLMResponse, LLMProviderConfig } from '../types.js';

export abstract class BaseLLMProvider {
    abstract readonly name: string;
    abstract readonly supportedModels: string[];
    protected config: LLMProviderConfig;
  
    constructor(config: LLMProviderConfig) {
      this.config = config;
    }
  
    abstract chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
  
    // Convenience method for single prompt
    async prompt(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
      return this.chat([{ role: 'user', content: prompt }], options);
    }
  
    // Health check
    async isHealthy(): Promise<boolean> {
      try {
        await this.prompt('Hello', { maxTokens: 5, temperature: 0 });
        return true;
      } catch {
        return false;
      }
    }
  
    protected getModel(options?: LLMOptions): string {
      return options?.model || this.config.defaultModel || this.supportedModels[0];
    }
  }