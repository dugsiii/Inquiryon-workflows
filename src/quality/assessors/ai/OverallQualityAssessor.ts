import { BaseAssessor } from '../BaseAssessor.js';
import { QualityMetric, ContentToAssess } from '../../types.js';

export class OverallQualityAssessor extends BaseAssessor {
  readonly name = 'overall-quality';
  readonly category = 'ai' as const;
  readonly defaultWeight = 0.4;

  private apiKey?: string;

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey;
  }

  async assess(content: ContentToAssess, config: any = {}): Promise<QualityMetric> {
    if (!this.apiKey) {
      return this.createMetric(5, 'AI API key not configured', ['Configure AI API key for overall quality assessment']);
    }

    try {
      const score = await this.assessOverallQuality(content, config);
      return this.createMetric(score, 'AI-powered overall quality assessment');
    } catch (error) {
      return this.createMetric(5, 'Overall quality assessment failed', ['AI service temporarily unavailable']);
    }
  }

  private async assessOverallQuality(content: ContentToAssess, config: any): Promise<number> {
    // Mock implementation - replace with actual AI API call
    const factors = [];
    
    // Content completeness
    if (content.text && content.text.length > 100) factors.push(8);
    else factors.push(4);
    
    // Subject line quality
    if (content.subject_line && content.subject_line.length > 10 && content.subject_line.length < 60) {
      factors.push(8);
    } else {
      factors.push(5);
    }
    
    // Structure indicators
    const hasIntro = content.text?.toLowerCase().includes('hello') || content.text?.toLowerCase().includes('hi');
    const hasConclusion = content.text?.toLowerCase().includes('thanks') || content.text?.toLowerCase().includes('regards');
    
    if (hasIntro && hasConclusion) factors.push(9);
    else if (hasIntro || hasConclusion) factors.push(7);
    else factors.push(5);
    
    return factors.reduce((sum, score) => sum + score, 0) / factors.length;
  }
}