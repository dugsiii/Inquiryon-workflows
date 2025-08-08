// src/quality/assessors/ai/EngagementAssessor.ts - REPLACE your current file with this:

import { BaseAssessor } from '../BaseAssessor.js';
import { QualityMetric, ContentToAssess } from '../../types.js';
import { LLMManager } from '../../llm/LLMManager.js';

export class EngagementAssessor extends BaseAssessor {
  readonly name = 'engagement';
  readonly category = 'ai' as const;
  readonly defaultWeight = 0.35;

  private llmManager?: LLMManager;  // ← Changed from apiKey to llmManager

  constructor(llmManager?: LLMManager) {  // ← Changed parameter type
    super();
    this.llmManager = llmManager;
  }

  async assess(content: ContentToAssess, config: any = {}): Promise<QualityMetric> {
    if (!this.llmManager) {
      return this.createMetric(5, 'LLM Manager not configured', ['Configure LLM providers for AI assessment']);
    }

    try {
      const score = await this.predictEngagement(content, config);
      return this.createMetric(score, `AI engagement prediction (${content.type})`);
    } catch (error) {
      return this.createMetric(5, 'AI engagement assessment failed', ['LLM service temporarily unavailable']);
    }
  }

  private async predictEngagement(content: ContentToAssess, config: any): Promise<number> {
    const prompt = `
    Rate the engagement potential of this ${content.type} content on a scale of 1-10.
    
    Consider:
    - Subject line appeal (if applicable)
    - Content structure and flow
    - Call-to-action strength
    - Emotional appeal
    - Value proposition clarity
    
    Content:
    Subject: ${content.subject_line || 'No subject line'}
    Body: ${content.text || 'No content'}
    
    Target audience: ${config.audience || 'general'}
    
    Respond with just a number from 1-10, followed by a brief explanation.
    Format: "Score: X\nReason: [brief explanation]"
    `;

    const response = await this.llmManager!.prompt(prompt, {
      temperature: 0.1,
      maxTokens: 200
    });

    const scoreMatch = response.content.match(/Score:\s*(\d+(?:\.\d+)?)/);
    return scoreMatch ? Math.min(10, Math.max(1, parseFloat(scoreMatch[1]))) : 5;
  }
}