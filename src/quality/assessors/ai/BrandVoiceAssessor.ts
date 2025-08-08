import { BaseAssessor } from '../BaseAssessor.js';
import { QualityMetric, ContentToAssess } from '../../types.js';

export class BrandVoiceAssessor extends BaseAssessor {
  readonly name = 'brand-voice';
  readonly category = 'ai' as const;
  readonly defaultWeight = 0.25;

  private apiKey?: string;

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey;
  }

  async assess(content: ContentToAssess, config: any = {}): Promise<QualityMetric> {
    if (!config.brandGuidelines) {
      return this.createMetric(5, 'No brand guidelines provided', ['Add brand guidelines to config']);
    }

    if (!this.apiKey) {
      return this.createMetric(5, 'AI API key not configured', ['Configure AI API key for brand voice assessment']);
    }

    try {
      const score = await this.assessBrandCompliance(content, config);
      return this.createMetric(score, 'Brand voice consistency check');
    } catch (error) {
      return this.createMetric(5, 'Brand voice assessment failed', ['AI service temporarily unavailable']);
    }
  }

  private async assessBrandCompliance(content: ContentToAssess, config: any): Promise<number> {
    // Mock implementation - replace with actual AI API call
    const text = content.text?.toLowerCase() || '';
    const guidelines = config.brandGuidelines.toLowerCase();
    
    // Simple keyword matching for demonstration
    const brandKeywords = guidelines.split(' ').filter((word: string) => word.length > 3);
    const matchingKeywords = brandKeywords.filter((keyword: string) => text.includes(keyword));
    
    const complianceRatio = matchingKeywords.length / Math.max(brandKeywords.length, 1);
    return Math.min(10, complianceRatio * 10 + 5); // Ensure minimum score of 5
  }
}