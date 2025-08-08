import { BaseLLMProvider } from './BaseLLMProvider.js';
import { LLMMessage, LLMOptions, LLMResponse, LLMProviderConfig } from '../types.js';
import { importOpenAI } from '../utils/dynamicImport.js';

export class OpenAIProvider extends BaseLLMProvider {
  readonly name = 'openai';
  readonly supportedModels = [
    'gpt-4',
    'gpt-4-turbo',
    'gpt-4o',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k'
  ];

  private openai: any;
  private isSDKAvailable: boolean | null = null;

  constructor(config: LLMProviderConfig) {
    super({
      defaultModel: 'gpt-4',
      ...config
    });
  }

  private async checkSDKAvailability(): Promise<boolean> {
    if (this.isSDKAvailable !== null) {
      return this.isSDKAvailable;
    }

    const openaiModule = await importOpenAI();
    this.isSDKAvailable = openaiModule !== null;
    return this.isSDKAvailable;
  }

  private async initializeClient() {
    const openaiModule = await importOpenAI();
    
    if (!openaiModule) {
      throw new Error(
        'OpenAI SDK not installed. To use OpenAI provider, run: npm install openai'
      );
    }

    try {
      this.openai = new openaiModule.OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseUrl
      });
    } catch (error) {
      throw new Error(`Failed to initialize OpenAI client: ${error}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const isAvailable = await this.checkSDKAvailability();
      if (!isAvailable) {
        return false;
      }

      if (!this.openai) {
        await this.initializeClient();
      }

      // Quick test call
      await this.openai.chat.completions.create({
        model: this.getModel(),
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
        temperature: 0
      });
      return true;
    } catch {
      return false;
    }
  }

  async chat(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    if (!this.openai) {
      await this.initializeClient();
    }

    const model = this.getModel(options);
    const requestOptions = {
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: options.temperature ?? this.config.defaultOptions?.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? this.config.defaultOptions?.maxTokens ?? 1000,
    };

    try {
      const response = await this.openai.chat.completions.create(requestOptions);
      
      return {
        content: response.choices[0]?.message?.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        },
        model: response.model,
        provider: this.name
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async isAvailable(): Promise<boolean> {
    const openaiModule = await importOpenAI();
    return openaiModule !== null;
  }
}