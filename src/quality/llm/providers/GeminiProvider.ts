import { BaseLLMProvider } from './BaseLLMProvider.js';
import { LLMMessage, LLMOptions, LLMResponse, LLMProviderConfig } from '../types.js';
import { importGemini } from '../utils/dynamicImport.js';


export class GeminiProvider extends BaseLLMProvider {
  readonly name = 'gemini';
  readonly supportedModels = [
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.0-pro'
  ];

  private genAI: any;
  private isSDKAvailable: boolean | null = null;

  constructor(config: LLMProviderConfig) {
    super({
      defaultModel: 'gemini-1.5-pro',
      baseUrl: config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta',
      ...config
    });
  }

  private async checkSDKAvailability(): Promise<boolean> {
    if (this.isSDKAvailable !== null) {
      return this.isSDKAvailable;
    }

    const geminiModule = await importGemini();
    this.isSDKAvailable = geminiModule !== null;
    return this.isSDKAvailable;
  }

  private async initializeClient() {
    const geminiModule = await importGemini();
    
    if (!geminiModule) {
      throw new Error(
        'Google Generative AI SDK not installed. To use Gemini provider, run: npm install @google/generative-ai'
      );
    }

    try {
      this.genAI = new geminiModule.GoogleGenerativeAI(this.config.apiKey);
    } catch (error) {
      throw new Error(`Failed to initialize Gemini client: ${error}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const isAvailable = await this.checkSDKAvailability();
      if (!isAvailable) {
        return false;
      }

      if (!this.genAI) {
        await this.initializeClient();
      }

      const model = this.genAI.getGenerativeModel({ model: this.getModel() });
      await model.generateContent('Hello');
      return true;
    } catch {
      return false;
    }
  }

  async chat(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    if (!this.genAI) {
      await this.initializeClient();
    }

    const model = this.getModel(options);
    const geminiModel = this.genAI.getGenerativeModel({ model });

    // Convert messages to Gemini format
    const history = [];
    let lastMessage = '';
    
    for (const message of messages) {
      if (message.role === 'system') {
        // Gemini doesn't have system role, prepend to first user message
        continue;
      } else if (message.role === 'user') {
        lastMessage = message.content;
      } else if (message.role === 'assistant') {
        if (lastMessage) {
          history.push({
            role: 'user',
            parts: [{ text: lastMessage }]
          });
          lastMessage = '';
        }
        history.push({
          role: 'model',
          parts: [{ text: message.content }]
        });
      }
    }

    const chat = geminiModel.startChat({
      history,
      generationConfig: {
        temperature: options.temperature ?? this.config.defaultOptions?.temperature ?? 0.1,
        maxOutputTokens: options.maxTokens ?? this.config.defaultOptions?.maxTokens ?? 1000,
      },
    });

    try {
      const result = await chat.sendMessage(lastMessage || messages[messages.length - 1].content);
      const response = await result.response;
      
      return {
        content: response.text() || '',
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        },
        model,
        provider: this.name
      };
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async isAvailable(): Promise<boolean> {
    const geminiModule = await importGemini();
    return geminiModule !== null;
  }
}