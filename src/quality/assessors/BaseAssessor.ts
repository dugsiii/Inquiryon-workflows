import { QualityMetric, ContentToAssess } from '../types.js';

export abstract class BaseAssessor {
  abstract readonly name: string;
  abstract readonly category: 'basic' | 'ai' | 'external' | 'domain';
  abstract readonly defaultWeight: number;

  abstract assess(content: ContentToAssess, config?: any): Promise<QualityMetric>;

  protected createMetric(
    score: number, 
    details?: string, 
    suggestions?: string[], 
    weight?: number
  ): QualityMetric {
    return {
      name: this.name,
      score: Math.max(0, Math.min(10, score)),
      weight: weight || this.defaultWeight,
      details,
      suggestions,
      category: this.category
    };
  }
}