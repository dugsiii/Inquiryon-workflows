import { BaseAssessor } from '../BaseAssessor.js';
import { QualityMetric, ContentToAssess } from '../../types.js';
import { LLMManager } from '../../llm/LLMManager.js';

export class BrandVoiceAssessor extends BaseAssessor {
  readonly name = 'brand-voice';
  readonly category = 'ai' as const;
  readonly defaultWeight = 0.25;

  private llmManager?: LLMManager;

  constructor(llmManager?: LLMManager) {
    super();
    this.llmManager = llmManager;
  }

  async assess(content: ContentToAssess, config: any = {}): Promise<QualityMetric> {
    if (!config.brandGuidelines) {
      return this.createMetric(5, 'No brand guidelines provided', ['Add brand guidelines to assessment config']);
    }

    if (!this.llmManager) {
      return this.createMetric(5, 'LLM Manager not configured', ['Configure LLM providers for AI assessment']);
    }

    try {
      const score = await this.assessBrandCompliance(content, config);
      return this.createMetric(score, 'AI brand voice consistency check');
    } catch (error) {
      return this.createMetric(5, 'Brand voice assessment failed', ['LLM service temporarily unavailable']);
    }
  }

  private async assessBrandCompliance(content: ContentToAssess, config: any): Promise<number> {
    const prompt = `
    Rate how well this content matches the brand voice and guidelines (1-10).
    
    Brand Guidelines:
    ${config.brandGuidelines}
    
    Content to evaluate:
    Subject: ${content.subject_line || 'No subject line'}
    Body: ${content.text || 'No content'}
    Content Type: ${content.type}
    
    Consider:
    - Tone consistency with brand guidelines
    - Terminology and language choices
    - Messaging alignment with brand values
    - Overall brand personality representation
    - Appropriate formality level
    - Brand-specific vocabulary usage
    
    Rate the brand voice compliance on a scale of 1-10.
    1 = Completely off-brand
    5 = Neutral/generic
    10 = Perfect brand alignment
    
    Format: "Score: X\nAnalysis: [brief explanation of why this score]"
    `;

    const response = await this.llmManager!.prompt(prompt, {
      temperature: 0.1,
      maxTokens: 300
    });

    const scoreMatch = response.content.match(/Score:\s*(\d+(?:\.\d+)?)/);
    return scoreMatch ? Math.min(10, Math.max(1, parseFloat(scoreMatch[1]))) : 5;
  }
}