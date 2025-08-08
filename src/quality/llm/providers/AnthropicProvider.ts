import { BaseLLMProvider } from './BaseLLMProvider.js';
import { LLMMessage, LLMOptions, LLMResponse, LLMProviderConfig } from '../types.js';
import { importAnthropic } from '../utils/dynamicImport.js';


export class AnthropicProvider extends BaseLLMProvider {
  readonly name = 'anthropic';
  readonly supportedModels = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ];

  private anthropic: any;
  private isSDKAvailable: boolean | null = null;

  constructor(config: LLMProviderConfig) {
    super({
      defaultModel: 'claude-3-5-sonnet-20241022',
      ...config
    });
  }

  private async checkSDKAvailability(): Promise<boolean> {
    if (this.isSDKAvailable !== null) {
      return this.isSDKAvailable;
    }

    const anthropicModule = await importAnthropic();
    this.isSDKAvailable = anthropicModule !== null;
    return this.isSDKAvailable;
  }

  private async initializeClient() {
    const anthropicModule = await importAnthropic();
    
    if (!anthropicModule) {
      throw new Error(
        'Anthropic SDK not installed. To use Anthropic provider, run: npm install @anthropic-ai/sdk'
      );
    }

    try {
      this.anthropic = new anthropicModule.Anthropic({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseUrl
      });
    } catch (error) {
      throw new Error(`Failed to initialize Anthropic client: ${error}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const isAvailable = await this.checkSDKAvailability();
      if (!isAvailable) {
        return false;
      }

      if (!this.anthropic) {
        await this.initializeClient();
      }

      // Quick test call
      await this.anthropic.messages.create({
        model: this.getModel(),
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      });
      return true;
    } catch {
      return false;
    }
  }

  async chat(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    if (!this.anthropic) {
      await this.initializeClient();
    }

    const model = this.getModel(options);
    
    // Convert messages to Anthropic format
    let systemMessage = '';
    const anthropicMessages = messages
      .filter(msg => {
        if (msg.role === 'system') {
          systemMessage = msg.content;
          return false;
        }
        return true;
      })
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

    const requestOptions = {
      model,
      messages: anthropicMessages,
      system: systemMessage || undefined,
      temperature: options.temperature ?? this.config.defaultOptions?.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? this.config.defaultOptions?.maxTokens ?? 1000,
    };

    try {
      const response = await this.anthropic.messages.create(requestOptions);
      
      return {
        content: response.content[0]?.text || '',
        usage: {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
        },
        model: response.model,
        provider: this.name
      };
    } catch (error) {
      throw new Error(`Anthropic API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async isAvailable(): Promise<boolean> {
    const anthropicModule = await importAnthropic();
    return anthropicModule !== null;
  }
}