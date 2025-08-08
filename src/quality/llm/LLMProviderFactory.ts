import { BaseLLMProvider } from './providers/BaseLLMProvider.js';
import { LLMProviderConfig } from './types.js';

export type LLMProviderType = 'openai' | 'anthropic' | 'gemini';

export interface LLMProviderConstructor {
  new (config: LLMProviderConfig): BaseLLMProvider;
  isAvailable?: () => Promise<boolean>;
}

export interface MultiLLMConfig {
  primaryProvider: LLMProviderType;
  fallbackProviders?: LLMProviderType[];
  providers: {
    openai?: LLMProviderConfig;
    anthropic?: LLMProviderConfig;
    gemini?: LLMProviderConfig;
  };
}

export class LLMProviderFactory {
  private static providers = new Map<LLMProviderType, LLMProviderConstructor>();
  private static availabilityCache = new Map<LLMProviderType, boolean>();
  private static initialized = false;

  // Remove the static block that causes immediate imports
  private static async initializeProviders(): Promise<void> {
    if (this.initialized) return;
    
    // Try to register providers safely - only if SDKs are available
    await this.registerProviderSafely('openai', () => import('./providers/OpenAIProvider.js').then(m => m.OpenAIProvider));
    await this.registerProviderSafely('anthropic', () => import('./providers/AnthropicProvider.js').then(m => m.AnthropicProvider));
    await this.registerProviderSafely('gemini', () => import('./providers/GeminiProvider.js').then(m => m.GeminiProvider));
    
    this.initialized = true;
  }

  private static async registerProviderSafely(
    name: LLMProviderType, 
    importFn: () => Promise<LLMProviderConstructor>
  ): Promise<void> {
    try {
      const ProviderClass = await importFn();
      this.providers.set(name, ProviderClass);
    } catch (error) {
      console.debug(`Provider ${name} not available (SDK not installed)`);
    }
  }

  static async createProvider(type: LLMProviderType, config: LLMProviderConfig): Promise<BaseLLMProvider> {
    await this.initializeProviders(); // Initialize on first use
    
    const ProviderClass = this.providers.get(type);
    if (!ProviderClass) {
      throw new Error(`Provider ${type} not available. Make sure the corresponding SDK is installed.`);
    }

    // Check if SDK is available before creating instance
    if (ProviderClass.isAvailable) {
      const isAvailable = await ProviderClass.isAvailable();
      if (!isAvailable) {
        throw new Error(`Provider ${type} SDK not installed. Please install the required package.`);
      }
    }

    return new ProviderClass(config);
  }

  static registerProvider(name: LLMProviderType, providerClass: LLMProviderConstructor): void {
    this.providers.set(name, providerClass);
  }

  static async getAvailableProviders(): Promise<LLMProviderType[]> {
    await this.initializeProviders(); // Initialize on first use
    return Array.from(this.providers.keys());
  }

  static async checkProviderAvailability(type: LLMProviderType): Promise<boolean> {
    await this.initializeProviders(); // Initialize on first use
    
    // Check cache first
    if (this.availabilityCache.has(type)) {
      return this.availabilityCache.get(type)!;
    }

    const ProviderClass = this.providers.get(type);
    if (!ProviderClass) {
      this.availabilityCache.set(type, false);
      return false;
    }

    const isAvailable = ProviderClass.isAvailable ? await ProviderClass.isAvailable() : true;
    this.availabilityCache.set(type, isAvailable);
    return isAvailable;
  }

  static async getAvailableProvidersAsync(): Promise<LLMProviderType[]> {
    await this.initializeProviders(); // Initialize on first use
    
    const availableProviders: LLMProviderType[] = [];
    const allProviders = Array.from(this.providers.keys());
    
    for (const provider of allProviders) {
      const isAvailable = await this.checkProviderAvailability(provider);
      if (isAvailable) {
        availableProviders.push(provider);
      }
    }
    
    return availableProviders;
  }
}