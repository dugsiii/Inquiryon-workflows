import { BaseAssessor } from '../BaseAssessor.js';
import { QualityMetric, ContentToAssess } from '../../types.js';
import { LLMManager } from '../../llm/LLMManager.js';

export class OverallQualityAssessor extends BaseAssessor {
  readonly name = 'overall-quality';
  readonly category = 'ai' as const;
  readonly defaultWeight = 0.4;

  private llmManager?: LLMManager;

  constructor(llmManager?: LLMManager) {
    super();
    this.llmManager = llmManager;
  }

  async assess(content: ContentToAssess, config: any = {}): Promise<QualityMetric> {
    if (!this.llmManager) {
      return this.createMetric(5, 'LLM Manager not configured', ['Configure LLM providers for AI assessment']);
    }

    try {
      const score = await this.assessOverallQuality(content, config);
      return this.createMetric(score, 'AI-powered overall quality assessment');
    } catch (error) {
      return this.createMetric(5, 'Overall quality assessment failed', ['LLM service temporarily unavailable']);
    }
  }

  private async assessOverallQuality(content: ContentToAssess, config: any): Promise<number> {
    const prompt = `
    Rate the overall quality of this ${content.type} content on a scale of 1-10.
    
    Content Details:
    Subject: ${content.subject_line || 'No subject line'}
    Body: ${content.text || 'No content'}
    Content Type: ${content.type}
    Target Audience: ${config.audience || 'general'}
    
    Evaluate based on:
    
    CLARITY & COHERENCE (25%):
    - Is the message clear and easy to understand?
    - Does the content flow logically?
    - Are ideas well-organized?
    
    GRAMMAR & WRITING QUALITY (20%):
    - Proper grammar, spelling, and punctuation
    - Sentence structure and readability
    - Professional presentation
    
    VALUE & RELEVANCE (25%):
    - Does this provide value to the target audience?
    - Is the information relevant and useful?
    - Is it worth the reader's time?
    
    ENGAGEMENT FACTORS (15%):
    - Compelling subject line (if applicable)
    - Engaging tone and style
    - Clear call-to-action or next steps
    
    COMPLETENESS & STRUCTURE (15%):
    - Has all necessary components for content type
    - Appropriate length and depth
    - Professional formatting and structure
    
    Rate the overall quality on a scale of 1-10:
    1-2 = Poor quality (major issues, needs complete rewrite)
    3-4 = Below average (significant improvements needed)
    5-6 = Average (acceptable but could be better)
    7-8 = Good quality (minor improvements needed)
    9-10 = Excellent quality (ready to publish)
    
    Format: "Score: X\nAssessment: [brief explanation covering main strengths and weaknesses]"
    `;

    const response = await this.llmManager!.prompt(prompt, {
      temperature: 0.1,
      maxTokens: 400
    });

    const scoreMatch = response.content.match(/Score:\s*(\d+(?:\.\d+)?)/);
    return scoreMatch ? Math.min(10, Math.max(1, parseFloat(scoreMatch[1]))) : 5;
  }
}