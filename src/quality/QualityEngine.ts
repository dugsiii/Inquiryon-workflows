import { BaseAssessor } from './assessors/BaseAssessor.js';
import { QualityResult, QualityConfig, ContentToAssess, QualityMetric } from './types.js';

// Import all built-in assessors
import { 
  WordCountAssessor, 
  ReadabilityAssessor, 
  GrammarAssessor 
} from './assessors/basic/index.js';
import { 
  EngagementAssessor, 
  BrandVoiceAssessor, 
  OverallQualityAssessor 
} from './assessors/ai/index.js';
import { NewsletterAssessor } from './assessors/domain/index.js';

export class QualityEngine {
  private assessors = new Map<string, BaseAssessor>();
  private defaultConfig: QualityConfig = {
    threshold: 7.0,
    enabledAssessors: ['word-count', 'readability', 'grammar'],
    weights: {}
  };

  constructor(config?: Partial<QualityConfig>) {
    this.defaultConfig = { ...this.defaultConfig, ...config };
    this.registerBuiltInAssessors();
  }

  private async registerBuiltInAssessors(): Promise<void> {
    // Basic assessors (always available)
    this.registerAssessor(new WordCountAssessor());
    this.registerAssessor(new ReadabilityAssessor());
    this.registerAssessor(new GrammarAssessor());
    
    // Domain-specific assessors
    this.registerAssessor(new NewsletterAssessor());
    
    // AI assessors (only if providers are available)
    try {
      const { LLMProviderFactory } = await import('./llm/LLMProviderFactory.js');
      const availableProviders = await LLMProviderFactory.getAvailableProvidersAsync();
      
      if (availableProviders.length > 0) {
        // Don't register AI assessors here - let users do it manually
        console.log(`LLM providers available: ${availableProviders.join(', ')}`);
      }
    } catch (error) {
      console.debug('LLM system not available');
    }
  }

  registerAssessor(assessor: BaseAssessor): void {
    this.assessors.set(assessor.name, assessor);
  }

  async assess(content: ContentToAssess, config?: Partial<QualityConfig>): Promise<QualityResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const metrics: QualityMetric[] = [];

    // Run enabled assessors
    for (const assessorName of finalConfig.enabledAssessors) {
      const assessor = this.assessors.get(assessorName);
      if (assessor) {
        try {
          const metric = await assessor.assess(content, finalConfig.assessorConfigs?.[assessorName]);
          
          // Apply custom weight if specified
          if (finalConfig.weights?.[assessorName]) {
            metric.weight = finalConfig.weights[assessorName];
          }
          
          metrics.push(metric);
        } catch (error) {
          console.error(`Assessor ${assessorName} failed:`, error);
        }
      }
    }

    // Calculate weighted overall score
    const totalWeight = metrics.reduce((sum, metric) => sum + metric.weight, 0);
    const weightedSum = metrics.reduce((sum, metric) => sum + (metric.score * metric.weight), 0);
    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      overallScore: Math.round(overallScore * 10) / 10,
      metrics,
      passed: overallScore >= finalConfig.threshold,
      threshold: finalConfig.threshold,
      timestamp: new Date(),
      assessorTypes: Array.from(new Set(metrics.map(m => m.category)))
    };
  }

  getAvailableAssessors(): string[] {
    return Array.from(this.assessors.keys());
  }

  getAssessorsByCategory(category: 'basic' | 'ai' | 'external' | 'domain'): string[] {
    return Array.from(this.assessors.values())
      .filter(assessor => assessor.category === category)
      .map(assessor => assessor.name);
  }

  // Preset configurations for common use cases
  static newsletterConfig(): Partial<QualityConfig> {
    return {
      threshold: 7.5,
      enabledAssessors: ['word-count', 'readability', 'grammar', 'newsletter-structure', 'engagement'],
      weights: {
        'newsletter-structure': 0.3,
        'readability': 0.25,
        'grammar': 0.2,
        'word-count': 0.15,
        'engagement': 0.1
      }
    };
  }

  static blogConfig(): Partial<QualityConfig> {
    return {
      threshold: 7.0,
      enabledAssessors: ['word-count', 'readability', 'grammar', 'overall-quality'],
      weights: {
        'overall-quality': 0.4,
        'readability': 0.3,
        'grammar': 0.2,
        'word-count': 0.1
      }
    };
  }

  static quickConfig(): Partial<QualityConfig> {
    return {
      threshold: 6.0,
      enabledAssessors: ['word-count', 'grammar'],
      weights: {
        'grammar': 0.7,
        'word-count': 0.3
      }
    };
  }
}