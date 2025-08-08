import { BaseLLMProvider } from './providers/BaseLLMProvider.js';
import { LLMProviderFactory, MultiLLMConfig, LLMProviderType } from './LLMProviderFactory.js';
import { LLMMessage, LLMOptions, LLMResponse } from './types.js';

export class LLMManager {
  private providers = new Map<LLMProviderType, BaseLLMProvider>();
  private primaryProvider: LLMProviderType;
  private fallbackProviders: LLMProviderType[];

  constructor(config: MultiLLMConfig) {
    this.primaryProvider = config.primaryProvider;
    this.fallbackProviders = config.fallbackProviders || [];
  }

  async initialize(config: MultiLLMConfig): Promise<void> {
    // Get actually available providers
    const availableProviderTypes = await LLMProviderFactory.getAvailableProvidersAsync();
    
    // Initialize only available providers
    for (const [providerType, providerConfig] of Object.entries(config.providers)) {
      if (providerConfig && availableProviderTypes.includes(providerType as LLMProviderType)) {
        try {
          const provider = await LLMProviderFactory.createProvider(
            providerType as LLMProviderType, 
            providerConfig
          );
          this.providers.set(providerType as LLMProviderType, provider);
          console.log(`✅ Initialized ${providerType} provider`);
        } catch (error) {
          console.warn(`⚠️ Failed to initialize ${providerType} provider:`, error);
        }
      } else if (providerConfig && !availableProviderTypes.includes(providerType as LLMProviderType)) {
        console.info(`📦 ${providerType} provider skipped (SDK not installed)`);
      }
    }

    // Validate that at least one provider is available
    if (this.providers.size === 0) {
      throw new Error(
        'No LLM providers available. Please install at least one SDK:\n' +
        '  - OpenAI: npm install openai\n' +
        '  - Anthropic: npm install @anthropic-ai/sdk\n' +
        '  - Gemini: npm install @google/generative-ai'
      );
    }

    // Check if primary provider is available, fallback if not
    if (!this.providers.has(this.primaryProvider)) {
      const availableProviders = this.getAvailableProviders();
      console.warn(`Primary provider ${this.primaryProvider} not available. Using ${availableProviders[0]} instead.`);
      this.primaryProvider = availableProviders[0];
    }
  }

  // Static factory method for easier usage
  static async create(config: MultiLLMConfig): Promise<LLMManager> {
    const manager = new LLMManager(config);
    await manager.initialize(config);
    return manager;
  }

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const providersToTry = [
      this.primaryProvider, 
      ...this.fallbackProviders.filter(p => this.providers.has(p))
    ];
    
    for (const providerType of providersToTry) {
      const provider = this.providers.get(providerType);
      if (!provider) continue;

      try {
        console.log(`🤖 Attempting LLM call with ${providerType}...`);
        const response = await provider.chat(messages, options);
        console.log(`✅ LLM call successful with ${providerType}`);
        return response;
      } catch (error) {
        console.warn(`❌ LLM call failed with ${providerType}:`, error);
        
        // If this is the last provider, throw the error
        if (providerType === providersToTry[providersToTry.length - 1]) {
          throw new Error(`All available LLM providers failed. Last error: ${error}`);
        }
        
        // Otherwise, continue to next provider
        continue;
      }
    }

    throw new Error('No LLM providers available');
  }

  async prompt(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async checkHealth(): Promise<Record<LLMProviderType, boolean>> {
    const health: Partial<Record<LLMProviderType, boolean>> = {};
    
    for (const [providerType, provider] of Array.from(this.providers.entries())) {
      health[providerType] = await provider.isHealthy();
    }
    
    return health as Record<LLMProviderType, boolean>;
  }

  getAvailableProviders(): LLMProviderType[] {
    return Array.from(this.providers.keys());
  }

  switchPrimaryProvider(provider: LLMProviderType): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} is not available`);
    }
    this.primaryProvider = provider;
  }
}